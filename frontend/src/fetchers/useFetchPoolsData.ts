import BigNumber from "bignumber.js";
import pLimit from "p-limit";
import useSWR from "swr";

import { showErrorToast, useSettingsContext } from "@suilend/frontend-sui-next";
import { formatRewards } from "@suilend/sdk";
import { LstClient } from "@suilend/springsui-sdk";
import { SteammSDK } from "@suilend/steamm-sdk";

import {
  AppData,
  BanksData,
  OraclesData,
  PoolsData,
} from "@/contexts/AppContext";
import { formatPair } from "@/lib/format";
import { normalizeRewards } from "@/lib/liquidityMining";
import { getParsedPool, getQuoterId } from "@/lib/pools";
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

    const { coinMetadataMap, poolObjs } = appData;
    const { bTokenTypeCoinTypeMap } = banksData;
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
            const { poolInfo, pool: pool_ } = poolObj;

            const id = poolInfo.poolId;
            const quoterId = getQuoterId(poolInfo);

            const pool =
              quoterId === QuoterId.ORACLE_V2
                ? await steammClient.fullClient.fetchOracleV2Pool(id)
                : pool_;

            return getParsedPool(
              steammClient,
              appData,
              oraclesData,
              banksData,
              poolInfo,
              pool,
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
