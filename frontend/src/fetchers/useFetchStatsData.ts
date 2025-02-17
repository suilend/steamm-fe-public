import BigNumber from "bignumber.js";
import { startOfHour } from "date-fns";
import useSWR from "swr";

import { showErrorToast } from "@suilend/frontend-sui-next";

import { useAppContext } from "@/contexts/AppContext";
import { StatsData } from "@/contexts/StatsContext";
import { ChartData } from "@/lib/chart";
import { API_URL } from "@/lib/navigation";

const ONE_HOUR_S = 60 * 60;
const ONE_DAY_S = 24 * ONE_HOUR_S;

export default function useFetchStatsData() {
  const { appData } = useAppContext();

  const dataFetcher = async () => {
    if (!appData) return undefined as unknown as StatsData; // // In practice `dataFetcher` won't be called if `appData` is falsy

    const now = Date.now();
    const hourStart = startOfHour(now);
    const hourStartS = Math.floor(hourStart.getTime() / 1000);

    const poolIds = appData.pools.map((pool) => pool.id);

    // Pools - TVL
    const poolHistoricalTvlUsd_24h_map: Record<string, ChartData[]> = {};

    const poolHistoricalTvls_24h = await Promise.all(
      poolIds.map((poolId) =>
        (async () => {
          const res = await fetch(
            `${API_URL}/steamm/historical/tvl?${new URLSearchParams({
              startTimestampS: `${hourStartS - ONE_DAY_S}`,
              endTimestampS: `${hourStartS - 1}`, // Exclude current unfinished hour (24 hours) - the current TVL is appended later
              intervalS: `${ONE_HOUR_S}`,
              poolId,
            })}`,
          );
          return res.json();
        })(),
      ),
    );
    console.log("XXX tvl raw:", poolHistoricalTvls_24h);

    for (let i = 0; i < poolHistoricalTvls_24h.length; i++) {
      const pool = appData.pools[i];

      poolHistoricalTvlUsd_24h_map[pool.id] = [];
      const poolHistoricalTvl_24h = poolHistoricalTvls_24h[i] as {
        start: number;
        end: number;
        tvl: Record<string, string>;
      }[];

      for (const d of poolHistoricalTvl_24h) {
        poolHistoricalTvlUsd_24h_map[pool.id].push({
          timestampS: d.start,
          tvl: Object.entries(d.tvl).reduce((acc, [coinType, tvl]) => {
            const coinIndex = pool.coinTypes.indexOf(coinType);

            return (
              acc +
              +new BigNumber(tvl)
                .div(10 ** appData.poolCoinMetadataMap[coinType].decimals)
                .times(pool.prices[coinIndex])
            );
          }, 0),
        });
      }

      poolHistoricalTvlUsd_24h_map[pool.id].push({
        timestampS: hourStartS,
        tvl: +pool.tvlUsd,
      });
    }
    console.log(
      "XXX poolHistoricalTvlUsd_24h_map:",
      poolHistoricalTvlUsd_24h_map,
    );

    // Pools - volume
    const poolVolumeUsd_24h_map: Record<string, BigNumber> = {};
    const poolHistoricalVolumeUsd_24h_map: Record<string, ChartData[]> = {};

    const poolHistoricalVolumes_24h = await Promise.all(
      poolIds.map((poolId) =>
        (async () => {
          const res = await fetch(
            `${API_URL}/steamm/historical/volume?${new URLSearchParams({
              startTimestampS: `${hourStartS - ONE_DAY_S}`,
              endTimestampS: `${hourStartS}`, // Include current unfinished hour (25 hours)
              intervalS: `${ONE_HOUR_S}`,
              poolId,
            })}`,
          );
          return res.json();
        })(),
      ),
    );
    console.log("XXX volume raw:", poolHistoricalVolumes_24h);

    for (let i = 0; i < poolHistoricalVolumes_24h.length; i++) {
      const pool = appData.pools[i];
      poolHistoricalVolumeUsd_24h_map[pool.id] = [];

      const poolHistoricalVolume_24h = poolHistoricalVolumes_24h[i] as {
        start: number;
        end: number;
        usdValue: string;
      }[];

      for (const d of poolHistoricalVolume_24h) {
        poolHistoricalVolumeUsd_24h_map[pool.id].push({
          timestampS: d.start,
          volume: +d.usdValue,
        });
      }

      poolVolumeUsd_24h_map[pool.id] = poolHistoricalVolumeUsd_24h_map[
        pool.id
      ].reduce((acc, d) => acc.plus(d.volume), new BigNumber(0));
    }
    console.log(
      "XXX poolVolumeUsd_24h_map:",
      poolVolumeUsd_24h_map,
      "poolHistoricalVolumeUsd_24h_map:",
      poolHistoricalVolumeUsd_24h_map,
    );

    // Pools - fees
    const poolFeesUsd_24h_map: Record<string, BigNumber> = {};
    const poolHistoricalFeesUsd_24h_map: Record<string, ChartData[]> = {};

    const poolHistoricalFeess_24h = await Promise.all(
      poolIds.map((poolId) =>
        (async () => {
          const res = await fetch(
            `${API_URL}/steamm/historical/fees?${new URLSearchParams({
              startTimestampS: `${hourStartS - ONE_DAY_S}`,
              endTimestampS: `${hourStartS}`, // Include current unfinished hour (25 hours)
              intervalS: `${ONE_HOUR_S}`,
              poolId,
            })}`,
          );
          return res.json();
        })(),
      ),
    );
    console.log("XXX fees raw:", poolHistoricalFeess_24h);

    for (let i = 0; i < poolHistoricalFeess_24h.length; i++) {
      const pool = appData.pools[i];

      poolHistoricalFeesUsd_24h_map[pool.id] = [];
      const poolHistoricalFees_24h = poolHistoricalFeess_24h[i] as {
        start: number;
        end: number;
        fees: Record<string, string>;
      }[];

      for (const d of poolHistoricalFees_24h) {
        poolHistoricalFeesUsd_24h_map[pool.id].push({
          timestampS: d.start,
          fees: Object.entries(d.fees).reduce((acc, [coinType, fees]) => {
            const coinIndex = pool.coinTypes.indexOf(coinType);

            return (
              acc +
              +new BigNumber(fees as string)
                .div(10 ** appData.poolCoinMetadataMap[coinType].decimals)
                .times(pool.prices[coinIndex])
            );
          }, 0),
        });
      }

      poolFeesUsd_24h_map[pool.id] = poolHistoricalFeesUsd_24h_map[
        pool.id
      ].reduce((acc, d) => acc.plus(d.fees), new BigNumber(0));
    }
    console.log(
      "XXX poolFeesUsd_24h_map:",
      poolFeesUsd_24h_map,
      "poolHistoricalFeesUsd_24h_map:",
      poolHistoricalFeesUsd_24h_map,
    );

    // Pools - APR
    const poolApr_24h_map: Record<string, BigNumber> = {};
    const poolHistoricalApr_24h_map: Record<string, ChartData[]> = {};

    for (const pool of appData.pools) {
      const poolFeesUsd_24h = poolFeesUsd_24h_map[pool.id];

      poolApr_24h_map[pool.id] = !pool.tvlUsd.eq(0)
        ? poolFeesUsd_24h.div(pool.tvlUsd).times(365).times(100)
        : new BigNumber(0);
      // poolHistoricalApr_24h_map[pool.id] = // TODO
    }
    console.log(
      "XXX poolApr_24h_map:",
      poolApr_24h_map,
      "poolHistoricalApr_24h_map:",
      poolHistoricalApr_24h_map,
    );

    return {
      poolHistoricalTvlUsd_24h_map,

      poolVolumeUsd_24h_map,
      poolHistoricalVolumeUsd_24h_map,

      poolFeesUsd_24h_map,
      poolHistoricalFeesUsd_24h_map,

      poolApr_24h_map,
      poolHistoricalApr_24h_map,
    };
  };

  const { data, mutate } = useSWR<StatsData>(
    !appData ? null : "statsData",
    dataFetcher,
    {
      refreshInterval: 30 * 1000,
      onSuccess: (data) => {
        console.log("Refreshed stats data", data);
      },
      onError: (err) => {
        showErrorToast("Failed to refresh stats data", err);
        console.error(err);
      },
    },
  );

  return { data, mutateData: mutate };
}
