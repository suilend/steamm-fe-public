import { SuiPriceServiceConnection } from "@pythnetwork/pyth-sui-js";
import BigNumber from "bignumber.js";
import pLimit from "p-limit";
import useSWR from "swr";

import { showErrorToast, useSettingsContext } from "@suilend/frontend-sui-next";
import { formatRewards, toHexString } from "@suilend/sdk";
import { LstClient } from "@suilend/springsui-sdk";
import { OracleInfo, SteammSDK } from "@suilend/steamm-sdk";
import { OracleQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm/structs";

import { AppData, BanksData, PoolsData } from "@/contexts/AppContext";
import { formatPair } from "@/lib/format";
import { normalizeRewards } from "@/lib/liquidityMining";
import { ORACLE_INDEX_TYPE_COINTYPE_MAP, OracleType } from "@/lib/oracles";
import { ParsedPool, QuoterId } from "@/lib/types";

export default function useFetchPoolsData(
  steammClient: SteammSDK,
  appData: AppData | undefined,
  banksData: BanksData | undefined,
) {
  const { suiClient } = useSettingsContext();

  // Data
  const dataFetcher = async () => {
    if (!appData || !banksData) return undefined as unknown as PoolsData; // In practice `dataFetcher` won't be called if `appData` or `banksData` is falsy

    const { mainMarket, coinMetadataMap, poolInfos } = appData;
    const { bTokenTypeCoinTypeMap, bankMap } = banksData;
    const limit3 = pLimit(3);
    const limit10 = pLimit(10);

    // Oracles
    const oracleInfos = await steammClient.getOracles();

    const oracleIndexOracleInfoMap: Record<number, OracleInfo> =
      oracleInfos.reduce(
        (acc, oracleInfo, index) => ({ ...acc, [index]: oracleInfo }),
        {} as Record<number, OracleInfo>,
      );

    const pythConnection = new SuiPriceServiceConnection(
      "https://hermes.pyth.network",
    );

    const oracleIndexOracleInfoPriceEntries: [
      number,
      { oracleInfo: OracleInfo; price: BigNumber },
    ][] = await Promise.all(
      Object.entries(oracleIndexOracleInfoMap).map(([index, oracleInfo]) =>
        limit3<[], [number, { oracleInfo: OracleInfo; price: BigNumber }]>(
          async () => {
            const priceIdentifier =
              typeof oracleInfo.oracleIdentifier === "string"
                ? oracleInfo.oracleIdentifier
                : toHexString(oracleInfo.oracleIdentifier);

            if (oracleInfo.oracleType === OracleType.PYTH) {
              const pythPriceFeeds =
                (await pythConnection.getLatestPriceFeeds([priceIdentifier])) ??
                [];

              return [
                +index,
                {
                  oracleInfo,
                  price: new BigNumber(
                    pythPriceFeeds[0]
                      .getPriceUnchecked()
                      .getPriceAsNumberUnchecked(),
                  ),
                },
              ];
            } else if (oracleInfo.oracleType === OracleType.SWITCHBOARD) {
              return [
                +index,
                {
                  oracleInfo,
                  price: new BigNumber(0.000001), // TODO: Fetch Switchboard price
                },
              ];
            } else {
              throw new Error(`Unknown oracle type: ${oracleInfo.oracleType}`);
            }
          },
        ),
      ),
    );
    const oracleIndexOracleInfoPriceMap = Object.fromEntries(
      oracleIndexOracleInfoPriceEntries,
    );

    const coinTypeOracleInfoPriceMap: Record<
      string,
      { oracleInfo: OracleInfo; price: BigNumber }
    > = oracleIndexOracleInfoPriceEntries.reduce(
      (acc, [index, value]) => ({
        ...acc,
        [ORACLE_INDEX_TYPE_COINTYPE_MAP[index].coinType]: value,
      }),
      {} as Record<string, { oracleInfo: OracleInfo; price: BigNumber }>,
    );

    // LSTs
    const lstAprPercentMapEntries: [string, BigNumber][] = await Promise.all(
      Object.values(appData.LIQUID_STAKING_INFO_MAP)
        .filter((LIQUID_STAKING_INFO) =>
          poolInfos.some(
            (poolInfo) =>
              bTokenTypeCoinTypeMap[poolInfo.coinTypeA] ===
                LIQUID_STAKING_INFO.type ||
              bTokenTypeCoinTypeMap[poolInfo.coinTypeB] ===
                LIQUID_STAKING_INFO.type,
          ),
        )
        .map((LIQUID_STAKING_INFO) =>
          limit10<[], [string, BigNumber]>(async () => {
            const lstClient = await LstClient.initialize(
              suiClient,
              LIQUID_STAKING_INFO,
            );

            const apr = await lstClient.getSpringSuiApy(); // TODO: Use APR
            const aprPercent = new BigNumber(apr).times(100);

            return [LIQUID_STAKING_INFO.type, aprPercent];
          }),
        ),
    );
    const lstAprPercentMap = Object.fromEntries(lstAprPercentMapEntries);

    // Pools
    const pools: ParsedPool[] = (
      await Promise.all(
        poolInfos.map((poolInfo) =>
          limit10(async () => {
            const id = poolInfo.poolId;
            const quoterId = poolInfo.quoterType.endsWith("cpmm::CpQuoter")
              ? QuoterId.CPMM
              : poolInfo.quoterType.endsWith("omm::OracleQuoter")
                ? QuoterId.ORACLE
                : QuoterId.CPMM; // Should never need to use the fallback

            const bTokenTypeA = poolInfo.coinTypeA;
            const bTokenTypeB = poolInfo.coinTypeB;
            const bTokenTypes: [string, string] = [bTokenTypeA, bTokenTypeB];
            if (
              bTokenTypeA.startsWith("0x10e03a93cf1e3d") ||
              bTokenTypeB.startsWith("0x10e03a93cf1e3d")
            )
              return undefined; // Skip pools with test bTokens

            const coinTypeA = bTokenTypeCoinTypeMap[bTokenTypeA];
            const coinTypeB = bTokenTypeCoinTypeMap[bTokenTypeB];
            const coinTypes: [string, string] = [coinTypeA, coinTypeB];

            const pool =
              quoterId === QuoterId.CPMM
                ? await steammClient.fullClient.fetchConstantProductPool(id)
                : quoterId === QuoterId.ORACLE
                  ? await steammClient.fullClient.fetchOraclePool(id)
                  : await steammClient.fullClient.fetchConstantProductPool(id); // Should never need to use the fallback

            const redeemQuote = await steammClient.Pool.quoteRedeem({
              lpTokens: pool.lpSupply.value,
              poolInfo,
              bankInfoA: bankMap[coinTypes[0]].bankInfo,
              bankInfoB: bankMap[coinTypes[1]].bankInfo,
            });

            const withdrawA = new BigNumber(
              redeemQuote.withdrawA.toString(),
            ).div(10 ** coinMetadataMap[coinTypes[0]].decimals);
            const withdrawB = new BigNumber(
              redeemQuote.withdrawB.toString(),
            ).div(10 ** coinMetadataMap[coinTypes[1]].decimals);

            let balanceA = new BigNumber(pool.balanceA.value.toString()).div(
              10 ** coinMetadataMap[coinTypeA].decimals,
            );
            let balanceB = new BigNumber(pool.balanceB.value.toString()).div(
              10 ** coinMetadataMap[coinTypeB].decimals,
            );
            balanceA = balanceA.times(withdrawA.div(balanceA));
            balanceB = balanceB.times(withdrawB.div(balanceB));

            const balances: [BigNumber, BigNumber] = [balanceA, balanceB];

            let priceA =
              quoterId === QuoterId.ORACLE
                ? oracleIndexOracleInfoPriceMap[
                    +(pool.quoter as OracleQuoter).oracleIndexA.toString()
                  ].price
                : (coinTypeOracleInfoPriceMap[coinTypeA]?.price ??
                  mainMarket.reserveMap[coinTypeA]?.price ??
                  undefined);
            let priceB =
              quoterId === QuoterId.ORACLE
                ? oracleIndexOracleInfoPriceMap[
                    +(pool.quoter as OracleQuoter).oracleIndexB.toString()
                  ].price
                : (coinTypeOracleInfoPriceMap[coinTypeB]?.price ??
                  mainMarket.reserveMap[coinTypeB]?.price ??
                  undefined);

            if (priceA === undefined && priceB === undefined) {
              console.error(
                `Skipping pool with id ${id}, quoterId ${quoterId} - missing prices for both assets (no Pyth or Switchboard price feed, no Suilend main market reserve) for coinType(s) ${coinTypes.join(", ")}`,
              );
              return;
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

            const lpSupply = new BigNumber(pool.lpSupply.value.toString()).div(
              10 ** 9,
            );
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
          }),
        ),
      )
    ).filter(Boolean) as ParsedPool[];

    const sortedPools = pools.slice().sort((a, b) => {
      return formatPair(
        a.coinTypes.map((coinType) => coinMetadataMap[coinType].symbol),
      ).toLowerCase() <
        formatPair(
          b.coinTypes.map((coinType) => coinMetadataMap[coinType].symbol),
        ).toLowerCase()
        ? -1
        : 1; // Sort by pair (ascending)
    });

    // Rewards
    const lmMarket_rewardMap = normalizeRewards(
      formatRewards(
        appData.lmMarket.reserveMap,
        appData.lmMarket.rewardCoinMetadataMap,
        appData.lmMarket.rewardPriceMap,
        [],
      ),
      appData.lmMarket.reserveMap,
      sortedPools,
    );

    return {
      coinTypeOracleInfoPriceMap,
      lstAprPercentMap,
      rewardMap: lmMarket_rewardMap,

      pools: sortedPools,
    };
  };

  const { data, mutate } = useSWR<PoolsData>(
    !appData || !banksData ? null : "poolsData",
    dataFetcher,
    {
      refreshInterval: 30 * 1000,
      onSuccess: (data) => {
        console.log("Refreshed pools data", data);
      },
      onError: (err) => {
        showErrorToast(
          "Failed to refresh pools data. Please check your internet connection or change RPC providers in Settings.",
          err,
        );
        console.error(err);
      },
    },
  );

  return { data, mutateData: mutate };
}
