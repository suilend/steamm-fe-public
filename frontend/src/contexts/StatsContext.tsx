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

import { API_URL } from "@suilend/sui-fe";

import { useAppContext } from "@/contexts/AppContext";
import { ChartData, ChartPeriod, chartPeriodApiMap } from "@/lib/chart";

export interface StatsContext {
  poolHistoricalStats: {
    tvlUsd: Record<ChartPeriod, Record<string, ChartData[]>>;
    volumeUsd: Record<ChartPeriod, Record<string, ChartData[]>>;
    feesUsd: Record<ChartPeriod, Record<string, ChartData[]>>;
    lpUsd: Record<ChartPeriod, Record<string, ChartData[]>>;
  };
  fetchPoolHistoricalStats: (poolId: string, period: ChartPeriod) => void;
  poolStats: {
    // tvlUsd
    volumeUsd: Record<ChartPeriod, Record<string, BigNumber>>;
    feesUsd: Record<ChartPeriod, Record<string, BigNumber>>;
    lpUsd: Record<
      ChartPeriod,
      Record<string, { LP: BigNumber; Hold: BigNumber }>
    >;
    aprPercent: Record<
      ChartPeriod.ONE_DAY,
      Record<string, { feesAprPercent: BigNumber }>
    >;
  };

  globalHistoricalStats: {
    tvlUsd: Record<ChartPeriod, ChartData[] | undefined>;
    volumeUsd: Record<ChartPeriod, ChartData[] | undefined>;
    feesUsd: Record<ChartPeriod, ChartData[] | undefined>;
  };
  fetchGlobalHistoricalStats: (period: ChartPeriod) => void;
  globalStats: {
    tvlUsd: Record<ChartPeriod, BigNumber | undefined>;
    volumeUsd: Record<ChartPeriod, BigNumber | undefined>;
    feesUsd: Record<ChartPeriod, BigNumber | undefined>;
  };
}

const defaultData = {
  poolHistoricalStats: {
    tvlUsd: Object.values(ChartPeriod).reduce(
      (acc, period) => ({ ...acc, [period]: {} }),
      {} as Record<ChartPeriod, Record<string, ChartData[]>>,
    ),
    volumeUsd: Object.values(ChartPeriod).reduce(
      (acc, period) => ({ ...acc, [period]: {} }),
      {} as Record<ChartPeriod, Record<string, ChartData[]>>,
    ),
    feesUsd: Object.values(ChartPeriod).reduce(
      (acc, period) => ({ ...acc, [period]: {} }),
      {} as Record<ChartPeriod, Record<string, ChartData[]>>,
    ),
    lpUsd: Object.values(ChartPeriod).reduce(
      (acc, period) => ({ ...acc, [period]: {} }),
      {} as Record<ChartPeriod, Record<string, ChartData[]>>,
    ),
  },
  fetchPoolHistoricalStats: async () => {
    throw Error("StatsContextProvider not initialized");
  },
  poolStats: {
    // tvlUsd
    volumeUsd: Object.values(ChartPeriod).reduce(
      (acc, period) => ({ ...acc, [period]: {} }),
      {} as Record<ChartPeriod, Record<string, BigNumber>>,
    ),
    feesUsd: Object.values(ChartPeriod).reduce(
      (acc, period) => ({ ...acc, [period]: {} }),
      {} as Record<ChartPeriod, Record<string, BigNumber>>,
    ),
    lpUsd: Object.values(ChartPeriod).reduce(
      (acc, period) => ({ ...acc, [period]: {} }),
      {} as Record<
        ChartPeriod,
        Record<string, { LP: BigNumber; Hold: BigNumber }>
      >,
    ),
    aprPercent: {
      [ChartPeriod.ONE_DAY]: {},
    },
  },

  globalHistoricalStats: {
    tvlUsd: Object.values(ChartPeriod).reduce(
      (acc, period) => ({ ...acc, [period]: undefined }),
      {} as Record<ChartPeriod, ChartData[] | undefined>,
    ),
    volumeUsd: Object.values(ChartPeriod).reduce(
      (acc, period) => ({ ...acc, [period]: undefined }),
      {} as Record<ChartPeriod, ChartData[] | undefined>,
    ),
    feesUsd: Object.values(ChartPeriod).reduce(
      (acc, period) => ({ ...acc, [period]: undefined }),
      {} as Record<ChartPeriod, ChartData[] | undefined>,
    ),
  },
  fetchGlobalHistoricalStats: async () => {
    throw Error("StatsContextProvider not initialized");
  },
  globalStats: {
    tvlUsd: Object.values(ChartPeriod).reduce(
      (acc, period) => ({ ...acc, [period]: undefined }),
      {} as Record<ChartPeriod, BigNumber | undefined>,
    ),
    volumeUsd: Object.values(ChartPeriod).reduce(
      (acc, period) => ({ ...acc, [period]: undefined }),
      {} as Record<ChartPeriod, BigNumber | undefined>,
    ),
    feesUsd: Object.values(ChartPeriod).reduce(
      (acc, period) => ({ ...acc, [period]: undefined }),
      {} as Record<ChartPeriod, BigNumber | undefined>,
    ),
  },
};
const StatsContext = createContext<StatsContext>(defaultData);

