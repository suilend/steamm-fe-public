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
    feesUsd_24h: Record<string, ChartData[]>;
  };
  poolStats: {
    volumeUsd_24h: Record<string, BigNumber>;
    feesUsd_24h: Record<string, BigNumber>;
    aprPercent_24h: Record<string, { feesAprPercent: BigNumber }>;
  };

  globalHistoricalStats: {
    tvlUsd_7d: ChartData[] | undefined;
    volumeUsd_7d: ChartData[] | undefined;
  };
  globalStats: {
    volumeUsd_24h: BigNumber | undefined;
  };
}

const StatsContext = createContext<StatsContext>({
  poolHistoricalStats: {
    tvlUsd_7d: {},
    volumeUsd_7d: {},
    feesUsd_24h: {},
  },
  poolStats: {
    volumeUsd_24h: {},
    feesUsd_24h: {},
    aprPercent_24h: {},
  },

  globalHistoricalStats: {
    tvlUsd_7d: undefined,
    volumeUsd_7d: undefined,
  },
  globalStats: {
    volumeUsd_24h: undefined,
  },
});

export const useStatsContext = () => useContext(StatsContext);

export function StatsContextProvider({ children }: PropsWithChildren) {
  const { appData } = useAppContext();

  const poolCountRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!appData) return;

    if (poolCountRef.current !== undefined) return;
    poolCountRef.current = appData.pools.length;
  }, [appData]);

  const referenceTimestampSRef = useRef(
    (() => {
      const nowS = Math.floor(Date.now() / 1000);
      const hourStartS = startOfHour(nowS * 1000).getTime();

      return (
        hourStartS +
        Math.floor((nowS - hourStartS) / FIFTEEN_MINUTES_S) * FIFTEEN_MINUTES_S
      );
    })(),
  );

  // Pool
  const [poolHistoricalStats, setPoolHistoricalStats] = useState<{
    tvlUsd_7d: Record<string, ChartData[]>;
    volumeUsd_7d: Record<string, ChartData[]>;
    feesUsd_24h: Record<string, ChartData[]>;
  }>({
    tvlUsd_7d: {},
    volumeUsd_7d: {},
    feesUsd_24h: {},
  });

  const fetchPoolHistoricalStats = useCallback(async () => {
    if (!appData) return;

    for (const pool of appData.pools) {
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
          if ((json as any)?.statusCode === 500) return;

          setPoolHistoricalStats((prev) => ({
            ...prev,
            tvlUsd_7d: {
              ...prev.tvlUsd_7d,
              [pool.id]: json.reduce(
                (acc, d) => [
                  ...acc,
                  {
                    timestampS: d.start,
                    tvlUsd_7d: +d.usdValue,
                  },
                ],
                [] as ChartData[],
              ),
            },
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
              poolId: pool.id,
            })}`,
          );
          const json: {
            start: number;
            end: number;
            usdValue: string;
          }[] = await res.json();
          if ((json as any)?.statusCode === 500) return;

          setPoolHistoricalStats((prev) => ({
            ...prev,
            volumeUsd_7d: {
              ...prev.volumeUsd_7d,
              [pool.id]: json.reduce(
                (acc, d) => [
                  ...acc,
                  {
                    timestampS: d.start,
                    volumeUsd_7d: +d.usdValue,
                  },
                ],
                [] as ChartData[],
              ),
            },
          }));
        } catch (err) {
          console.error(err);
        }
      })();

      // Fees
      (async () => {
        try {
          const res = await fetch(
            `${API_URL}/steamm/historical/fees?${new URLSearchParams({
              startTimestampS: `${referenceTimestampSRef.current - ONE_DAY_S}`,
              endTimestampS: `${referenceTimestampSRef.current - 1}`,
              intervalS: `${ONE_HOUR_S}`,
              poolId: pool.id,
            })}`,
          );
          const json: {
            start: number;
            end: number;
            fees: Record<string, string>;
          }[] = await res.json();
          if ((json as any)?.statusCode === 500) return;

          setPoolHistoricalStats((prev) => ({
            ...prev,
            feesUsd_24h: {
              ...prev.feesUsd_24h,
              [pool.id]: json.reduce(
                (acc, d) => [
                  ...acc,
                  {
                    timestampS: d.start,
                    feesUsd_24h: Object.entries(d.fees).reduce(
                      (acc2, [coinType, fees]) =>
                        acc2 +
                        +new BigNumber(fees)
                          .div(10 ** appData.coinMetadataMap[coinType].decimals)
                          .times(pool.prices[pool.coinTypes.indexOf(coinType)]),
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
        }
      })();
    }
  }, [appData]);

  const hasFetchedPoolHistoricalStatsRef = useRef<boolean>(false);
  useEffect(() => {
    if (!appData) return;

    if (hasFetchedPoolHistoricalStatsRef.current) return;
    hasFetchedPoolHistoricalStatsRef.current = true;

    fetchPoolHistoricalStats();
  }, [appData, fetchPoolHistoricalStats]);

  const poolStats: {
    volumeUsd_24h: Record<string, BigNumber>;
    feesUsd_24h: Record<string, BigNumber>;
    aprPercent_24h: Record<string, { feesAprPercent: BigNumber }>;
  } = useMemo(
    () => ({
      volumeUsd_24h: Object.entries(poolHistoricalStats.volumeUsd_7d).reduce(
        (acc, [poolId, data]) => ({
          ...acc,
          [poolId]: data
            .filter(
              (d) => d.timestampS >= referenceTimestampSRef.current - ONE_DAY_S,
            )
            .reduce((acc2, d) => acc2.plus(d.volumeUsd_7d), new BigNumber(0)),
        }),
        {} as Record<string, BigNumber>,
      ),
      feesUsd_24h: Object.entries(poolHistoricalStats.feesUsd_24h).reduce(
        (acc, [poolId, data]) => ({
          ...acc,
          [poolId]: data.reduce(
            (acc2, d) => acc2.plus(d.feesUsd_24h),
            new BigNumber(0),
          ),
        }),
        {} as Record<string, BigNumber>,
      ),
      aprPercent_24h: appData
        ? Object.entries(poolHistoricalStats.feesUsd_24h).reduce(
            (acc, [poolId, data]) => {
              const pool = appData.pools.find((_pool) => _pool.id === poolId);
              if (!pool) return acc; // `pool` should always be defined

              const feesAprPercent = (
                !pool.tvlUsd.eq(0)
                  ? data
                      .reduce(
                        (acc2, d) => acc2.plus(d.feesUsd_24h),
                        new BigNumber(0),
                      )
                      .div(pool.tvlUsd)
                  : new BigNumber(0)
              )
                .times(365)
                .times(100);

              return { ...acc, [poolId]: { feesAprPercent } };
            },
            {} as Record<string, { feesAprPercent: BigNumber }>,
          )
        : {},
    }),
    [poolHistoricalStats, appData],
  );

  // Total
  const globalHistoricalStats: {
    tvlUsd_7d: ChartData[] | undefined;
    volumeUsd_7d: ChartData[] | undefined;
  } = useMemo(() => {
    if (!appData)
      return {
        tvlUsd_7d: undefined,
        volumeUsd_7d: undefined,
      };

    const result: {
      tvlUsd_7d: ChartData[] | undefined;
      volumeUsd_7d: ChartData[] | undefined;
    } = {
      tvlUsd_7d: undefined,
      volumeUsd_7d: undefined,
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
              (acc2, data) => acc2.plus(data[i].tvlUsd_7d),
              new BigNumber(0),
            ),
          },
        ],
        [] as ChartData[],
      );
    }

    // Volume
    if (
      Object.keys(poolHistoricalStats.volumeUsd_7d).length > 0 &&
      Object.keys(poolHistoricalStats.volumeUsd_7d).length ===
        poolCountRef.current
    ) {
      const timestampsS = Object.values(
        poolHistoricalStats.volumeUsd_7d,
      )[0].map((d) => d.timestampS);

      result.volumeUsd_7d = timestampsS.reduce(
        (acc, timestampS, i) => [
          ...acc,
          {
            timestampS,
            volumeUsd_7d: +Object.values(
              poolHistoricalStats.volumeUsd_7d,
            ).reduce(
              (acc2, data) => acc2.plus(data[i].volumeUsd_7d),
              new BigNumber(0),
            ),
          },
        ],
        [] as ChartData[],
      );
    }

    return result;
  }, [
    appData,
    poolHistoricalStats.tvlUsd_7d,
    poolHistoricalStats.volumeUsd_7d,
  ]);

  const globalStats: {
    volumeUsd_24h: BigNumber | undefined;
  } = useMemo(
    () => ({
      volumeUsd_24h:
        globalHistoricalStats.volumeUsd_7d !== undefined
          ? globalHistoricalStats.volumeUsd_7d
              .filter(
                (d) =>
                  d.timestampS >= referenceTimestampSRef.current - ONE_DAY_S,
              )
              .reduce((acc, d) => acc.plus(d.volumeUsd_7d), new BigNumber(0))
          : undefined,
    }),
    [globalHistoricalStats.volumeUsd_7d],
  );

  // Context
  const contextValue: StatsContext = useMemo(
    () => ({
      poolHistoricalStats,
      poolStats,

      globalHistoricalStats,
      globalStats,
    }),
    [poolHistoricalStats, poolStats, globalHistoricalStats, globalStats],
  );

  return (
    <StatsContext.Provider value={contextValue}>
      {children}
    </StatsContext.Provider>
  );
}
