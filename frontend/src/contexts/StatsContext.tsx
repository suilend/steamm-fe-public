import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import BigNumber from "bignumber.js";
import { startOfHour } from "date-fns";

import { API_URL } from "@suilend/sui-fe";

import { useAppContext } from "@/contexts/AppContext";
import { ChartData } from "@/lib/chart";

const FIFTEEN_MINUTES_S = 15 * 60;
const ONE_HOUR_S = FIFTEEN_MINUTES_S * 4;
const SIX_HOURS_S = ONE_HOUR_S * 6;
const ONE_DAY_S = SIX_HOURS_S * 4;
const SEVEN_DAYS_S = ONE_DAY_S * 7;

export interface StatsContext {
  poolHistoricalStats: {
    tvlUsd_7d: Record<string, ChartData[]>;
    volumeUsd_7d: Record<string, ChartData[]>;
    feesUsd_7d: Record<string, ChartData[]>;
  };
  fetchPoolHistoricalStats: (poolIds: string[]) => void;
  poolStats: {
    volumeUsd_7d: Record<string, BigNumber>;
    feesUsd_7d: Record<string, BigNumber>;

    volumeUsd_24h: Record<string, BigNumber>;
    feesUsd_24h: Record<string, BigNumber>;
    aprPercent_24h: Record<string, { feesAprPercent: BigNumber }>;
  };

  globalHistoricalStats: {
    tvlUsd_7d: ChartData[] | undefined;
    volumeUsd_7d: ChartData[] | undefined;
    feesUsd_7d: ChartData[] | undefined;
  };
  globalStats: {
    volumeUsd_7d: BigNumber | undefined;
    feesUsd_7d: BigNumber | undefined;
  };
}

const StatsContext = createContext<StatsContext>({
  poolHistoricalStats: {
    tvlUsd_7d: {},
    volumeUsd_7d: {},
    feesUsd_7d: {},
  },
  fetchPoolHistoricalStats: async () => {
    throw Error("StatsContextProvider not initialized");
  },
  poolStats: {
    volumeUsd_7d: {},
    feesUsd_7d: {},

    volumeUsd_24h: {},
    feesUsd_24h: {},
    aprPercent_24h: {},
  },

  globalHistoricalStats: {
    tvlUsd_7d: undefined,
    volumeUsd_7d: undefined,
    feesUsd_7d: undefined,
  },
  globalStats: {
    volumeUsd_7d: undefined,
    feesUsd_7d: undefined,
  },
});

export const useStatsContext = () => useContext(StatsContext);

