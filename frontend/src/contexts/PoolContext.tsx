import { useRouter } from "next/router";
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

import { ParsedPool, getParsedPool } from "@suilend/steamm-sdk";
import { shallowPushQuery } from "@suilend/sui-fe-next";

import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { ChartDataType, ChartPeriod } from "@/lib/chart";
import { ROOT_URL } from "@/lib/navigation";
import { fetchPool } from "@/lib/pools";

enum QueryParams {
  POOL_ID_WITH_SLUG = "poolId",
  CHART_DATA_TYPE = "chart",
  CHART_PERIOD = "period",
}

interface PoolContext {
  selectedChartDataType: ChartDataType;
  onSelectedChartDataTypeChange: (chartDataType: ChartDataType) => void;
  selectedChartPeriod: ChartPeriod;
  onSelectedChartPeriodChange: (chartPeriod: ChartPeriod) => void;

  pool: ParsedPool;
  fetchRefreshedPool: (existingPool: ParsedPool) => Promise<void>;
}

const PoolContext = createContext<PoolContext>({
  selectedChartDataType: ChartDataType.TVL,
  onSelectedChartDataTypeChange: () => {
    throw Error("PoolContextProvider not initialized");
  },
  selectedChartPeriod: ChartPeriod.ONE_WEEK,
  onSelectedChartPeriodChange: () => {
    throw Error("PoolContextProvider not initialized");
  },

  pool: {} as ParsedPool,
  fetchRefreshedPool: async () => {
    throw Error("PoolContextProvider not initialized");
  },
});

export const usePoolContext = () => useContext(PoolContext);

