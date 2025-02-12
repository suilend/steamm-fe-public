import BigNumber from "bignumber.js";
import useSWR from "swr";

import {
  NORMALIZED_AUSD_COINTYPE,
  NORMALIZED_DEEP_COINTYPE,
  NORMALIZED_FUD_COINTYPE,
  NORMALIZED_SEND_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_USDC_COINTYPE,
  NORMALIZED_sSUI_COINTYPE,
} from "@suilend/frontend-sui";
import { showErrorToast } from "@suilend/frontend-sui-next";
import { SteammSDK } from "@suilend/steamm-sdk";

import { BarChartData } from "@/components/BarChartStat";
import { AppData } from "@/contexts/AppContext";
import { PoolGroup, PoolType } from "@/lib/types";

export default function useFetchAppData(steammClient: SteammSDK) {
  const dataFetcher = async () => {
    const banks = await steammClient.getBanks();
    const pools = await steammClient.getPools();

    // Pools (dummy data)
    const poolGroups: PoolGroup[] = [
      {
        id: "1",
        assetCoinTypes: [NORMALIZED_SUI_COINTYPE, NORMALIZED_USDC_COINTYPE],
        pools: [
          {
            id: "1",
            poolGroupId: "1",
            type: PoolType.CONSTANT,
            tvlUsd: new BigNumber(103512),
            volumeUsd: new BigNumber(1251),
            apr: {
              assetCoinTypes: [NORMALIZED_SUI_COINTYPE],
              percent: new BigNumber(9.5),
            },
          },
          {
            id: "2",
            poolGroupId: "1",
            type: PoolType.PYTH_ORACLE,
            tvlUsd: new BigNumber(23512),
            volumeUsd: new BigNumber(11000),
            apr: {
              assetCoinTypes: [NORMALIZED_SUI_COINTYPE],
              percent: new BigNumber(12.95),
            },
          },
          {
            id: "3",
            poolGroupId: "1",
            type: PoolType.STABLE_SWAP,
            tvlUsd: new BigNumber(10100001),
            volumeUsd: new BigNumber(1251712),
            apr: {
              assetCoinTypes: [NORMALIZED_SUI_COINTYPE],
              percent: new BigNumber(78.11),
            },
          },
        ],
      },
      {
        id: "2",
        assetCoinTypes: [NORMALIZED_DEEP_COINTYPE, NORMALIZED_FUD_COINTYPE],
        pools: [
          {
            id: "4",
            poolGroupId: "2",
            type: PoolType.CONSTANT,
            tvlUsd: new BigNumber(1995),
            volumeUsd: new BigNumber(110),
            apr: {
              assetCoinTypes: [
                NORMALIZED_SUI_COINTYPE,
                NORMALIZED_DEEP_COINTYPE,
              ],
              percent: new BigNumber(90.5),
            },
          },
        ],
      },
      {
        id: "3",
        assetCoinTypes: [NORMALIZED_SUI_COINTYPE, NORMALIZED_SEND_COINTYPE],
        pools: [
          {
            id: "5",
            poolGroupId: "3",
            type: PoolType.CONSTANT,
            tvlUsd: new BigNumber(98000),
            volumeUsd: new BigNumber(12000),
            apr: {
              assetCoinTypes: [NORMALIZED_SEND_COINTYPE],
              percent: new BigNumber(64.1),
            },
          },
        ],
      },
    ];

    const featuredPoolGroupIds = ["1", "3"];

    // TVL (dummy data)
    const tvlData: BarChartData[] = [];

    for (let i = 0; i < 32; i++) {
      tvlData.push({
        timestampS: 1739253600 + i * 24 * 60 * 60,
        ...[
          NORMALIZED_SUI_COINTYPE,
          NORMALIZED_DEEP_COINTYPE,
          NORMALIZED_USDC_COINTYPE,
          NORMALIZED_SEND_COINTYPE,
          NORMALIZED_sSUI_COINTYPE,
          NORMALIZED_AUSD_COINTYPE,
        ].reduce(
          (acc, coinType, index) => ({
            ...acc,
            [coinType]: Math.random() * 1.5 ** index * 1000,
          }),
          {},
        ),
      });
    }

    // Volume (dummy data)
    const volumeData: BarChartData[] = [];

    for (let i = 0; i < 32; i++) {
      volumeData.push({
        timestampS: 1739253600 + i * 60 * 60,
        ...[
          NORMALIZED_SUI_COINTYPE,
          NORMALIZED_SEND_COINTYPE,
          NORMALIZED_USDC_COINTYPE,
        ].reduce(
          (acc, coinType) => ({
            ...acc,
            [coinType]: Math.random() * 1000,
          }),
          {},
        ),
      });
    }

    const coinTypes = [];
    for (const poolGroup of poolGroups) {
      coinTypes.push(...poolGroup.assetCoinTypes);

      for (const pool of poolGroup.pools) {
        coinTypes.push(...pool.apr.assetCoinTypes);
      }
    }
    coinTypes.push(
      ...Object.keys(tvlData[0]).filter((key) => key !== "timestampS"),
    );
    coinTypes.push(
      ...Object.keys(volumeData[0]).filter((key) => key !== "timestampS"),
    );

    const uniqueCoinTypes = Array.from(new Set(coinTypes));

    return {
      banks,
      pools,

      poolGroups,
      featuredPoolGroupIds,
      tvlData,
      volumeData,
      coinTypes: uniqueCoinTypes,
    };
  };

  const { data, mutate } = useSWR<AppData>("appData", dataFetcher, {
    refreshInterval: 30 * 1000 * 1000, // 30 * 1000,
    onSuccess: (data) => {
      console.log("Refreshed app data", data);
    },
    onError: (err) => {
      showErrorToast("Failed to refresh app data", err);
      console.error(err);
    },
  });

  return { data, mutateData: mutate };
}