export function StatsContextProvider({ children }: PropsWithChildren) {
  const { appData } = useAppContext();

  const referenceTimestampSRef = useRef(
    (() => {
      const nowS = Math.floor((Date.now() - 60 * 1000) / 1000); // Subtract 1 minute to give the BE enough time to update
      const hourStartS = startOfHour(nowS * 1000).getTime();

      return (
        hourStartS +
        Math.floor((nowS - hourStartS) / FIFTEEN_MINUTES_S) * FIFTEEN_MINUTES_S
      ); // Snap to the last 15 minute mark
    })(),
  );

  // Stats
  const [stats, setStats] = useState<{
    pools: Record<
      string,
      {
        volumeUsd_24h: BigNumber;
        feesUsd_24h: BigNumber;
      }
    >;
  }>({ pools: {} });

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/steamm/stats/all`);
      const json: {
        pools: Record<
          string,
          {
            volume24h: BigNumber;
            fees24h: BigNumber;
          }
        >;
      } = await res.json();
      if ((json as any)?.statusCode === 500)
        throw new Error("Failed to fetch stats");

      setStats({
        pools: Object.fromEntries(
          Object.entries(json.pools).map(([poolId, { volume24h, fees24h }]) => [
            poolId,
            {
              volumeUsd_24h: new BigNumber(volume24h),
              feesUsd_24h: new BigNumber(fees24h),
            },
          ]),
        ),
      });
    } catch {}
  }, []);

  const hasFetchedStatsRef = useRef<boolean>(false);
  useEffect(() => {
    if (hasFetchedStatsRef.current) return;
    hasFetchedStatsRef.current = true;

    fetchStats();
  }, [fetchStats]);

  // Pool
  // Pool - historical stats
  const [poolHistoricalStats, setPoolHistoricalStats] = useState<{
    tvlUsd_7d: Record<string, ChartData[]>;
    volumeUsd_7d: Record<string, ChartData[]>;
    feesUsd_7d: Record<string, ChartData[]>;
  }>({
    tvlUsd_7d: {},
    volumeUsd_7d: {},
    feesUsd_7d: {},
  });

  const fetchPoolHistoricalStats = useCallback(async (_poolIds: string[]) => {
    for (const poolId of _poolIds) {
      // TVL
      (async () => {
        try {
          const res = await fetch(
            `${API_URL}/steamm/historical/tvl?${new URLSearchParams({
              startTimestampS: `${referenceTimestampSRef.current - SEVEN_DAYS_S}`,
              endTimestampS: `${referenceTimestampSRef.current - 1}`,
              intervalS: `${ONE_HOUR_S}`,
              poolId,
            })}`,
          );
          const json: {
            start: number;
            end: number;
            tvl: Record<string, string>;
            usdValue: string;
          }[] = await res.json();
          if ((json as any)?.statusCode === 500)
            throw new Error(
              `Failed to fetch historical TVL for pool with id ${poolId}`,
            );

          setPoolHistoricalStats((prev) => ({
            ...prev,
            tvlUsd_7d: {
              ...prev.tvlUsd_7d,
              [poolId]: json.reduce(
                (acc, d) => [
                  ...acc,
                  {
                    timestampS: d.start,
                    tvlUsd_7d: !isNaN(+d.usdValue) ? +d.usdValue : 0,
                  },
                ],
                [] as ChartData[],
              ),
            },
          }));
        } catch (err) {
          console.error(err);

          setPoolHistoricalStats((prev) => ({
            ...prev,
            tvlUsd_7d: {
              ...prev.tvlUsd_7d,
              [poolId]: [{ timestampS: 0, tvlUsd_7d: 0 }],
            },
          }));
        }
      })();

      // Volume
      (async () => {
        try {
          const res = await fetch(
            `${API_URL}/steamm/historical/volume?${new URLSearchParams({
              startTimestampS: `${referenceTimestampSRef.current - SEVEN_DAYS_S}`,
              endTimestampS: `${referenceTimestampSRef.current - 1}`,
              intervalS: `${SIX_HOURS_S}`,
              poolId,
            })}`,
          );
          const json: {
            start: number;
            end: number;
            volume: Record<string, string>;
            usdValue: string;
          }[] = await res.json();
          if ((json as any)?.statusCode === 500)
            throw new Error(
              `Failed to fetch historical volume for pool with id ${poolId}`,
            );

          setPoolHistoricalStats((prev) => ({
            ...prev,
            volumeUsd_7d: {
              ...prev.volumeUsd_7d,
              [poolId]: json.reduce(
                (acc, d) => [
                  ...acc,
                  {
                    timestampS: d.start,
                    volumeUsd_7d: !isNaN(+d.usdValue) ? +d.usdValue : 0,
                  },
                ],
                [] as ChartData[],
              ),
            },
          }));
        } catch (err) {
          console.error(err);

          setPoolHistoricalStats((prev) => ({
            ...prev,
            volumeUsd_7d: {
              ...prev.volumeUsd_7d,
              [poolId]: [{ timestampS: 0, volumeUsd_7d: 0 }],
            },
          }));
        }
      })();

      // Fees
      (async () => {
        try {
          const res = await fetch(
            `${API_URL}/steamm/historical/fees?${new URLSearchParams({
              startTimestampS: `${referenceTimestampSRef.current - SEVEN_DAYS_S}`,
              endTimestampS: `${referenceTimestampSRef.current - 1}`,
              intervalS: `${SIX_HOURS_S}`,
              poolId,
            })}`,
          );
          const json: {
            start: number;
            end: number;
            fees: Record<string, string>;
            usdValue: string;
          }[] = await res.json();
          if ((json as any)?.statusCode === 500)
            throw new Error(
              `Failed to fetch historical fees for pool with id ${poolId}`,
            );

          setPoolHistoricalStats((prev) => ({
            ...prev,
            feesUsd_7d: {
              ...prev.feesUsd_7d,
              [poolId]: json.reduce(
                (acc, d) => [
                  ...acc,
                  {
                    timestampS: d.start,
                    feesUsd_7d: !isNaN(+d.usdValue) ? +d.usdValue : 0,
                  },
                ],
                [] as ChartData[],
              ),
            },
          }));
        } catch (err) {
          console.error(err);

          setPoolHistoricalStats((prev) => ({
            ...prev,
            feesUsd_7d: {
              ...prev.feesUsd_7d,
              [poolId]: [{ timestampS: 0, feesUsd_7d: 0 }],
            },
          }));
        }
      })();
    }
  }, []);

  // Pool - stats
  const poolStats: {
    volumeUsd_7d: Record<string, BigNumber>;
    feesUsd_7d: Record<string, BigNumber>;

    volumeUsd_24h: Record<string, BigNumber>;
    feesUsd_24h: Record<string, BigNumber>;
    aprPercent_24h: Record<string, { feesAprPercent: BigNumber }>;
  } = useMemo(
    () => ({
      volumeUsd_7d: Object.entries(poolHistoricalStats.volumeUsd_7d).reduce(
        (acc, [poolId, data]) => ({
          ...acc,
          [poolId]: data.reduce(
            (acc2, d) => acc2.plus(d.volumeUsd_7d),
            new BigNumber(0),
          ),
        }),
        {} as Record<string, BigNumber>,
      ),
      feesUsd_7d: Object.entries(poolHistoricalStats.feesUsd_7d).reduce(
        (acc, [poolId, data]) => ({
          ...acc,
          [poolId]: data.reduce(
            (acc2, d) => acc2.plus(d.feesUsd_7d),
            new BigNumber(0),
          ),
        }),
        {} as Record<string, BigNumber>,
      ),

      volumeUsd_24h:
        stats.pools === undefined
          ? {}
          : (appData?.pools ?? []).reduce(
              (acc, pool) => ({
                ...acc,
                [pool.id]:
                  stats.pools[pool.id]?.volumeUsd_24h ?? new BigNumber(0),
              }),
              {} as Record<string, BigNumber>,
            ),
      feesUsd_24h:
        stats.pools === undefined
          ? {}
          : (appData?.pools ?? []).reduce(
              (acc, pool) => ({
                ...acc,
                [pool.id]:
                  stats.pools[pool.id]?.feesUsd_24h ?? new BigNumber(0),
              }),
              {} as Record<string, BigNumber>,
            ),
      aprPercent_24h:
        stats.pools === undefined
          ? {}
          : (appData?.pools ?? []).reduce(
              (acc, pool) => ({
                ...acc,
                [pool.id]: {
                  feesAprPercent: pool.tvlUsd.eq(0) // TODO: Use Average TVL (24h)
                    ? new BigNumber(0)
                    : (stats.pools[pool.id]?.feesUsd_24h ?? new BigNumber(0))
                        .div(pool.tvlUsd) // TODO: Use Average TVL (24h)
                        .times(365)
                        .times(100),
                },
              }),
              {} as Record<string, { feesAprPercent: BigNumber }>,
            ),
    }),
    [
      poolHistoricalStats.volumeUsd_7d,
      poolHistoricalStats.feesUsd_7d,
      stats.pools,
      appData?.pools,
    ],
  );

  // Global
  // Global - historical stats
  const [globalHistoricalStats, setGlobalHistoricalStats] = useState<{
    tvlUsd_7d: ChartData[] | undefined;
    volumeUsd_7d: ChartData[] | undefined;
    feesUsd_7d: ChartData[] | undefined;
  }>({
    tvlUsd_7d: undefined,
    volumeUsd_7d: undefined,
    feesUsd_7d: undefined,
  });

  const fetchGlobalHistoricalStats = useCallback(async () => {
    // TVL
    (async () => {
      try {
        const res = await fetch(`${API_URL}/steamm/historical/tvl`);
        const json: {
          start: number;
          end: number;
          tvl: Record<string, string>;
          usdValue: string;
        }[] = await res.json();
        if ((json as any)?.statusCode === 500)
          throw new Error("Failed to fetch global historical TVL");

        setGlobalHistoricalStats((prev) => ({
          ...prev,
          tvlUsd_7d: json.reduce(
            (acc, d) => [
              ...acc,
              {
                timestampS: d.start,
                tvlUsd_7d: !isNaN(+d.usdValue) ? +d.usdValue : 0,
              },
            ],
            [] as ChartData[],
          ),
        }));
      } catch (err) {
        console.error(err);
      }
    })();

    // Volume
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/steamm/historical/volume?${new URLSearchParams({
            startTimestampS: `${referenceTimestampSRef.current - SEVEN_DAYS_S}`,
            endTimestampS: `${referenceTimestampSRef.current - 1}`,
            intervalS: `${SIX_HOURS_S}`,
          })}`,
        );
        const json: {
          start: number;
          end: number;
          volume: Record<string, string>;
          usdValue: string;
        }[] = await res.json();
        if ((json as any)?.statusCode === 500)
          throw new Error("Failed to fetch global historical volume");

        setGlobalHistoricalStats((prev) => ({
          ...prev,
          volumeUsd_7d: json.reduce(
            (acc, d) => [
              ...acc,
              {
                timestampS: d.start,
                volumeUsd_7d: !isNaN(+d.usdValue) ? +d.usdValue : 0,
              },
            ],
            [] as ChartData[],
          ),
        }));
      } catch (err) {
        console.error(err);

        setGlobalHistoricalStats((prev) => ({
          ...prev,
          volumeUsd_7d: [{ timestampS: 0, volumeUsd_7d: 0 }],
        }));
      }
    })();

    // Fees
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/steamm/historical/fees?${new URLSearchParams({
            startTimestampS: `${referenceTimestampSRef.current - SEVEN_DAYS_S}`,
            endTimestampS: `${referenceTimestampSRef.current - 1}`,
            intervalS: `${SIX_HOURS_S}`,
          })}`,
        );
        const json: {
          start: number;
          end: number;
          fees: Record<string, string>;
          usdValue: string;
        }[] = await res.json();
        if ((json as any)?.statusCode === 500)
          throw new Error("Failed to fetch global historical fees");

        setGlobalHistoricalStats((prev) => ({
          ...prev,
          feesUsd_7d: json.reduce(
            (acc, d) => [
              ...acc,
              {
                timestampS: d.start,
                feesUsd_7d: !isNaN(+d.usdValue) ? +d.usdValue : 0,
              },
            ],
            [] as ChartData[],
          ),
        }));
      } catch (err) {
        console.error(err);

        setGlobalHistoricalStats((prev) => ({
          ...prev,
          feesUsd_7d: [{ timestampS: 0, feesUsd_7d: 0 }],
        }));
      }
    })();
  }, []);

  const hasFetchedGlobalHistoricalStatsRef = useRef<boolean>(false);
  useEffect(() => {
    if (hasFetchedGlobalHistoricalStatsRef.current) return;
    hasFetchedGlobalHistoricalStatsRef.current = true;

    fetchGlobalHistoricalStats();
  }, [fetchGlobalHistoricalStats]);

  // Global - stats
  const globalStats: {
    volumeUsd_7d: BigNumber | undefined;
    feesUsd_7d: BigNumber | undefined;
  } = useMemo(
    () => ({
      volumeUsd_7d:
        globalHistoricalStats.volumeUsd_7d !== undefined
          ? globalHistoricalStats.volumeUsd_7d.reduce(
              (acc, d) => acc.plus(d.volumeUsd_7d),
              new BigNumber(0),
            )
          : undefined,
      feesUsd_7d:
        globalHistoricalStats.feesUsd_7d !== undefined
          ? globalHistoricalStats.feesUsd_7d.reduce(
              (acc, d) => acc.plus(d.feesUsd_7d),
              new BigNumber(0),
            )
          : undefined,
    }),
    [globalHistoricalStats.volumeUsd_7d, globalHistoricalStats.feesUsd_7d],
  );

  // Context
  const contextValue: StatsContext = useMemo(
    () => ({
      poolHistoricalStats,
      fetchPoolHistoricalStats,
      poolStats,

      globalHistoricalStats,
      globalStats,
    }),
    [
      poolHistoricalStats,
      fetchPoolHistoricalStats,
      poolStats,
      globalHistoricalStats,
      globalStats,
    ],
  );

  return (
    <StatsContext.Provider value={contextValue}>
      {children}
    </StatsContext.Provider>
  );
}
