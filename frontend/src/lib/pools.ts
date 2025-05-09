import BigNumber from "bignumber.js";

import { PoolInfo, RedeemQuote, SteammSDK } from "@suilend/steamm-sdk";
import { OracleQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm/structs";

import { AppData } from "@/contexts/AppContext";
import { formatPair } from "@/lib/format";
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { ParsedPool, QUOTER_ID_NAME_MAP, QuoterId } from "@/lib/types";

export const AMPLIFIER_TOOLTIP =
  "The amplifier determines the concentration of the pool. Higher values are more suitable for more stable assets, while lower values are more suitable for more volatile assets.";

const getPoolSlug = (appData: AppData, pool: ParsedPool) =>
  `${formatPair(
    pool.coinTypes.map((coinType) => appData.coinMetadataMap[coinType].symbol),
  )}-${QUOTER_ID_NAME_MAP[pool.quoterId]}-${pool.feeTierPercent.times(100)}`;
export const getPoolUrl = (appData: AppData, pool: ParsedPool) =>
  `${POOL_URL_PREFIX}/${pool.id}-${getPoolSlug(appData, pool)}`;

export const getQuoterId = (poolInfo: PoolInfo) =>
  poolInfo.quoterType.endsWith("omm::OracleQuoter")
    ? QuoterId.ORACLE
    : poolInfo.quoterType.endsWith("omm_v2::OracleQuoterV2")
      ? QuoterId.ORACLE_V2
      : QuoterId.CPMM;

export const fetchPool = (steammClient: SteammSDK, poolInfo: PoolInfo) => {
  const id = poolInfo.poolId;
  const quoterId = getQuoterId(poolInfo);

  return quoterId === QuoterId.ORACLE
    ? steammClient.fullClient.fetchOraclePool(id)
    : quoterId === QuoterId.ORACLE_V2
      ? steammClient.fullClient.fetchOracleV2Pool(id)
      : steammClient.fullClient.fetchConstantProductPool(id);
};

export const getParsedPool = (
  appData: Pick<
    AppData,
    | "suilend"
    | "coinMetadataMap"
    | "oracleIndexOracleInfoPriceMap"
    | "coinTypeOracleInfoPriceMap"
    | "bTokenTypeCoinTypeMap"
    | "bankMap"
  >,

  poolInfo: PoolInfo,
  pool: ParsedPool["pool"],
  redeemQuote: RedeemQuote,
): ParsedPool | undefined => {
  {
    const {
      suilend,
      coinMetadataMap,
      oracleIndexOracleInfoPriceMap,
      coinTypeOracleInfoPriceMap,
      bTokenTypeCoinTypeMap,
      bankMap,
    } = appData;

    const id = poolInfo.poolId;
    const quoterId = poolInfo.quoterType.endsWith("omm::OracleQuoter")
      ? QuoterId.ORACLE
      : poolInfo.quoterType.endsWith("omm_v2::OracleQuoterV2")
        ? QuoterId.ORACLE_V2
        : QuoterId.CPMM;

    const bTokenTypeA = poolInfo.coinTypeA;
    const bTokenTypeB = poolInfo.coinTypeB;
    const bTokenTypes: [string, string] = [bTokenTypeA, bTokenTypeB];

    const coinTypeA = bTokenTypeCoinTypeMap[bTokenTypeA];
    const coinTypeB = bTokenTypeCoinTypeMap[bTokenTypeB];
    const coinTypes: [string, string] = [coinTypeA, coinTypeB];

    const balanceA = new BigNumber(redeemQuote.withdrawA.toString()).div(
      10 ** coinMetadataMap[coinTypes[0]].decimals,
    );
    const balanceB = new BigNumber(redeemQuote.withdrawB.toString()).div(
      10 ** coinMetadataMap[coinTypes[1]].decimals,
    );

    const balances: [BigNumber, BigNumber] = [balanceA, balanceB];

    let priceA = [QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(quoterId)
      ? oracleIndexOracleInfoPriceMap[
          +(pool.quoter as OracleQuoter).oracleIndexA.toString()
        ].price
      : (coinTypeOracleInfoPriceMap[coinTypeA]?.price ??
        suilend.mainMarket.reserveMap[coinTypeA]?.price ??
        undefined);
    let priceB = [QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(quoterId)
      ? oracleIndexOracleInfoPriceMap[
          +(pool.quoter as OracleQuoter).oracleIndexB.toString()
        ].price
      : (coinTypeOracleInfoPriceMap[coinTypeB]?.price ??
        suilend.mainMarket.reserveMap[coinTypeB]?.price ??
        undefined);

    if (priceA === undefined && priceB === undefined) {
      console.error(
        `Skipping pool with id ${id}, quoterId ${quoterId} - missing prices for both assets (no Pyth or Switchboard price feed, no Suilend main market reserve) for coinType(s) ${coinTypes.join(", ")}`,
      );
      return undefined;
    } else if (priceA === undefined) {
      console.warn(
        `Missing price for coinTypeA ${coinTypeA}, using balance ratio to calculate price (pool with id ${id}, quoterId ${quoterId})`,
      );
      priceA = !balanceA.eq(0)
        ? balanceB.div(balanceA).times(priceB)
        : new BigNumber(0); // Assumes the pool is balanced (only true for arb'd CPMM quoter)
    } else if (priceB === undefined) {
      console.warn(
        `Missing price for coinTypeB ${coinTypeB}, using balance ratio to calculate price (pool with id ${id}, quoterId ${quoterId})`,
      );
      priceB = !balanceB.eq(0)
        ? balanceA.div(balanceB).times(priceA)
        : new BigNumber(0); // Assumes the pool is balanced (only true for arb'd CPMM quoter)
    }
    const prices: [BigNumber, BigNumber] = [priceA, priceB];

    const lpSupply = new BigNumber(pool.lpSupply.value.toString()).div(10 ** 9);
    const tvlUsd = balanceA.times(priceA).plus(balanceB.times(priceB));

    const feeTierPercent = new BigNumber(poolInfo.swapFeeBps).div(100);
    const protocolFeePercent = new BigNumber(
      pool.protocolFees.config.feeNumerator.toString(),
    )
      .div(pool.protocolFees.config.feeDenominator.toString())
      .times(feeTierPercent.div(100))
      .times(100);

    const suilendWeightedAverageDepositAprPercent = tvlUsd.gt(0)
      ? coinTypes
          .reduce((acc, coinType, index) => {
            const bank = bankMap[coinType];
            if (!bank) return acc;

            return acc.plus(
              new BigNumber(
                bank.suilendDepositAprPercent
                  .times(bank.utilizationPercent)
                  .div(100),
              ).times(prices[index].times(balances[index])),
            );
          }, new BigNumber(0))
          .div(tvlUsd)
      : new BigNumber(0);

    return {
      id,
      pool,
      poolInfo,
      quoterId,

      lpTokenType: poolInfo.lpTokenType,
      bTokenTypes,
      coinTypes,
      balances,
      prices,

      lpSupply,
      tvlUsd,

      feeTierPercent,
      protocolFeePercent,

      suilendWeightedAverageDepositAprPercent,
    };
  }
};
