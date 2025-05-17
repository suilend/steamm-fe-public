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

import { useAppContext } from "@/contexts/AppContext";
import { ChartData } from "@/lib/chart";
import { API_URL } from "@/lib/navigation";

const FIFTEEN_MINUTES_S = 15 * 60;
const ONE_HOUR_S = FIFTEEN_MINUTES_S * 4;
const SIX_HOURS_S = ONE_HOUR_S * 6;
const ONE_DAY_S = SIX_HOURS_S * 4;
const SEVEN_DAYS_S = ONE_DAY_S * 7;

interface StatsContext {
  poolHistoricalStats: {
    tvlUsd_7d: Record<string, ChartData[]>;
    volumeUsd_7d: Record<string, ChartData[]>;
    feesUsd_7d: Record<string, ChartData[]>;
  };
  // fetchPoolHistoricalTvlUsd7d: (poolIds: string[]) => void;
  fetchPoolHistoricalVolumeUsd7d: (poolIds: string[]) => void;
  fetchPoolHistoricalFeesUsd7d: (poolIds: string[]) => void;
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
  // fetchPoolHistoricalTvlUsd7d: async () => {
  //   throw Error("StatsContextProvider not initialized");
  // },
  fetchPoolHistoricalVolumeUsd7d: async () => {
    throw Error("StatsContextProvider not initialized");
  },
  fetchPoolHistoricalFeesUsd7d: async () => {
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

  const poolCountRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (appData === undefined) return;

    if (poolCountRef.current !== undefined) return;
    poolCountRef.current = appData.pools.length;
  }, [appData]);

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

  const fetchPoolHistoricalTvlUsd7d = useCallback(
    async (_poolIds: string[]) => {
      if (appData === undefined) return;

      const _pools = appData.pools.filter((pool) => _poolIds.includes(pool.id));
      for (const pool of _pools) {
        // TVL
        (async () => {
          try {
            const res = await fetch(
              `${API_URL}/steamm/historical/tvl?${new URLSearchParams({
                startTimestampS: `${referenceTimestampSRef.current - SEVEN_DAYS_S}`,
                endTimestampS: `${referenceTimestampSRef.current - 1}`,
                intervalS: `${ONE_HOUR_S}`,
                poolId: pool.id,
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
                `Failed to fetch historical TVL (7d) for pool with id ${pool.id}`,
              );

            setPoolHistoricalStats((prev) => ({
              ...prev,
              tvlUsd_7d: {
                ...prev.tvlUsd_7d,
                [pool.id]: json.reduce(
                  (acc, d) => [
                    ...acc,
                    {
                      timestampS: d.start,
                      tvlUsd_7d: !isNaN(+d.usdValue)
                        ? +d.usdValue
                        : Object.entries(d.tvl).reduce(
                            (acc2, [coinType, tvl]) =>
                              acc2 +
                              +new BigNumber(tvl)
                                .div(
                                  10 **
                                    appData.coinMetadataMap[coinType].decimals,
                                )
                                .times(
                                  pool.prices[pool.coinTypes.indexOf(coinType)],
                                ),
                            0,
                          ),
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
                [pool.id]: [{ timestampS: 0, tvlUsd_7d: 0 }],
              },
            }));
          }
        })();
      }
    },
    [appData],
  );

  const fetchPoolHistoricalVolumeUsd7d = useCallback(
    async (_poolIds: string[]) => {
      if (appData === undefined) return;

      const _pools = appData.pools.filter((pool) => _poolIds.includes(pool.id));
      for (const pool of _pools) {
        // Volume
        (async () => {
          try {
            const res = await fetch(
              `${API_URL}/steamm/historical/volume?${new URLSearchParams({
                startTimestampS: `${referenceTimestampSRef.current - SEVEN_DAYS_S}`,
                endTimestampS: `${referenceTimestampSRef.current - 1}`,
                intervalS: `${SIX_HOURS_S}`,
                poolId: pool.id,
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
                `Failed to fetch historical volume (7d) for pool with id ${pool.id}`,
              );

            setPoolHistoricalStats((prev) => ({
              ...prev,
              volumeUsd_7d: {
                ...prev.volumeUsd_7d,
                [pool.id]: json.reduce(
                  (acc, d) => [
                    ...acc,
                    {
                      timestampS: d.start,
                      volumeUsd_7d: !isNaN(+d.usdValue)
                        ? +d.usdValue
                        : Object.entries(d.volume ?? {}).reduce(
                            (acc2, [coinType, volume]) =>
                              acc2 +
                              +new BigNumber(volume)
                                .div(
                                  10 **
                                    appData.coinMetadataMap[coinType].decimals,
                                )
                                .times(
                                  pool.prices[pool.coinTypes.indexOf(coinType)],
                                ),
                            0,
                          ),
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
                [pool.id]: [{ timestampS: 0, volumeUsd_7d: 0 }],
              },
            }));
          }
        })();
      }
    },
    [appData],
  );

  const fetchPoolHistoricalFeesUsd7d = useCallback(
    async (_poolIds: string[]) => {
      if (appData === undefined) return;

      const _pools = appData.pools.filter((pool) => _poolIds.includes(pool.id));
      for (const pool of _pools) {
        // Fees
        (async () => {
          try {
            const res = await fetch(
              `${API_URL}/steamm/historical/fees?${new URLSearchParams({
                startTimestampS: `${referenceTimestampSRef.current - SEVEN_DAYS_S}`,
                endTimestampS: `${referenceTimestampSRef.current - 1}`,
                intervalS: `${SIX_HOURS_S}`,
                poolId: pool.id,
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
                `Failed to fetch historical fees (7d) for pool with id ${pool.id}`,
              );

            setPoolHistoricalStats((prev) => ({
              ...prev,
              feesUsd_7d: {
                ...prev.feesUsd_7d,
                [pool.id]: json.reduce(
                  (acc, d) => [
                    ...acc,
                    {
                      timestampS: d.start,
                      feesUsd_7d: !isNaN(+d.usdValue)
                        ? +d.usdValue
                        : Object.entries(d.fees).reduce(
                            (acc2, [coinType, fees]) =>
                              acc2 +
                              +new BigNumber(fees)
                                .div(
                                  10 **
                                    appData.coinMetadataMap[coinType].decimals,
                                )
                                .times(
                                  pool.prices[pool.coinTypes.indexOf(coinType)],
                                ),
                            0,
                          ),
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
                [pool.id]: [{ timestampS: 0, feesUsd_7d: 0 }],
              },
            }));
          }
        })();
      }
    },
    [appData],
  );

  const hasFetchedPoolHistoricalTvlUsd7dRef = useRef<boolean>(false);
  useEffect(() => {
    if (appData === undefined) return;

    if (hasFetchedPoolHistoricalTvlUsd7dRef.current) return;
    hasFetchedPoolHistoricalTvlUsd7dRef.current = true;

    fetchPoolHistoricalTvlUsd7d(appData.pools.map((p) => p.id));
  }, [appData, fetchPoolHistoricalTvlUsd7d]);

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
    volumeUsd_7d: ChartData[] | undefined;
    feesUsd_7d: ChartData[] | undefined;
  }>({
    volumeUsd_7d: undefined,
    feesUsd_7d: undefined,
  });

  const fetchGlobalHistoricalStats = useCallback(async () => {
    // TVL
    // (async () => {
    //   try {
    //     const res = await fetch(
    //       `${API_URL}/steamm/historical/tvl?${new URLSearchParams({
    //         startTimestampS: `${referenceTimestampSRef.current - SEVEN_DAYS_S}`,
    //         endTimestampS: `${referenceTimestampSRef.current - 1}`,
    //         intervalS: `${ONE_HOUR_S}`,
    //       })}`,
    //     );
    //     const json: {
    //       start: number;
    //       end: number;
    //       tvl: Record<string, string>;
    //       usdValue: string;
    //     }[] = await res.json();
    //     if ((json as any)?.statusCode === 500)
    //       throw new Error("Failed to fetch global historical TVL");

    //     console.log("XXXX tvl", json);
    //   } catch (err) {
    //     console.error(err);
    //   }
    // })();

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

  const globalHistoricalPoolDerivedStats: {
    tvlUsd_7d: ChartData[] | undefined;
  } = useMemo(() => {
    if (appData === undefined)
      return {
        tvlUsd_7d: undefined,
      };

    const result: {
      tvlUsd_7d: ChartData[] | undefined;
    } = {
      tvlUsd_7d: undefined,
    };

    // TVL
    if (
      Object.keys(poolHistoricalStats.tvlUsd_7d).length > 0 &&
      Object.keys(poolHistoricalStats.tvlUsd_7d).length === poolCountRef.current
    ) {
      const timestampsS = Object.values(poolHistoricalStats.tvlUsd_7d)[0].map(
        (d) => d.timestampS,
      );

      result.tvlUsd_7d = timestampsS.reduce(
        (acc, timestampS, i) => [
          ...acc,
          {
            timestampS,
            tvlUsd_7d: +Object.values(poolHistoricalStats.tvlUsd_7d).reduce(
              (acc2, data) => acc2.plus(data[i]?.tvlUsd_7d ?? 0),
              new BigNumber(0),
            ),
          },
        ],
        [] as ChartData[],
      );
    }

    return result;
  }, [appData, poolHistoricalStats.tvlUsd_7d]);

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
      // fetchPoolHistoricalTvlUsd7d,
      fetchPoolHistoricalVolumeUsd7d,
      fetchPoolHistoricalFeesUsd7d,
      poolStats,

      globalHistoricalStats: {
        ...globalHistoricalStats,
        ...globalHistoricalPoolDerivedStats,
      },
      globalStats,
    }),
    [
      poolHistoricalStats,
      // fetchPoolHistoricalTvlUsd7d,
      fetchPoolHistoricalVolumeUsd7d,
      fetchPoolHistoricalFeesUsd7d,
      poolStats,
      globalHistoricalStats,
      globalHistoricalPoolDerivedStats,
      globalStats,
    ],
  );

  return (
    <StatsContext.Provider value={contextValue}>
      {children}
    </StatsContext.Provider>
  );
}
