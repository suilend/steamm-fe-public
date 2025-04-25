import BigNumber from "bignumber.js";
import pLimit from "p-limit";
import useSWR from "swr";

import { showErrorToast, useSettingsContext } from "@suilend/frontend-sui-next";
import { formatRewards } from "@suilend/sdk";
import { LstClient } from "@suilend/springsui-sdk";
import { SteammSDK } from "@suilend/steamm-sdk";
import { OracleQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm/structs";

import {
  AppData,
  BanksData,
  OraclesData,
  PoolsData,
} from "@/contexts/AppContext";
import { formatPair } from "@/lib/format";
import { normalizeRewards } from "@/lib/liquidityMining";
import { ParsedPool, QuoterId } from "@/lib/types";

export default function useFetchPoolsData(
  steammClient: SteammSDK,
  appData: AppData | undefined,
  oraclesData: OraclesData | undefined,
  banksData: BanksData | undefined,
) {
  const { suiClient } = useSettingsContext();

  // Data
  const dataFetcher = async () => {
    if (!appData || !oraclesData || !banksData)
      return undefined as unknown as PoolsData; // In practice `dataFetcher` won't be called if `appData`, `oraclesData`, or `banksData` is falsy

    const { mainMarket, coinMetadataMap, bankObjs, poolObjs } = appData;
    const { bTokenTypeCoinTypeMap, bankMap } = banksData;
    const limit10 = pLimit(10);

    // LSTs
    const lstAprPercentMapEntries: [string, BigNumber][] = await Promise.all(
      Object.values(appData.LIQUID_STAKING_INFO_MAP)
        .filter((LIQUID_STAKING_INFO) =>
          poolObjs.some(
            (poolObj) =>
              bTokenTypeCoinTypeMap[poolObj.poolInfo.coinTypeA] ===
                LIQUID_STAKING_INFO.type ||
              bTokenTypeCoinTypeMap[poolObj.poolInfo.coinTypeB] ===
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
        poolObjs.map((poolObj) =>
          limit10(async () => {
            const { poolInfo, pool } = poolObj;

            const id = poolInfo.poolId;
            const quoterId = poolInfo.quoterType.endsWith("cpmm::CpQuoter")
              ? QuoterId.CPMM
              : poolInfo.quoterType.endsWith("omm::OracleQuoter")
                ? QuoterId.ORACLE
                : QuoterId.CPMM; // Should never need to use the fallback

            const bTokenTypeA = poolInfo.coinTypeA;
            const bTokenTypeB = poolInfo.coinTypeB;
            const bTokenTypes: [string, string] = [bTokenTypeA, bTokenTypeB];

            const coinTypeA = bTokenTypeCoinTypeMap[bTokenTypeA];
            const coinTypeB = bTokenTypeCoinTypeMap[bTokenTypeB];
            const coinTypes: [string, string] = [coinTypeA, coinTypeB];

            const redeemQuote = await steammClient.Pool.quoteRedeem({
              lpTokens: pool.lpSupply.value,
              poolInfo,
              bankInfoA: bankObjs.find(
                (bankObj) => bankObj.bankInfo.btokenType === poolInfo.coinTypeA,
              )!.bankInfo,
              bankInfoB: bankObjs.find(
                (bankObj) => bankObj.bankInfo.btokenType === poolInfo.coinTypeB,
              )!.bankInfo,
            });

            const balanceA = new BigNumber(
              redeemQuote.withdrawA.toString(),
            ).div(10 ** coinMetadataMap[coinTypes[0]].decimals);
            const balanceB = new BigNumber(
              redeemQuote.withdrawB.toString(),
            ).div(10 ** coinMetadataMap[coinTypes[1]].decimals);

            const balances: [BigNumber, BigNumber] = [balanceA, balanceB];

            let priceA =
              quoterId === QuoterId.ORACLE
                ? oraclesData.oracleIndexOracleInfoPriceMap[
                    +(pool.quoter as OracleQuoter).oracleIndexA.toString()
                  ].price
                : (oraclesData.coinTypeOracleInfoPriceMap[coinTypeA]?.price ??
                  mainMarket.reserveMap[coinTypeA]?.price ??
                  undefined);
            let priceB =
              quoterId === QuoterId.ORACLE
                ? oraclesData.oracleIndexOracleInfoPriceMap[
                    +(pool.quoter as OracleQuoter).oracleIndexB.toString()
                  ].price
                : (oraclesData.coinTypeOracleInfoPriceMap[coinTypeB]?.price ??
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
      lstAprPercentMap,
      rewardMap: lmMarket_rewardMap,

      pools: sortedPools,
    };
  };

  const { data, mutate } = useSWR<PoolsData>(
    !appData || !oraclesData || !banksData ? null : "poolsData",
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
