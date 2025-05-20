import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";

import {
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_USDC_COINTYPE,
  isStablecoin,
  isSui,
} from "@suilend/frontend-sui";

import { BankInfo, OracleInfo, PoolInfo, RedeemQuote } from "..";
import { Bank } from "../_codegen/_generated/steamm/bank/structs";
import { CpQuoter } from "../_codegen/_generated/steamm/cpmm/structs";
import { OracleQuoter } from "../_codegen/_generated/steamm/omm/structs";
import { OracleQuoterV2 } from "../_codegen/_generated/steamm/omm_v2/structs";
import { Pool } from "../_codegen/_generated/steamm/pool/structs";

// Types

export enum QuoterId {
  CPMM = "cpmm",
  ORACLE = "oracle",
  ORACLE_V2 = "oracle_v2",
}
export const QUOTER_ID_NAME_MAP: Record<QuoterId, string> = {
  [QuoterId.CPMM]: "CPMM",
  [QuoterId.ORACLE]: "Oracle V1",
  [QuoterId.ORACLE_V2]: "Oracle V2",
};

export enum OracleType {
  PYTH = "pyth",
  SWITCHBOARD = "switchboard",
}

export type BankObj = {
  bankInfo: BankInfo;
  bank: Bank<string, string, string>;
  totalFunds: number;
};

export type ParsedBank = {
  id: string;
  bank: Bank<string, string, string>;
  bankInfo: BankInfo;
  coinType: string;
  bTokenType: string;

  fundsAvailable: BigNumber;
  fundsDeployed: BigNumber;
  totalFunds: BigNumber;

  bTokenSupply: BigNumber;
  bTokenExchangeRate: BigNumber;

  utilizationPercent: BigNumber;
  suilendDepositAprPercent: BigNumber;
};

export type PoolObj = {
  poolInfo: PoolInfo;
  pool:
    | Pool<string, string, CpQuoter, string>
    | Pool<string, string, OracleQuoter, string>
    | Pool<string, string, OracleQuoterV2, string>;
  redeemQuote: RedeemQuote;
};

export type ParsedPool = {
  id: string;
  pool:
    | Pool<string, string, CpQuoter, string>
    | Pool<string, string, OracleQuoter, string>
    | Pool<string, string, OracleQuoterV2, string>;
  poolInfo: PoolInfo;
  quoterId: QuoterId;

  lpTokenType: string;
  bTokenTypes: [string, string];
  coinTypes: [string, string];
  balances: [BigNumber, BigNumber];
  prices: [BigNumber, BigNumber];

  lpSupply: BigNumber;
  tvlUsd: BigNumber;

  feeTierPercent: BigNumber;
  protocolFeePercent: BigNumber;

  suilendDepositAprPercents: [BigNumber, BigNumber];
  suilendWeightedAverageDepositAprPercent: BigNumber;

  //
  volumeUsd_24h?: BigNumber; // Used on Home page
  aprPercent_24h?: BigNumber; // Used on Home and Portfolio pages
};

// Parsers

export const getParsedBank = (
  data: {
    suilend: {
      mainMarket: {
        depositAprPercentMap: Record<string, BigNumber>;
      };
    };
    coinMetadataMap: Record<string, CoinMetadata>;
  },
  bankInfo: BankInfo,
  bank: ParsedBank["bank"],
  totalFundsRaw: number,
): ParsedBank => {
  const { suilend, coinMetadataMap } = data;

  const id = bankInfo.bankId;
  const coinType = bankInfo.coinType;
  const bTokenType = bankInfo.btokenType;

  const totalFunds = new BigNumber(totalFundsRaw.toString()).div(
    10 ** coinMetadataMap[coinType].decimals,
  );

  const fundsAvailable = new BigNumber(
    bank.fundsAvailable.value.toString(),
  ).div(10 ** coinMetadataMap[coinType].decimals);
  const fundsDeployed = totalFunds.minus(fundsAvailable);

  const bTokenSupply = new BigNumber(bank.btokenSupply.value.toString()).div(
    10 ** coinMetadataMap[coinType].decimals,
  );
  const bTokenExchangeRate = totalFunds.div(bTokenSupply);

  const utilizationPercent = totalFunds.gt(0)
    ? fundsDeployed.div(totalFunds).times(100)
    : new BigNumber(0);
  const suilendDepositAprPercent =
    suilend.mainMarket.depositAprPercentMap[coinType] ?? new BigNumber(0);

  return {
    id,
    bank,
    bankInfo,
    coinType,
    bTokenType,

    fundsAvailable,
    fundsDeployed,
    totalFunds,

    bTokenSupply,
    bTokenExchangeRate,

    utilizationPercent,
    suilendDepositAprPercent,
  };
};

