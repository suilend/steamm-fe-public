import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef } from "react";

import BigNumber from "bignumber.js";
import { v4 as uuidv4 } from "uuid";

import { ParsedPool } from "@suilend/steamm-sdk";
import { formatUsd } from "@suilend/sui-fe";
import { shallowPushQuery } from "@suilend/sui-fe-next";

import HistoricalDataChart from "@/components/HistoricalDataChart";
import PoolsTable from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import {
  ChartConfig,
  ChartDataType,
  ChartPeriod,
  ChartType,
  chartDataTypeNameMap,
} from "@/lib/chart";
import { getPoolGroups, getPoolsWithExtraData } from "@/lib/pools";
import { PoolGroup } from "@/lib/types";

enum QueryParams {
  LHS_CHART_PERIOD = "lhs-period",
  RHS_CHART_DATA_TYPE = "rhs-chart",
  RHS_CHART_PERIOD = "rhs-period",
}

export default function PoolsPage() {
  const router = useRouter();
  const queryParams = useMemo(
    () => ({
      [QueryParams.LHS_CHART_PERIOD]: router.query[
        QueryParams.LHS_CHART_PERIOD
      ] as ChartPeriod | undefined,
      [QueryParams.RHS_CHART_DATA_TYPE]: router.query[
        QueryParams.RHS_CHART_DATA_TYPE
      ] as ChartDataType | undefined,
      [QueryParams.RHS_CHART_PERIOD]: router.query[
        QueryParams.RHS_CHART_PERIOD
      ] as ChartPeriod | undefined,
    }),
    [router.query],
  );

  const { appData, featuredPoolIds, verifiedCoinTypes } = useLoadedAppContext();
  const {
    poolStats,
    globalHistoricalStats,
    fetchGlobalHistoricalStats,
    globalStats,
  } = useStatsContext();

  // Query params
  const selectedLhsChartPeriod = useMemo(
    () =>
      queryParams[QueryParams.LHS_CHART_PERIOD] &&
      Object.values(ChartPeriod).includes(
        queryParams[QueryParams.LHS_CHART_PERIOD],
      )
        ? queryParams[QueryParams.LHS_CHART_PERIOD]
        : ChartPeriod.ONE_WEEK,
    [queryParams],
  );
  const selectedRhsChartDataType = useMemo(
    () =>
      queryParams[QueryParams.RHS_CHART_DATA_TYPE] &&
      Object.values(ChartDataType).includes(
        queryParams[QueryParams.RHS_CHART_DATA_TYPE],
      )
        ? queryParams[QueryParams.RHS_CHART_DATA_TYPE]
        : ChartDataType.VOLUME,
    [queryParams],
  );
  const selectedRhsChartPeriod = useMemo(
    () =>
      queryParams[QueryParams.RHS_CHART_PERIOD] &&
      Object.values(ChartPeriod).includes(
        queryParams[QueryParams.RHS_CHART_PERIOD],
      )
        ? queryParams[QueryParams.RHS_CHART_PERIOD]
        : ChartPeriod.ONE_WEEK,
    [queryParams],
  );

  const onSelectedLhsChartPeriodChange = (lhsChartPeriod: ChartPeriod) => {
    shallowPushQuery(router, {
      ...router.query,
      [QueryParams.LHS_CHART_PERIOD]: lhsChartPeriod,
    });
  };
  const onSelectedRhsChartDataTypeChange = (
    rhsChartDataType: ChartDataType,
  ) => {
    shallowPushQuery(router, {
      ...router.query,
      [QueryParams.RHS_CHART_DATA_TYPE]: rhsChartDataType,
    });
  };
  const onSelectedRhsChartPeriodChange = (rhsChartPeriod: ChartPeriod) => {
    shallowPushQuery(router, {
      ...router.query,
      [QueryParams.RHS_CHART_PERIOD]: rhsChartPeriod,
    });
  };

  // Historical stats
  const hasFetchedGlobalHistoricalStatsMapRef = useRef<
    Record<ChartPeriod, boolean>
  >(
    Object.values(ChartPeriod).reduce(
      (acc, period) => ({ ...acc, [period]: false }),
      {} as Record<ChartPeriod, boolean>,
    ),
  );

  useEffect(() => {
    if (hasFetchedGlobalHistoricalStatsMapRef.current[selectedLhsChartPeriod])
      return;
    hasFetchedGlobalHistoricalStatsMapRef.current[selectedLhsChartPeriod] =
      true;

    fetchGlobalHistoricalStats(selectedLhsChartPeriod);
  }, [selectedLhsChartPeriod, fetchGlobalHistoricalStats]);
  useEffect(() => {
    if (hasFetchedGlobalHistoricalStatsMapRef.current[selectedRhsChartPeriod])
      return;
    hasFetchedGlobalHistoricalStatsMapRef.current[selectedRhsChartPeriod] =
      true;

    fetchGlobalHistoricalStats(selectedRhsChartPeriod);
  }, [selectedRhsChartPeriod, fetchGlobalHistoricalStats]);

  // LHS
  const globalTvlUsd = useMemo(
    () =>
      appData.pools.reduce(
        (acc, pool) => acc.plus(pool.tvlUsd),
        new BigNumber(0),
      ),
    [appData],
  );

  const lhsChartConfig: ChartConfig = useMemo(
    () => ({
      getChartType: (dataType: string) => {
        return ChartType.LINE;
      },
      getValueFormatter: (dataType: string) => {
        return (value: number) => formatUsd(new BigNumber(value));
      },
      dataTypeOptions: [ChartDataType.TVL].map((dataType) => ({
        id: dataType,
        name: chartDataTypeNameMap[dataType],
      })),
      totalMap: {
        [ChartDataType.TVL]: Object.values(ChartPeriod).reduce(
          (acc, period) => ({ ...acc, [period]: globalTvlUsd }),
          {} as Record<ChartPeriod, BigNumber | undefined>,
        ),
      },
      dataMap: {
        [ChartDataType.TVL]: globalHistoricalStats.tvlUsd,
      },
    }),
    [globalTvlUsd, globalHistoricalStats.tvlUsd],
  );

  // RHS
  const rhsChartConfig: ChartConfig = useMemo(
    () => ({
      getChartType: (dataType: string) => {
        return ChartType.BAR;
      },
      getValueFormatter: (dataType: string) => {
        return (value: number) => formatUsd(new BigNumber(value));
      },
      dataTypeOptions: [ChartDataType.VOLUME, ChartDataType.FEES].map(
        (dataType) => ({
          id: dataType,
          name: chartDataTypeNameMap[dataType],
        }),
      ),
      totalMap: {
        [ChartDataType.VOLUME]: globalStats.volumeUsd,
        [ChartDataType.FEES]: globalStats.feesUsd,
      },
      dataMap: {
        [ChartDataType.VOLUME]: globalHistoricalStats.volumeUsd,
        [ChartDataType.FEES]: globalHistoricalStats.feesUsd,
      },
    }),
    [
      globalStats.volumeUsd,
      globalStats.feesUsd,
      globalHistoricalStats.volumeUsd,
      globalHistoricalStats.feesUsd,
    ],
  );

  // Pools
  const poolsWithExtraData: ParsedPool[] = useMemo(
    () =>
      getPoolsWithExtraData(
        {
          lstAprPercentMap: appData.lstAprPercentMap,
          pools: appData.pools,
          normalizedPoolRewardMap: appData.normalizedPoolRewardMap,
        },
        poolStats,
      ),
    [
      appData.lstAprPercentMap,
      appData.pools,
      appData.normalizedPoolRewardMap,
      poolStats,
    ],
  );

  const poolGroups: PoolGroup[] = useMemo(
    () => getPoolGroups(poolsWithExtraData),
    [poolsWithExtraData],
  );

  // Featured pools (flat)
  const featuredPoolGroups = useMemo(
    () =>
      featuredPoolIds === undefined
        ? undefined
        : poolsWithExtraData
            .filter((pool) => featuredPoolIds.includes(pool.id))
            .sort((a, b) =>
              featuredPoolIds.indexOf(a.id) > featuredPoolIds.indexOf(b.id)
                ? 1
                : -1,
            ) // Sort by featured pool order on Launchdarkly
            .map((pool) => ({
              id: uuidv4(),
              coinTypes: pool.coinTypes,
              pools: [pool],
            })),
    [featuredPoolIds, poolsWithExtraData],
  );
  const featuredPoolGroupsCount =
    featuredPoolGroups === undefined ? undefined : featuredPoolGroups.length; // Flat

  // Verified pools (groups)
  const verifiedPoolGroups = useMemo(
    () =>
      verifiedCoinTypes === undefined
        ? undefined
        : poolGroups
            .filter((poolGroup) =>
              poolGroup.pools.some((pool) =>
                pool.coinTypes.every((coinType) =>
                  verifiedCoinTypes.includes(coinType),
                ),
              ),
            )
            .map((poolGroup) => ({
              ...poolGroup,
              pools: poolGroup.pools.filter((pool) =>
                pool.coinTypes.every((coinType) =>
                  verifiedCoinTypes.includes(coinType),
                ),
              ),
            })),
    [verifiedCoinTypes, poolGroups],
  );
  const verifiedPoolGroupsCount =
    verifiedPoolGroups === undefined
      ? undefined
      : verifiedPoolGroups.reduce(
          (acc, poolGroup) => acc + poolGroup.pools.length,
          0,
        );

  return (
    <>
      <Head>
        <title>STEAMM</title>
      </Head>

      <div className="flex w-full max-w-6xl flex-col gap-8">
        {/* Stats */}
        <div className="flex w-full flex-row items-stretch gap-1 sm:gap-5">
          {/* TVL */}
          <div className="min-w-0 flex-1 rounded-md border p-5">
            <HistoricalDataChart
              topSelectsClassName="-mx-5 px-5"
              selectedDataType={ChartDataType.TVL}
              onSelectedDataTypeChange={() => {}}
              selectedPeriod={selectedLhsChartPeriod}
              onSelectedPeriodChange={onSelectedLhsChartPeriodChange}
              {...lhsChartConfig}
            />
          </div>

          {/* Volume */}
          <div className="min-w-0 flex-1 rounded-md border p-5">
            <HistoricalDataChart
              topSelectsClassName="-mx-5 px-5"
              selectedDataType={selectedRhsChartDataType}
              onSelectedDataTypeChange={onSelectedRhsChartDataTypeChange}
              selectedPeriod={selectedRhsChartPeriod}
              onSelectedPeriodChange={onSelectedRhsChartPeriodChange}
              {...rhsChartConfig}
            />
          </div>
        </div>

        {/* Featured pools */}
        {(featuredPoolGroups === undefined ||
          featuredPoolGroups.length > 0) && (
          <div className="flex w-full flex-col gap-6">
            <div className="flex flex-row items-center gap-3">
              <h2 className="text-h3 text-foreground">Featured pools</h2>

              {featuredPoolGroupsCount === undefined ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <Tag>{featuredPoolGroupsCount}</Tag>
              )}
            </div>

            <PoolsTable
              tableId="featured-pools"
              poolGroups={featuredPoolGroups}
              isFlat
              noDefaultSort
            />
          </div>
        )}

        {/* Verified pools */}
        <div className="flex w-full flex-col gap-6">
          <div className="flex w-full flex-row items-center gap-3">
            <h2 className="text-h3 text-foreground">Verified pools</h2>

            {verifiedPoolGroupsCount === undefined ? (
              <Skeleton className="h-5 w-12" />
            ) : (
              <Tag>{verifiedPoolGroupsCount}</Tag>
            )}
          </div>

          <PoolsTable
            tableId="verified-pools"
            poolGroups={verifiedPoolGroups}
          />
        </div>
      </div>
    </>
  );
}
