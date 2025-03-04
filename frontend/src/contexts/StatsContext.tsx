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

const ONE_HOUR_S = 60 * 60;
const ONE_DAY_S = 24 * ONE_HOUR_S;

interface StatsContext {
  poolHistoricalStats: {
    tvlUsd_24h: Record<string, ChartData[]>;
    volumeUsd_24h: Record<string, ChartData[]>;
    feesUsd_24h: Record<string, ChartData[]>;
    aprPercent_24h: Record<string, ChartData[]>; // TODO
  };
  poolStats: {
    volumeUsd_24h: Record<string, BigNumber>;
    feesUsd_24h: Record<string, BigNumber>;
    aprPercent_24h: Record<
      string,
      {
        feesAprPercent: BigNumber;
        suilendWeightedAverageDepositAprPercent?: BigNumber;
        total: BigNumber;
      }
    >;
  };

  totalHistoricalStats: {
    tvlUsd_24h: ChartData[] | undefined;
    volumeUsd_24h: ChartData[] | undefined;
  };
  totalStats: {
    volumeUsd_24h: BigNumber | undefined;
  };
}

const StatsContext = createContext<StatsContext>({
  poolHistoricalStats: {
    tvlUsd_24h: {},
    volumeUsd_24h: {},
    feesUsd_24h: {},
    aprPercent_24h: {},
  },
  poolStats: {
    volumeUsd_24h: {},
    feesUsd_24h: {},
    aprPercent_24h: {},
  },

  totalHistoricalStats: {
    tvlUsd_24h: undefined,
    volumeUsd_24h: undefined,
  },
  totalStats: {
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

  // Pool
  const [poolHistoricalStats, setPoolHistoricalStats] = useState<{
    tvlUsd_24h: Record<string, ChartData[]>;
    volumeUsd_24h: Record<string, ChartData[]>;
    feesUsd_24h: Record<string, ChartData[]>;
    aprPercent_24h: Record<string, ChartData[]>; // TODO
  }>({
    tvlUsd_24h: {},
    volumeUsd_24h: {},
    feesUsd_24h: {},
    aprPercent_24h: {},
  });

  const fetchPoolHistoricalStats = useCallback(async () => {
    if (!appData) return;

    const now = Date.now();
    const hourStart = startOfHour(now);
    const hourStartS = Math.floor(hourStart.getTime() / 1000);

    for (const pool of appData.pools) {
      // TVL
      (async () => {
        try {
          const res = await fetch(
            `${API_URL}/steamm/historical/tvl?${new URLSearchParams({
              startTimestampS: `${hourStartS - ONE_DAY_S}`,
              endTimestampS: `${hourStartS - 1}`, // Exclude unfinished hour (24 hours)
              intervalS: `${ONE_HOUR_S}`,
              poolId: pool.id,
            })}`,
          );
          const json: {
            start: number;
            end: number;
            tvl: Record<string, string>;
          }[] = await res.json();
          if ((json as any)?.statusCode === 500) return;

          setPoolHistoricalStats((prev) => ({
            ...prev,
            tvlUsd_24h: {
              ...prev.tvlUsd_24h,
              [pool.id]: json.reduce(
                (acc, d) => [
                  ...acc,
                  {
                    timestampS: d.start,
                    tvlUsd_24h: Object.entries(d.tvl).reduce(
                      (acc2, [coinType, tvl]) =>
                        acc2 +
                        +new BigNumber(tvl)
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

      // Volume
      (async () => {
        try {
          const res = await fetch(
            `${API_URL}/steamm/historical/volume?${new URLSearchParams({
              startTimestampS: `${hourStartS - ONE_DAY_S}`,
              endTimestampS: `${hourStartS - 1}`, // Exclude unfinished hour (24 hours)
              intervalS: `${ONE_HOUR_S}`,
              poolId: pool.id,
            })}`,
          );
          const json: {
            start: number;
            end: number;
            usdValue: string;
          }[] = await res.json();

          setPoolHistoricalStats((prev) => ({
            ...prev,
            volumeUsd_24h: {
              ...prev.volumeUsd_24h,
              [pool.id]: json.reduce(
                (acc, d) => [
                  ...acc,
                  {
                    timestampS: d.start,
                    volumeUsd_24h: +d.usdValue,
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
              startTimestampS: `${hourStartS - ONE_DAY_S}`,
              endTimestampS: `${hourStartS - 1}`, // Exclude unfinished hour (24 hours)
              intervalS: `${ONE_HOUR_S}`,
              poolId: pool.id,
            })}`,
          );
          const json: {
            start: number;
            end: number;
            fees: Record<string, string>;
          }[] = await res.json();

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
    aprPercent_24h: Record<
      string,
      {
        feesAprPercent: BigNumber;
        suilendWeightedAverageDepositAprPercent?: BigNumber;
        total: BigNumber;
      }
    >;
  } = useMemo(
    () => ({
      volumeUsd_24h: Object.entries(poolHistoricalStats.volumeUsd_24h).reduce(
        (acc, [poolId, data]) => ({
          ...acc,
          [poolId]: data.reduce(
            (acc2, d) => acc2.plus(d.volumeUsd_24h),
            new BigNumber(0),
          ),
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
              const suilendWeightedAverageDepositAprPercent =
                pool.coinTypes.every(
                  (coinType) => !appData.bankMap[coinType],
                ) || pool.tvlUsd.eq(0)
                  ? undefined
                  : pool.coinTypes
                      .reduce((acc, coinType, index) => {
                        const bank = appData.bankMap[coinType];
                        if (!bank) return acc;

                        return acc.plus(
                          new BigNumber(
                            bank.suilendDepositAprPercent
                              .times(bank.utilizationPercent)
                              .div(100),
                          ).times(
                            pool.prices[index].times(pool.balances[index]),
                          ),
                        );
                      }, new BigNumber(0))
                      .div(pool.tvlUsd);

              return {
                ...acc,
                [poolId]: {
                  feesAprPercent,
                  suilendWeightedAverageDepositAprPercent,
                  total: feesAprPercent.plus(
                    suilendWeightedAverageDepositAprPercent ?? 0,
                  ),
                },
              };
            },
            {} as Record<
              string,
              {
                feesAprPercent: BigNumber;
                suilendWeightedAverageDepositAprPercent?: BigNumber;
                total: BigNumber;
              }
            >,
          )
        : {},
    }),
    [poolHistoricalStats, appData],
  );

  // Total
  const totalHistoricalStats: {
    tvlUsd_24h: ChartData[] | undefined;
    volumeUsd_24h: ChartData[] | undefined;
  } = useMemo(() => {
    if (!appData)
      return {
        tvlUsd_24h: undefined,
        volumeUsd_24h: undefined,
      };

    const result: {
      tvlUsd_24h: ChartData[] | undefined;
      volumeUsd_24h: ChartData[] | undefined;
    } = {
      tvlUsd_24h: undefined,
      volumeUsd_24h: undefined,
    };

    // TVL
    if (
      Object.keys(poolHistoricalStats.tvlUsd_24h).length ===
      poolCountRef.current
    ) {
      const timestampsS = Object.values(poolHistoricalStats.tvlUsd_24h)[0].map(
        (d) => d.timestampS,
      );

      result.tvlUsd_24h = timestampsS.reduce(
        (acc, timestampS, i) => [
          ...acc,
          {
            timestampS,
            tvlUsd_24h: +Object.values(poolHistoricalStats.tvlUsd_24h).reduce(
              (acc2, data) => acc2.plus(data[i].tvlUsd_24h),
              new BigNumber(0),
            ),
          },
        ],
        [] as ChartData[],
      );
    }

    // Volume
    if (
      Object.keys(poolHistoricalStats.volumeUsd_24h).length ===
      poolCountRef.current
    ) {
      const timestampsS = Object.values(
        poolHistoricalStats.volumeUsd_24h,
      )[0].map((d) => d.timestampS);

      result.volumeUsd_24h = timestampsS.reduce(
        (acc, timestampS, i) => [
          ...acc,
          {
            timestampS,
            volumeUsd_24h: +Object.values(
              poolHistoricalStats.volumeUsd_24h,
            ).reduce(
              (acc2, data) => acc2.plus(data[i].volumeUsd_24h),
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
    poolHistoricalStats.tvlUsd_24h,
    poolHistoricalStats.volumeUsd_24h,
  ]);

  const totalStats: {
    volumeUsd_24h: BigNumber | undefined;
  } = useMemo(
    () => ({
      volumeUsd_24h:
        totalHistoricalStats.volumeUsd_24h !== undefined
          ? totalHistoricalStats.volumeUsd_24h.reduce(
              (acc, d) => acc.plus(d.volumeUsd_24h),
              new BigNumber(0),
            )
          : undefined,
    }),
    [totalHistoricalStats.volumeUsd_24h],
  );

  // Context
  const contextValue: StatsContext = useMemo(
    () => ({
      poolHistoricalStats,
      poolStats,

      totalHistoricalStats,
      totalStats,
    }),
    [poolHistoricalStats, poolStats, totalHistoricalStats, totalStats],
  );

  return (
    <StatsContext.Provider value={contextValue}>
      {children}
    </StatsContext.Provider>
  );
}
