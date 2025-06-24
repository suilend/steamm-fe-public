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
import { ChartData, ChartPeriod } from "@/lib/chart";

const TEN_MINUTES_S = 10 * 60;
const FIFTEEN_MINUTES_S = 15 * 60;
const ONE_HOUR_S = FIFTEEN_MINUTES_S * 4;
const FOUR_HOURS_S = ONE_HOUR_S * 4;
const SIX_HOURS_S = ONE_HOUR_S * 6;
const TWELVE_HOURS_S = ONE_HOUR_S * 12;

const ONE_DAY_S = ONE_HOUR_S * 24;
const THREE_DAYS_S = ONE_DAY_S * 3;
const SEVEN_DAYS_S = ONE_DAY_S * 7;
const ONE_MONTH_S = ONE_DAY_S * 30;
const THREE_MONTHS_S = ONE_MONTH_S * 3;

export interface StatsContext {
  poolHistoricalStats: {
    tvlUsd: Record<ChartPeriod, Record<string, ChartData[]>>;
    volumeUsd: Record<ChartPeriod, Record<string, ChartData[]>>;
    feesUsd: Record<ChartPeriod, Record<string, ChartData[]>>;
  };
  fetchPoolHistoricalStats: (poolIds: string[], period: ChartPeriod) => void;
  poolStats: {
    // tvlUsd
    volumeUsd: Record<ChartPeriod, Record<string, BigNumber>>;
    feesUsd: Record<ChartPeriod, Record<string, BigNumber>>;
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
    // tvlUsd
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
    // tvlUsd
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

  // All stats
  const [allStats, setAllStats] = useState<{
    pools: {
      volumeUsd: Record<ChartPeriod.ONE_DAY, Record<string, BigNumber>>;
      feesUsd: Record<ChartPeriod.ONE_DAY, Record<string, BigNumber>>;
    };
  }>({
    pools: {
      volumeUsd: {
        [ChartPeriod.ONE_DAY]: {},
      },
      feesUsd: {
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
          }
        >;
      } = await res.json();
      if ((json as any)?.statusCode === 500)
        throw new Error("Failed to fetch stats");

      setAllStats({
        pools: {
          volumeUsd: {
            [ChartPeriod.ONE_DAY]: Object.fromEntries(
              Object.entries(json.pools).map(
                ([poolId, { volume24h, fees24h }]) => [
                  poolId,
                  new BigNumber(volume24h),
                ],
              ),
            ),
          },
          feesUsd: {
            [ChartPeriod.ONE_DAY]: Object.fromEntries(
              Object.entries(json.pools).map(
                ([poolId, { volume24h, fees24h }]) => [
                  poolId,
                  new BigNumber(fees24h),
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
    async (_poolIds: string[], period: ChartPeriod) => {
      console.log("XXX fetchPoolHistoricalStats", _poolIds, period);

      for (const poolId of _poolIds) {
        // TVL
        (async () => {
          let startTimestampS, endTimestampS, intervalS;
          if (period === ChartPeriod.ONE_DAY) {
            startTimestampS = referenceTimestampSRef.current - ONE_DAY_S;
            endTimestampS = referenceTimestampSRef.current - 1;
            intervalS = TEN_MINUTES_S;
          } else if (period === ChartPeriod.ONE_WEEK) {
            startTimestampS = referenceTimestampSRef.current - SEVEN_DAYS_S;
            endTimestampS = referenceTimestampSRef.current - 1;
            intervalS = ONE_HOUR_S;
          } else if (period === ChartPeriod.ONE_MONTH) {
            startTimestampS = referenceTimestampSRef.current - ONE_MONTH_S;
            endTimestampS = referenceTimestampSRef.current - 1;
            intervalS = FOUR_HOURS_S;
          } else if (period === ChartPeriod.THREE_MONTHS) {
            startTimestampS = referenceTimestampSRef.current - THREE_MONTHS_S;
            endTimestampS = referenceTimestampSRef.current - 1;
            intervalS = TWELVE_HOURS_S;
          }

          try {
            const res = await fetch(
              `${API_URL}/steamm/historical/tvl?${new URLSearchParams({
                startTimestampS: `${startTimestampS}`,
                endTimestampS: `${endTimestampS}`,
                intervalS: `${intervalS}`,
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
          let startTimestampS, endTimestampS, intervalS;
          if (period === ChartPeriod.ONE_DAY) {
            startTimestampS = referenceTimestampSRef.current - ONE_DAY_S;
            endTimestampS = referenceTimestampSRef.current - 1;
            intervalS = ONE_HOUR_S;
          } else if (period === ChartPeriod.ONE_WEEK) {
            startTimestampS = referenceTimestampSRef.current - SEVEN_DAYS_S;
            endTimestampS = referenceTimestampSRef.current - 1;
            intervalS = SIX_HOURS_S;
          } else if (period === ChartPeriod.ONE_MONTH) {
            startTimestampS = referenceTimestampSRef.current - ONE_MONTH_S;
            endTimestampS = referenceTimestampSRef.current - 1;
            intervalS = ONE_DAY_S;
          } else if (period === ChartPeriod.THREE_MONTHS) {
            startTimestampS = referenceTimestampSRef.current - THREE_MONTHS_S;
            endTimestampS = referenceTimestampSRef.current - 1;
            intervalS = THREE_DAYS_S;
          }

          try {
            const res = await fetch(
              `${API_URL}/steamm/historical/volume?${new URLSearchParams({
                startTimestampS: `${startTimestampS}`,
                endTimestampS: `${endTimestampS}`,
                intervalS: `${intervalS}`,
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
          let startTimestampS, endTimestampS, intervalS;
          if (period === ChartPeriod.ONE_DAY) {
            startTimestampS = referenceTimestampSRef.current - ONE_DAY_S;
            endTimestampS = referenceTimestampSRef.current - 1;
            intervalS = ONE_HOUR_S;
          } else if (period === ChartPeriod.ONE_WEEK) {
            startTimestampS = referenceTimestampSRef.current - SEVEN_DAYS_S;
            endTimestampS = referenceTimestampSRef.current - 1;
            intervalS = SIX_HOURS_S;
          } else if (period === ChartPeriod.ONE_MONTH) {
            startTimestampS = referenceTimestampSRef.current - ONE_MONTH_S;
            endTimestampS = referenceTimestampSRef.current - 1;
            intervalS = ONE_DAY_S;
          } else if (period === ChartPeriod.THREE_MONTHS) {
            startTimestampS = referenceTimestampSRef.current - THREE_MONTHS_S;
            endTimestampS = referenceTimestampSRef.current - 1;
            intervalS = THREE_DAYS_S;
          }

          try {
            const res = await fetch(
              `${API_URL}/steamm/historical/fees?${new URLSearchParams({
                startTimestampS: `${startTimestampS}`,
                endTimestampS: `${endTimestampS}`,
                intervalS: `${intervalS}`,
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
      }
    },
    [],
  );

  // Pool - stats
  const poolStats: StatsContext["poolStats"] = useMemo(() => {
    const result: StatsContext["poolStats"] = {
      volumeUsd: Object.values(ChartPeriod).reduce(
        (acc, period) => ({
          ...acc,
          [period]: Object.entries(
            poolHistoricalStats.volumeUsd[period],
          ).reduce(
            (acc2, [poolId, data]) => ({
              ...acc2,
              [poolId]: data.reduce(
                (acc3, d) => acc3.plus(d.volumeUsd),
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
                (acc3, d) => acc3.plus(d.feesUsd),
                new BigNumber(0),
              ),
            }),
            {} as StatsContext["poolStats"]["feesUsd"][ChartPeriod],
          ),
        }),
        {} as StatsContext["poolStats"]["feesUsd"],
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
                feesAprPercent: pool.tvlUsd.eq(0) // TODO: Use Average TVL (24h)
                  ? new BigNumber(0)
                  : (
                      allStats.pools.feesUsd[ChartPeriod.ONE_DAY][pool.id] ??
                      new BigNumber(0)
                    )
                      .div(pool.tvlUsd) // TODO: Use Average TVL (24h)
                      .times(365)
                      .times(100),
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
      console.log("XXX fetchGlobalHistoricalStats", period);

      // TVL
      (async () => {
        let startTimestampS, endTimestampS, intervalS;
        if (period === ChartPeriod.ONE_DAY) {
          startTimestampS = referenceTimestampSRef.current - ONE_DAY_S;
          endTimestampS = referenceTimestampSRef.current - 1;
          intervalS = TEN_MINUTES_S;
        } else if (period === ChartPeriod.ONE_WEEK) {
          startTimestampS = referenceTimestampSRef.current - SEVEN_DAYS_S;
          endTimestampS = referenceTimestampSRef.current - 1;
          intervalS = ONE_HOUR_S;
        } else if (period === ChartPeriod.ONE_MONTH) {
          startTimestampS = referenceTimestampSRef.current - ONE_MONTH_S;
          endTimestampS = referenceTimestampSRef.current - 1;
          intervalS = FOUR_HOURS_S;
        } else if (period === ChartPeriod.THREE_MONTHS) {
          startTimestampS = referenceTimestampSRef.current - THREE_MONTHS_S;
          endTimestampS = referenceTimestampSRef.current - 1;
          intervalS = TWELVE_HOURS_S;
        }

        try {
          const res = await fetch(
            `${API_URL}/steamm/historical/tvl?${new URLSearchParams({
              startTimestampS: `${startTimestampS}`,
              endTimestampS: `${endTimestampS}`,
              intervalS: `${intervalS}`,
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
        let startTimestampS, endTimestampS, intervalS;
        if (period === ChartPeriod.ONE_DAY) {
          startTimestampS = referenceTimestampSRef.current - ONE_DAY_S;
          endTimestampS = referenceTimestampSRef.current - 1;
          intervalS = ONE_HOUR_S;
        } else if (period === ChartPeriod.ONE_WEEK) {
          startTimestampS = referenceTimestampSRef.current - SEVEN_DAYS_S;
          endTimestampS = referenceTimestampSRef.current - 1;
          intervalS = SIX_HOURS_S;
        } else if (period === ChartPeriod.ONE_MONTH) {
          startTimestampS = referenceTimestampSRef.current - ONE_MONTH_S;
          endTimestampS = referenceTimestampSRef.current - 1;
          intervalS = ONE_DAY_S;
        } else if (period === ChartPeriod.THREE_MONTHS) {
          startTimestampS = referenceTimestampSRef.current - THREE_MONTHS_S;
          endTimestampS = referenceTimestampSRef.current - 1;
          intervalS = THREE_DAYS_S;
        }

        try {
          const res = await fetch(
            `${API_URL}/steamm/historical/volume?${new URLSearchParams({
              startTimestampS: `${startTimestampS}`,
              endTimestampS: `${endTimestampS}`,
              intervalS: `${intervalS}`,
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
        let startTimestampS, endTimestampS, intervalS;
        if (period === ChartPeriod.ONE_DAY) {
          startTimestampS = referenceTimestampSRef.current - ONE_DAY_S;
          endTimestampS = referenceTimestampSRef.current - 1;
          intervalS = ONE_HOUR_S;
        } else if (period === ChartPeriod.ONE_WEEK) {
          startTimestampS = referenceTimestampSRef.current - SEVEN_DAYS_S;
          endTimestampS = referenceTimestampSRef.current - 1;
          intervalS = SIX_HOURS_S;
        } else if (period === ChartPeriod.ONE_MONTH) {
          startTimestampS = referenceTimestampSRef.current - ONE_MONTH_S;
          endTimestampS = referenceTimestampSRef.current - 1;
          intervalS = ONE_DAY_S;
        } else if (period === ChartPeriod.THREE_MONTHS) {
          startTimestampS = referenceTimestampSRef.current - THREE_MONTHS_S;
          endTimestampS = referenceTimestampSRef.current - 1;
          intervalS = THREE_DAYS_S;
        }

        try {
          const res = await fetch(
            `${API_URL}/steamm/historical/fees?${new URLSearchParams({
              startTimestampS: `${startTimestampS}`,
              endTimestampS: `${endTimestampS}`,
              intervalS: `${intervalS}`,
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
      volumeUsd: Object.values(ChartPeriod).reduce(
        (acc, period) => ({
          ...acc,
          [period]:
            globalHistoricalStats.volumeUsd[period] !== undefined
              ? globalHistoricalStats.volumeUsd[period].reduce(
                  (acc2, d) => acc2.plus(d.volumeUsd),
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
                  (acc2, d) => acc2.plus(d.feesUsd),
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