export const useStatsContext = () => useContext(StatsContext);

export function StatsContextProvider({ children }: PropsWithChildren) {
  const { appData } = useAppContext();

  // All stats
  const [allStats, setAllStats] = useState<{
    pools: {
      volumeUsd: Record<ChartPeriod.ONE_DAY, Record<string, BigNumber>>;
      feesUsd: Record<ChartPeriod.ONE_DAY, Record<string, BigNumber>>;
      aprPercent: Record<ChartPeriod.ONE_DAY, Record<string, BigNumber>>;
    };
  }>({
    pools: {
      volumeUsd: {
        [ChartPeriod.ONE_DAY]: {},
      },
      feesUsd: {
        [ChartPeriod.ONE_DAY]: {},
      },
      aprPercent: {
        [ChartPeriod.ONE_DAY]: {},
      },
    },
  });

  const fetchAllStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/steamm/stats/all`);
      const json: {
        pools: Record<
          string,
          {
            volume24h: string;
            fees24h: string;
            APR24h: string;
          }
        >;
      } = await res.json();
      if (!res.ok || [400, 500].includes((json as any)?.statusCode))
        throw new Error("Failed to fetch stats");

      setAllStats({
        pools: {
          volumeUsd: {
            [ChartPeriod.ONE_DAY]: Object.fromEntries(
              Object.entries(json.pools).map(
                ([poolId, { volume24h, fees24h, APR24h }]) => [
                  poolId,
                  new BigNumber(volume24h),
                ],
              ),
            ),
          },
          feesUsd: {
            [ChartPeriod.ONE_DAY]: Object.fromEntries(
              Object.entries(json.pools).map(
                ([poolId, { volume24h, fees24h, APR24h }]) => [
                  poolId,
                  new BigNumber(fees24h),
                ],
              ),
            ),
          },
          aprPercent: {
            [ChartPeriod.ONE_DAY]: Object.fromEntries(
              Object.entries(json.pools).map(
                ([poolId, { volume24h, fees24h, APR24h }]) => [
                  poolId,
                  new BigNumber(APR24h).minus(1).times(100),
                ],
              ),
            ),
          },
        },
      });
    } catch (err) {
      console.error(err);

      setAllStats({
        pools: {
          volumeUsd: {
            [ChartPeriod.ONE_DAY]: {},
          },
          feesUsd: {
            [ChartPeriod.ONE_DAY]: {},
          },
          aprPercent: {
            [ChartPeriod.ONE_DAY]: {},
          },
        },
      });
    }
  }, []);

  const hasFetchedAllStatsRef = useRef<boolean>(false);
  useEffect(() => {
    if (hasFetchedAllStatsRef.current) return;
    hasFetchedAllStatsRef.current = true;

    fetchAllStats();
  }, [fetchAllStats]);

  // Pool
  // Pool - historical stats
  const [poolHistoricalStats, setPoolHistoricalStats] = useState<
    StatsContext["poolHistoricalStats"]
  >(defaultData.poolHistoricalStats);

  const fetchPoolHistoricalStats = useCallback(
    async (poolId: string, period: ChartPeriod) => {
      const apiPeriod = chartPeriodApiMap[period];

      // TVL
      (async () => {
        try {
          const res = await fetch(
            `${API_URL}/steamm/historical/tvl?${new URLSearchParams({
              period: apiPeriod,
              poolId,
            })}`,
          );
          const json: {
            start: number;
            end: number;
            tvl: Record<string, string>;
            usdValue: string;
          }[] = await res.json();
          if (!res.ok || [400, 500].includes((json as any)?.statusCode))
            throw new Error(
              `Failed to fetch historical TVL for pool with id ${poolId}, period ${period}`,
            );

          setPoolHistoricalStats((prev) => ({
            ...prev,
            tvlUsd: {
              ...prev.tvlUsd,
              [period]: {
                ...prev.tvlUsd[period],
                [poolId]: json.reduce(
                  (acc, d) => [
                    ...acc,
                    {
                      timestampS: d.start,
                      tvlUsd: !isNaN(+d.usdValue) ? +d.usdValue : 0,
                    },
                  ],
                  [] as ChartData[],
                ),
              },
            },
          }));
        } catch (err) {
          console.error(err);

          setPoolHistoricalStats((prev) => ({
            ...prev,
            tvlUsd: {
              ...prev.tvlUsd,
              [period]: {
                ...prev.tvlUsd[period],
                [poolId]: [{ timestampS: 0, tvlUsd: 0 }],
              },
            },
          }));
        }
      })();

      // Volume
      (async () => {
        try {
          const res = await fetch(
            `${API_URL}/steamm/historical/volume?${new URLSearchParams({
              period: apiPeriod,
              poolId,
            })}`,
          );
          const json: {
            start: number;
            end: number;
            volume: Record<string, string>;
            usdValue: string;
          }[] = await res.json();
          if (!res.ok || [400, 500].includes((json as any)?.statusCode))
            throw new Error(
              `Failed to fetch historical volume for pool with id ${poolId}, period ${period}`,
            );

          setPoolHistoricalStats((prev) => ({
            ...prev,
            volumeUsd: {
              ...prev.volumeUsd,
              [period]: {
                ...prev.volumeUsd[period],
                [poolId]: json.reduce(
                  (acc, d) => [
                    ...acc,
                    {
                      timestampS: d.start,
                      volumeUsd: !isNaN(+d.usdValue) ? +d.usdValue : 0,
                    },
                  ],
                  [] as ChartData[],
                ),
              },
            },
          }));
        } catch (err) {
          console.error(err);

          setPoolHistoricalStats((prev) => ({
            ...prev,
            volumeUsd: {
              ...prev.volumeUsd,
              [period]: {
                ...prev.volumeUsd[period],
                [poolId]: [{ timestampS: 0, volumeUsd: 0 }],
              },
            },
          }));
        }
      })();

      // Fees
      (async () => {
        try {
          const res = await fetch(
            `${API_URL}/steamm/historical/fees?${new URLSearchParams({
              period: apiPeriod,
              poolId,
            })}`,
          );
          const json: {
            start: number;
            end: number;
            fees: Record<string, string>;
            usdValue: string;
          }[] = await res.json();
          if (!res.ok || [400, 500].includes((json as any)?.statusCode))
            throw new Error(
              `Failed to fetch historical fees for pool with id ${poolId}, period ${period}`,
            );

          setPoolHistoricalStats((prev) => ({
            ...prev,
            feesUsd: {
              ...prev.feesUsd,
              [period]: {
                ...prev.feesUsd[period],
                [poolId]: json.reduce(
                  (acc, d) => [
                    ...acc,
                    {
                      timestampS: d.start,
                      feesUsd: !isNaN(+d.usdValue) ? +d.usdValue : 0,
                    },
                  ],
                  [] as ChartData[],
                ),
              },
            },
          }));
        } catch (err) {
          console.error(err);

          setPoolHistoricalStats((prev) => ({
            ...prev,
            feesUsd: {
              ...prev.feesUsd,
              [period]: {
                ...prev.feesUsd[period],
                [poolId]: [{ timestampS: 0, feesUsd: 0 }],
              },
            },
          }));
        }
      })();

      // LP
      (async () => {
        try {
          const res = await fetch(
            `${API_URL}/steamm/historical/lpTokenValue?${new URLSearchParams({
              period: apiPeriod,
              poolId,
              useHistoricalPrice: "true",
            })}`,
          );
          const json: {
            usdValue: number;
            holdUsdValue: number;
            timestampS: number;
          }[] = await res.json();
          if (!res.ok || [400, 500].includes((json as any)?.statusCode))
            throw new Error(
              `Failed to fetch historical LP values for pool with id ${poolId}, period ${period}`,
            );

          const firstDataPoint = json.find((d) => d.usdValue !== 0)!; // json[0].usdValue should not be zero (for vCPMM pools, json[1].usdValue should not be zero)
          const firstUsdValue = firstDataPoint.usdValue;

          setPoolHistoricalStats((prev) => ({
            ...prev,
            lpUsd: {
              ...prev.lpUsd,
              [period]: {
                ...prev.lpUsd[period],
                [poolId]: json.reduce(
                  (acc, d) => [
                    ...acc,
                    {
                      timestampS: d.timestampS,
                      LP:
                        firstUsdValue === 0
                          ? !isNaN(+d.usdValue)
                            ? +d.usdValue
                            : 0
                          : (((!isNaN(+d.usdValue) ? +d.usdValue : 0) -
                              firstUsdValue) /
                              firstUsdValue) *
                            100,
                      Hold:
                        firstUsdValue === 0
                          ? !isNaN(+d.holdUsdValue)
                            ? +d.holdUsdValue
                            : 0
                          : (((!isNaN(+d.holdUsdValue) ? +d.holdUsdValue : 0) -
                              firstUsdValue) /
                              firstUsdValue) *
                            100,
                    },
                  ],
                  [] as ChartData[],
                ),
              },
            },
          }));
        } catch (err) {
          console.error(err);

          setPoolHistoricalStats((prev) => ({
            ...prev,
            lpUsd: {
              ...prev.lpUsd,
              [period]: {
                ...prev.lpUsd[period],
                [poolId]: [{ timestampS: 0, LP: 0, Hold: 0 }],
              },
            },
          }));
        }
      })();
    },
    [],
  );

  // Pool - stats
  const poolStats: StatsContext["poolStats"] = useMemo(() => {
    const result: StatsContext["poolStats"] = {
      // tvlUsd
      volumeUsd: Object.values(ChartPeriod).reduce(
        (acc, period) => ({
          ...acc,
          [period]: Object.entries(
            poolHistoricalStats.volumeUsd[period],
          ).reduce(
            (acc2, [poolId, data]) => ({
              ...acc2,
              [poolId]: data.reduce(
                (acc3, d, index, arr) =>
                  index === arr.length - 1 ? acc3 : acc3.plus(d.volumeUsd), // Don't add last value (incomplete)
                new BigNumber(0),
              ),
            }),
            {} as StatsContext["poolStats"]["volumeUsd"][ChartPeriod],
          ),
        }),
        {} as StatsContext["poolStats"]["volumeUsd"],
      ),
      feesUsd: Object.values(ChartPeriod).reduce(
        (acc, period) => ({
          ...acc,
          [period]: Object.entries(poolHistoricalStats.feesUsd[period]).reduce(
            (acc2, [poolId, data]) => ({
              ...acc2,
              [poolId]: data.reduce(
                (acc3, d, index, arr) =>
                  index === arr.length - 1 ? acc3 : acc3.plus(d.feesUsd), // Don't add last value (incomplete)
                new BigNumber(0),
              ),
            }),
            {} as StatsContext["poolStats"]["feesUsd"][ChartPeriod],
          ),
        }),
        {} as StatsContext["poolStats"]["feesUsd"],
      ),
      lpUsd: Object.values(ChartPeriod).reduce(
        (acc, period) => ({
          ...acc,
          [period]: Object.entries(poolHistoricalStats.lpUsd[period]).reduce(
            (acc2, [poolId, data]) => ({
              ...acc2,
              [poolId]: {
                LP:
                  data.length > 0
                    ? new BigNumber(data[data.length - 1].LP)
                    : new BigNumber(0),
                Hold:
                  data.length > 0
                    ? new BigNumber(data[data.length - 1].Hold)
                    : new BigNumber(0),
              },
            }),
            {} as StatsContext["poolStats"]["lpUsd"][ChartPeriod],
          ),
        }),
        {} as StatsContext["poolStats"]["lpUsd"],
      ),
      aprPercent: {
        [ChartPeriod.ONE_DAY]: {},
      },
    };

    result.volumeUsd[ChartPeriod.ONE_DAY] =
      allStats.pools === undefined
        ? {}
        : (appData?.pools ?? []).reduce(
            (acc, pool) => ({
              ...acc,
              [pool.id]:
                allStats.pools.volumeUsd[ChartPeriod.ONE_DAY][pool.id] ??
                new BigNumber(0),
            }),
            {} as StatsContext["poolStats"]["volumeUsd"][ChartPeriod.ONE_DAY],
          );
    result.feesUsd[ChartPeriod.ONE_DAY] =
      allStats.pools === undefined
        ? {}
        : (appData?.pools ?? []).reduce(
            (acc, pool) => ({
              ...acc,
              [pool.id]:
                allStats.pools.feesUsd[ChartPeriod.ONE_DAY][pool.id] ??
                new BigNumber(0),
            }),
            {} as StatsContext["poolStats"]["feesUsd"][ChartPeriod.ONE_DAY],
          );
    result.aprPercent[ChartPeriod.ONE_DAY] =
      allStats.pools === undefined
        ? {}
        : (appData?.pools ?? []).reduce(
            (acc, pool) => ({
              ...acc,
              [pool.id]: {
                feesAprPercent:
                  allStats.pools.aprPercent[ChartPeriod.ONE_DAY][pool.id] ??
                  new BigNumber(0),
              },
            }),
            {} as StatsContext["poolStats"]["aprPercent"][ChartPeriod.ONE_DAY],
          );

    return result;
  }, [poolHistoricalStats, allStats.pools, appData?.pools]);

  // Global
  // Global - historical stats
  const [globalHistoricalStats, setGlobalHistoricalStats] = useState<
    StatsContext["globalHistoricalStats"]
  >(defaultData.globalHistoricalStats);

  const fetchGlobalHistoricalStats = useCallback(
    async (period: ChartPeriod) => {
      // const apiPeriod = chartPeriodApiMap[period];

      // TVL
      (async () => {
        try {
          const res = await fetch(
            `${API_URL}/steamm/historical/tvl?${new URLSearchParams({
              // period: apiPeriod,
            })}`,
          );
          const json: {
            start: number;
            end: number;
            tvl: Record<string, string>;
            usdValue: string;
          }[] = await res.json();
          if (!res.ok || [400, 500].includes((json as any)?.statusCode))
            throw new Error(
              `Failed to fetch global historical TVL, period ${period}`,
            );

          setGlobalHistoricalStats((prev) => ({
            ...prev,
            tvlUsd: {
              ...prev.tvlUsd,
              [period]: json.reduce(
                (acc, d) => [
                  ...acc,
                  {
                    timestampS: d.start,
                    tvlUsd: !isNaN(+d.usdValue) ? +d.usdValue : 0,
                  },
                ],
                [] as ChartData[],
              ),
            },
          }));
        } catch (err) {
          console.error(err);

          setGlobalHistoricalStats((prev) => ({
            ...prev,
            tvlUsd: {
              ...prev.tvlUsd,
              [period]: [{ timestampS: 0, tvlUsd: 0 }],
            },
          }));
        }
      })();

      // Volume
      (async () => {
        try {
          // const apiPeriod = chartPeriodApiMap[period];
          const res = await fetch(
            `${API_URL}/steamm/historical/volume?${new URLSearchParams({
              period: "7d",
            })}`,
          );
          const json: {
            start: number;
            end: number;
            volume: Record<string, string>;
            usdValue: string;
          }[] = await res.json();
          if (!res.ok || [400, 500].includes((json as any)?.statusCode))
            throw new Error(
              `Failed to fetch global historical volume, period ${period}`,
            );

          setGlobalHistoricalStats((prev) => ({
            ...prev,
            volumeUsd: {
              ...prev.volumeUsd,
              [period]: json.reduce(
                (acc, d) => [
                  ...acc,
                  {
                    timestampS: d.start,
                    volumeUsd: !isNaN(+d.usdValue) ? +d.usdValue : 0,
                  },
                ],
                [] as ChartData[],
              ),
            },
          }));
        } catch (err) {
          console.error(err);

          setGlobalHistoricalStats((prev) => ({
            ...prev,
            volumeUsd: {
              ...prev.volumeUsd,
              [period]: [{ timestampS: 0, volumeUsd: 0 }],
            },
          }));
        }
      })();

      // Fees
      (async () => {
        try {
          // const apiPeriod = chartPeriodApiMap[period];
          const res = await fetch(
            `${API_URL}/steamm/historical/fees?${new URLSearchParams({
              period: "7d",
            })}`,
          );
          const json: {
            start: number;
            end: number;
            fees: Record<string, string>;
            usdValue: string;
          }[] = await res.json();
          if (!res.ok || [400, 500].includes((json as any)?.statusCode))
            throw new Error(
              `Failed to fetch global historical fees, period ${period}`,
            );

          setGlobalHistoricalStats((prev) => ({
            ...prev,
            feesUsd: {
              ...prev.feesUsd,
              [period]: json.reduce(
                (acc, d) => [
                  ...acc,
                  {
                    timestampS: d.start,
                    feesUsd: !isNaN(+d.usdValue) ? +d.usdValue : 0,
                  },
                ],
                [] as ChartData[],
              ),
            },
          }));
        } catch (err) {
          console.error(err);

          setGlobalHistoricalStats((prev) => ({
            ...prev,
            feesUsd: {
              ...prev.feesUsd,
              [period]: [{ timestampS: 0, feesUsd: 0 }],
            },
          }));
        }
      })();
    },
    [],
  );

  // Global - stats
  const globalStats: StatsContext["globalStats"] = useMemo(
    () => ({
      tvlUsd: Object.values(ChartPeriod).reduce(
        (acc, period) => ({
          ...acc,
          [period]:
            globalHistoricalStats.tvlUsd[period] !== undefined
              ? new BigNumber(
                  globalHistoricalStats.tvlUsd[period].at(-1)?.tvlUsd ?? 0,
                )
              : undefined,
        }),
        {} as StatsContext["globalStats"]["volumeUsd"],
      ),
      volumeUsd: Object.values(ChartPeriod).reduce(
        (acc, period) => ({
          ...acc,
          [period]:
            globalHistoricalStats.volumeUsd[period] !== undefined
              ? globalHistoricalStats.volumeUsd[period].reduce(
                  (acc2, d, index, arr) =>
                    index === arr.length - 1 ? acc2 : acc2.plus(d.volumeUsd), // Don't add last value (incomplete)
                  new BigNumber(0),
                )
              : undefined,
        }),
        {} as StatsContext["globalStats"]["volumeUsd"],
      ),
      feesUsd: Object.values(ChartPeriod).reduce(
        (acc, period) => ({
          ...acc,
          [period]:
            globalHistoricalStats.feesUsd[period] !== undefined
              ? globalHistoricalStats.feesUsd[period].reduce(
                  (acc2, d, index, arr) =>
                    index === arr.length - 1 ? acc2 : acc2.plus(d.feesUsd), // Don't add last value (incomplete)
                  new BigNumber(0),
                )
              : undefined,
        }),
        {} as StatsContext["globalStats"]["feesUsd"],
      ),
    }),
    [globalHistoricalStats],
  );

  // Context
  const contextValue: StatsContext = useMemo(
    () => ({
      poolHistoricalStats,
      fetchPoolHistoricalStats,
      poolStats,

      globalHistoricalStats,
      fetchGlobalHistoricalStats,
      globalStats,
    }),
    [
      poolHistoricalStats,
      fetchPoolHistoricalStats,
      poolStats,
      globalHistoricalStats,
      fetchGlobalHistoricalStats,
      globalStats,
    ],
  );

  return (
    <StatsContext.Provider value={contextValue}>
      {children}
    </StatsContext.Provider>
  );
}