export const getParsedPool = (
  data: {
    coinMetadataMap: Record<string, CoinMetadata>;
    lstAprPercentMap: Record<string, BigNumber>;

    // Oracles
    oracleIndexOracleInfoPriceMap: Record<
      number,
      { oracleInfo: OracleInfo; price: BigNumber }
    >;
    coinTypeOracleInfoPriceMap: Record<
      string,
      { oracleInfo: OracleInfo; price: BigNumber }
    >;

    // Banks
    bTokenTypeCoinTypeMap: Record<string, string>;
    bankMap: Record<string, ParsedBank>;
  },
  poolInfo: PoolInfo,
  pool: ParsedPool["pool"],
  redeemQuote: RedeemQuote,
): ParsedPool | undefined => {
  {
    const {
      coinMetadataMap,
      lstAprPercentMap,
      oracleIndexOracleInfoPriceMap,
      coinTypeOracleInfoPriceMap,
      bTokenTypeCoinTypeMap,
      bankMap,
    } = data;

    const isLst = (coinType: string) =>
      Object.keys(lstAprPercentMap).includes(coinType);

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
    if (coinTypes.some((coinType) => coinType === undefined)) return undefined;

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
      : isSui(coinTypeA) || isLst(coinTypeA)
        ? coinTypeOracleInfoPriceMap[NORMALIZED_SUI_COINTYPE]?.price
        : isStablecoin(coinTypeA)
          ? coinTypeOracleInfoPriceMap[NORMALIZED_USDC_COINTYPE]?.price
          : coinTypeOracleInfoPriceMap[coinTypeA]?.price;
    let priceB = [QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(quoterId)
      ? oracleIndexOracleInfoPriceMap[
          +(pool.quoter as OracleQuoter).oracleIndexB.toString()
        ].price
      : isSui(coinTypeB) || isLst(coinTypeB)
        ? coinTypeOracleInfoPriceMap[NORMALIZED_SUI_COINTYPE]?.price
        : isStablecoin(coinTypeB)
          ? coinTypeOracleInfoPriceMap[NORMALIZED_USDC_COINTYPE]?.price
          : coinTypeOracleInfoPriceMap[coinTypeB]?.price;

    if (priceA === undefined && priceB === undefined) {
      console.error(
        `Skipping pool with id ${id}, quoterId ${quoterId} - missing prices for both assets (no Pyth or Switchboard price feed) for coinType(s) ${coinTypes.join(", ")}`,
      );
      return undefined;
    } else if (priceA === undefined) {
      console.warn(
        `Missing price for coinTypeA ${coinTypeA}, using balance ratio to calculate price (pool with id ${id}, quoterId ${quoterId})`,
      );
      priceA = !balanceA.eq(0)
        ? new BigNumber(
            balanceB.plus(
              quoterId === QuoterId.CPMM
                ? new BigNumber(
                    (pool.quoter as CpQuoter).offset.toString(),
                  ).div(10 ** coinMetadataMap[coinTypeB].decimals)
                : 0,
            ),
          )
            .div(balanceA)
            .times(priceB) // Assumes the pool is balanced (only true for arb'd CPMM pools)
        : new BigNumber(0);
    } else if (priceB === undefined) {
      console.warn(
        `Missing price for coinTypeB ${coinTypeB}, using balance ratio to calculate price (pool with id ${id}, quoterId ${quoterId})`,
      );
      priceB = !balanceB.eq(0)
        ? balanceA.div(balanceB).times(priceA) // Assumes the pool is balanced (only true for arb'd CPMM pools)
        : new BigNumber(0);
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

    const suilendDepositAprPercents = (
      tvlUsd.gt(0)
        ? coinTypes.map((coinType) => {
            const bank = bankMap[coinType];
            if (!bank) return new BigNumber(0);

            return new BigNumber(
              bank.suilendDepositAprPercent
                .times(bank.utilizationPercent)
                .div(100),
            );
          })
        : [new BigNumber(0), new BigNumber(0)]
    ) as [BigNumber, BigNumber];
    const suilendWeightedAverageDepositAprPercent = tvlUsd.gt(0)
      ? suilendDepositAprPercents
          .reduce(
            (acc, aprPercent, index) =>
              acc.plus(aprPercent.times(prices[index].times(balances[index]))),
            new BigNumber(0),
          )
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

      suilendDepositAprPercents,
      suilendWeightedAverageDepositAprPercent,
    };
  }
};