export function PoolContextProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const queryParams = useMemo(
    () => ({
      [QueryParams.POOL_ID_WITH_SLUG]: router.query[
        QueryParams.POOL_ID_WITH_SLUG
      ] as string,
      [QueryParams.CHART_DATA_TYPE]: router.query[
        QueryParams.CHART_DATA_TYPE
      ] as ChartDataType | undefined,
      [QueryParams.CHART_PERIOD]: router.query[QueryParams.CHART_PERIOD] as
        | ChartPeriod
        | undefined,
    }),
    [router.query],
  );

  const { steammClient, appData } = useLoadedAppContext();
  const { fetchPoolHistoricalStats } = useStatsContext();

  // Query params
  const poolId = useMemo(
    () => queryParams[QueryParams.POOL_ID_WITH_SLUG]?.split("-")?.[0],
    [queryParams],
  );

  const selectedChartDataType = useMemo(
    () =>
      queryParams[QueryParams.CHART_DATA_TYPE] &&
      Object.values(ChartDataType).includes(
        queryParams[QueryParams.CHART_DATA_TYPE],
      )
        ? queryParams[QueryParams.CHART_DATA_TYPE]
        : ChartDataType.TVL,
    [queryParams],
  );
  const selectedChartPeriod = useMemo(
    () =>
      queryParams[QueryParams.CHART_PERIOD] &&
      Object.values(ChartPeriod).includes(queryParams[QueryParams.CHART_PERIOD])
        ? queryParams[QueryParams.CHART_PERIOD]
        : ChartPeriod.ONE_WEEK,
    [queryParams],
  );

  const onSelectedChartDataTypeChange = useCallback(
    (chartDataType: ChartDataType) => {
      shallowPushQuery(router, {
        ...router.query,
        [QueryParams.CHART_DATA_TYPE]: chartDataType,
      });
    },
    [router],
  );
  const onSelectedChartPeriodChange = useCallback(
    (chartPeriod: ChartPeriod) => {
      shallowPushQuery(router, {
        ...router.query,
        [QueryParams.CHART_PERIOD]: chartPeriod,
      });
    },
    [router],
  );

  // Pool info
  const existingPool: ParsedPool | undefined = useMemo(
    () => appData.pools.find((pool) => pool.id === poolId),
    [appData.pools, poolId],
  );

  // Historical stats
  const hasFetchedPoolHistoricalStatsMapRef = useRef<
    Record<string, Record<ChartPeriod, boolean>>
  >({});

  useEffect(() => {
    if (
      hasFetchedPoolHistoricalStatsMapRef.current[poolId]?.[selectedChartPeriod]
    )
      return;
    hasFetchedPoolHistoricalStatsMapRef.current[poolId] =
      hasFetchedPoolHistoricalStatsMapRef.current[poolId] ??
      ({} as Record<ChartPeriod, boolean>);
    hasFetchedPoolHistoricalStatsMapRef.current[poolId][selectedChartPeriod] =
      true;

    fetchPoolHistoricalStats([poolId], selectedChartPeriod);
  }, [poolId, selectedChartPeriod, fetchPoolHistoricalStats]);

  // Refreshed pool map
  const [refreshedPoolMap, setRefreshedPoolMap] = useState<
    Record<string, ParsedPool>
  >({});

  const fetchRefreshedPool = useCallback(
    async (_existingPool: ParsedPool) => {
      console.log("[fetchRefreshedPool] poolId:", _existingPool.id);

      try {
        const pool = await fetchPool(steammClient, _existingPool.poolInfo);
        const redeemQuote =
          new BigNumber(pool.balanceA.value.toString()).eq(0) &&
          new BigNumber(pool.balanceB.value.toString()).eq(0)
            ? null
            : await steammClient.Pool.quoteRedeem({
                lpTokens: pool.lpSupply.value,
                poolInfo: _existingPool.poolInfo,
                bankInfoA: appData.bankMap[_existingPool.coinTypes[0]].bankInfo,
                bankInfoB: appData.bankMap[_existingPool.coinTypes[1]].bankInfo,
              });

        const parsedPool = getParsedPool(appData, {
          poolInfo: _existingPool.poolInfo, // Existing poolInfo
          pool,
          redeemQuote,
          priceA: _existingPool.prices[0].toString(), // Existing prices
          priceB: _existingPool.prices[1].toString(), // Existing prices
          isInitialLpTokenBurned: _existingPool.isInitialLpTokenBurned, // Existing isInitialLpTokenBurned
          initialLpTokensMinted:
            _existingPool.initialLpTokensMinted === null
              ? _existingPool.initialLpTokensMinted
              : _existingPool.initialLpTokensMinted.times(10 ** 9).toString(), // Existing initialLpTokensMinted
        });
        if (parsedPool === undefined) return;

        setRefreshedPoolMap((prev) => ({
          ...prev,
          [_existingPool.id]: parsedPool,
        }));
      } catch (err) {
        console.error(err);
      }
    },
    [steammClient, appData],
  );

  const hasFetchedRefreshedPoolMapRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (existingPool === undefined) return;

    if (hasFetchedRefreshedPoolMapRef.current[existingPool.id]) return;
    hasFetchedRefreshedPoolMapRef.current[existingPool.id] = true;

    fetchRefreshedPool(existingPool);
  }, [existingPool, fetchRefreshedPool]);

  // Pool
  const pool = useMemo(
    () => refreshedPoolMap[poolId] ?? existingPool,
    [refreshedPoolMap, poolId, existingPool],
  );

  useEffect(() => {
    if (pool === undefined) router.replace(ROOT_URL); // Redirect to Home page if poolId is not valid
  }, [pool, router]);

  // Context
  const contextValue: PoolContext = useMemo(
    () => ({
      selectedChartDataType,
      onSelectedChartDataTypeChange,
      selectedChartPeriod,
      onSelectedChartPeriodChange,

      pool,
      fetchRefreshedPool,
    }),
    [
      selectedChartDataType,
      onSelectedChartDataTypeChange,
      selectedChartPeriod,
      onSelectedChartPeriodChange,
      pool,
      fetchRefreshedPool,
    ],
  );

  if (pool === undefined) return null; // Display nothing while redirecting to Home page
  return (
    <PoolContext.Provider value={contextValue}>{children}</PoolContext.Provider>
  );
}
