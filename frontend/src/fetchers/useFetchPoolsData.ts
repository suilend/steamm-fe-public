import { PriceFeed, SuiPriceServiceConnection } from "@pythnetwork/pyth-sui-js";
import BigNumber from "bignumber.js";
import useSWR from "swr";

import { showErrorToast, useSettingsContext } from "@suilend/frontend-sui-next";
import { toHexString } from "@suilend/sdk";
import { LiquidStakingObjectInfo, LstClient } from "@suilend/springsui-sdk";
import { SteammSDK } from "@suilend/steamm-sdk";

import { AppData, BanksData, PoolsData } from "@/contexts/AppContext";
import { SPRINGSUI_ASSETS_URL } from "@/lib/constants";
import { formatPair } from "@/lib/format";
import { COINTYPE_ORACLE_INDEX_MAP } from "@/lib/oracles";
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

    // Oracles
    const oracles: any[] = []; // await steammClient.getOracles();

    const pythOracles = oracles.filter(
      (oracle) => oracle.oracleType === "pyth",
    );
    const switchboardOracles = oracles.filter(
      (oracle) => oracle.oracleType === "switchboard",
    );

    // Oracles - Pyth
    const pythConnection = new SuiPriceServiceConnection(
      "https://hermes.pyth.network",
    );

    const pythPriceIdentifiers = pythOracles.map((oracle) =>
      typeof oracle.oracleIdentifier === "string"
        ? oracle.oracleIdentifier
        : toHexString(oracle.oracleIdentifier),
    );

    const pythPriceFeeds: PriceFeed[] =
      (await pythConnection.getLatestPriceFeeds(pythPriceIdentifiers)) ?? [];

    const coinTypePythPriceMap: Record<string, BigNumber> = Object.fromEntries(
      Object.keys(COINTYPE_ORACLE_INDEX_MAP).map((coinType, index) => [
        coinType,
        new BigNumber(
          pythPriceFeeds[index].getPriceUnchecked().getPriceAsNumberUnchecked(),
        ),
      ]),
    );

    // Oracles - Switchboard
    const coinTypeSwitchboardPriceMap: Record<string, BigNumber> = {};

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
          (async () => {
            const lstClient = await LstClient.initialize(
              suiClient,
              LIQUID_STAKING_INFO,
            );

            const apr = await lstClient.getSpringSuiApy(); // TODO: Use APR
            const aprPercent = new BigNumber(apr).times(100);

            return [LIQUID_STAKING_INFO.type, aprPercent];
          })(),
        ),
    );
    const lstAprPercentMap = Object.fromEntries(lstAprPercentMapEntries);

    // Pools
    const pools: ParsedPool[] = (
      await Promise.all(
        poolInfos.map((poolInfo) =>
          (async () => {
            const id = poolInfo.poolId;
            const quoterId = poolInfo.quoterType.endsWith("cpmm::CpQuoter")
              ? QuoterId.CPMM
              : poolInfo.quoterType.endsWith("omm::OracleQuoter")
                ? QuoterId.ORACLE
                : QuoterId.CPMM; // Should never need to use the fallback

            const bTokenTypeA = poolInfo.coinTypeA;
            const bTokenTypeB = poolInfo.coinTypeB;
            const bTokenTypes = [bTokenTypeA, bTokenTypeB];
            if (
              bTokenTypeA.startsWith("0x10e03a93cf1e3d") ||
              bTokenTypeB.startsWith("0x10e03a93cf1e3d")
            )
              return undefined; // Skip pools with test bTokens

            const coinTypeA = bTokenTypeCoinTypeMap[bTokenTypeA];
            const coinTypeB = bTokenTypeCoinTypeMap[bTokenTypeB];
            const coinTypes = [coinTypeA, coinTypeB];

            const pool = await steammClient.fullClient.fetchPool(id);

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

            const balances = [balanceA, balanceB];

            let priceA =
              coinTypePythPriceMap[coinTypeA] ??
              coinTypeSwitchboardPriceMap[coinTypeA] ??
              mainMarket.reserveMap[coinTypeA]?.price ??
              undefined;
            let priceB =
              coinTypePythPriceMap[coinTypeB] ??
              coinTypeSwitchboardPriceMap[coinTypeB] ??
              mainMarket.reserveMap[coinTypeB]?.price ??
              undefined;

            if (priceA === undefined && priceB === undefined) {
              console.error(
                `Skipping pool with id ${id}, quoterId ${quoterId} - missing prices for both assets (no Pyth price feed, no Switchboard price feed, and no Suilend main market reserve) for coinType(s) ${coinTypes.join(", ")}`,
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
            const prices = [priceA, priceB];

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
          })(),
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

    return {
      coinTypePythPriceMap,
      coinTypeSwitchboardPriceMap,

      lstAprPercentMap,

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
