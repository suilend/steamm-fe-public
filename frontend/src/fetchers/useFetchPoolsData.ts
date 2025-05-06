import pLimit from "p-limit";
import useSWR from "swr";

import { showErrorToast } from "@suilend/frontend-sui-next";
import { formatRewards } from "@suilend/sdk";

import {
  AppData,
  BanksData,
  OraclesData,
  PoolsData,
} from "@/contexts/AppContext";
import { formatPair } from "@/lib/format";
import { normalizeRewards } from "@/lib/liquidityMining";
import { getParsedPool } from "@/lib/pools";
import { ParsedPool } from "@/lib/types";

export default function useFetchPoolsData(
  appData: AppData | undefined,
  oraclesData: OraclesData | undefined,
  banksData: BanksData | undefined,
) {
  // Data
  const dataFetcher = async () => {
    if (!appData || !oraclesData || !banksData)
      return undefined as unknown as PoolsData; // In practice `dataFetcher` won't be called if `appData`, `oraclesData`, or `banksData` is falsy

    const { coinMetadataMap, poolObjs } = appData;
    const limit10 = pLimit(10);

    // Pools
    const pools: ParsedPool[] = (
      await Promise.all(
        poolObjs.map((poolObj) =>
          limit10(async () => {
            const { poolInfo, pool, redeemQuote } = poolObj;

            return getParsedPool(
              appData,
              oraclesData,
              banksData,
              poolInfo,
              pool,
              redeemQuote,
            );
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
