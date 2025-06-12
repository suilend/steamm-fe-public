import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

import BigNumber from "bignumber.js";
import { v4 as uuidv4 } from "uuid";

import { formatUsd } from "@suilend/sui-fe";
import { shallowPushQuery } from "@suilend/sui-fe-next";

import Divider from "@/components/Divider";
import HistoricalDataChart from "@/components/HistoricalDataChart";
import PoolsSearchInput from "@/components/pools/PoolsSearchInput";
import PoolsTable from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { ChartConfig, ChartType, chartStatNameMap } from "@/lib/chart";
import {
  getFilteredPoolGroups,
  getPoolGroups,
  getPoolsWithExtraData,
} from "@/lib/pools";
import { cn } from "@/lib/utils";

enum RhsChartStat {
  VOLUME = "volume",
  FEES = "fees",
}

enum QueryParams {
  RHS_CHART_STAT = "rhs-chart",
}

export default function PoolsPage() {
  const router = useRouter();
  const queryParams = {
    [QueryParams.RHS_CHART_STAT]: router.query[QueryParams.RHS_CHART_STAT] as
      | RhsChartStat
      | undefined,
  };

  const { appData, featuredPoolIds, verifiedCoinTypes } = useLoadedAppContext();
  const { poolStats, globalHistoricalStats, globalStats } = useStatsContext();

  // TVL
  const totalTvlUsd = useMemo(
    () =>
      appData.pools.reduce(
        (acc, pool) => acc.plus(pool.tvlUsd),
        new BigNumber(0),
      ),
    [appData],
  );

  // RHS chart
  const rhsChartConfigMap: Record<RhsChartStat, ChartConfig> = useMemo(
    () => ({
      [RhsChartStat.VOLUME]: {
        title: chartStatNameMap[RhsChartStat.VOLUME],
        value:
          globalStats.volumeUsd_7d === undefined
            ? undefined
            : formatUsd(globalStats.volumeUsd_7d),
        valuePeriodDays: 7,
        chartType: ChartType.BAR,
        data: globalHistoricalStats.volumeUsd_7d,
        dataPeriodDays: 7,
        formatValue: (value) => formatUsd(new BigNumber(value)),
      },
      [RhsChartStat.FEES]: {
        title: chartStatNameMap[RhsChartStat.FEES],
        value:
          globalStats.feesUsd_7d === undefined
            ? undefined
            : formatUsd(globalStats.feesUsd_7d),
        valuePeriodDays: 7,
        chartType: ChartType.BAR,
        dataPeriodDays: 7,
        data: globalHistoricalStats.feesUsd_7d,
        formatValue: (value) => formatUsd(new BigNumber(value)),
      },
    }),
    [
      globalStats.volumeUsd_7d,
      globalHistoricalStats.volumeUsd_7d,
      globalStats.feesUsd_7d,
      globalHistoricalStats.feesUsd_7d,
    ],
  );

  const selectedRhsChartStat =
    queryParams[QueryParams.RHS_CHART_STAT] &&
    Object.values(RhsChartStat).includes(
      queryParams[QueryParams.RHS_CHART_STAT],
    )
      ? queryParams[QueryParams.RHS_CHART_STAT]
      : RhsChartStat.VOLUME;
  const onSelectedRhsChartStatChange = (rhsChartStat: RhsChartStat) => {
    shallowPushQuery(router, {
      ...router.query,
      [QueryParams.RHS_CHART_STAT]: rhsChartStat,
    });
  };

  const rhsChartConfig = useMemo(
    () => rhsChartConfigMap[selectedRhsChartStat],
    [rhsChartConfigMap, selectedRhsChartStat],
  );

  // Pools
  const poolsWithExtraData = useMemo(
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

  // Group pools by pair
  const poolGroups = useMemo(
    () => getPoolGroups(poolsWithExtraData),
    [poolsWithExtraData],
  );
  const poolGroupsCount =
    poolGroups === undefined
      ? undefined
      : poolGroups.reduce((acc, poolGroup) => acc + poolGroup.pools.length, 0);

  // Featured pools (flat)
  const featuredPoolGroups = useMemo(
    () =>
      featuredPoolIds === undefined || poolsWithExtraData === undefined
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
      verifiedCoinTypes === undefined || poolGroups === undefined
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

  // Search
  // Search - all pools
  const [allPoolsSearchString, setAllPoolsSearchString] = useState<string>("");
  const filteredPoolGroups = getFilteredPoolGroups(
    appData.coinMetadataMap,
    allPoolsSearchString,
    poolGroups,
  );

  const filteredPoolGroupsCount =
    filteredPoolGroups === undefined
      ? undefined
      : filteredPoolGroups.reduce(
          (acc, poolGroup) => acc + poolGroup.pools.length,
          0,
        );

  // Search - verified pools
  const [verifiedPoolsSearchString, setVerifiedPoolsSearchString] =
    useState<string>("");
  const filteredVerifiedPoolGroups = getFilteredPoolGroups(
    appData.coinMetadataMap,
    verifiedPoolsSearchString,
    verifiedPoolGroups,
  );

  const filteredVerifiedPoolGroupsCount =
    filteredVerifiedPoolGroups === undefined
      ? undefined
      : filteredVerifiedPoolGroups.reduce(
          (acc, poolGroup) => acc + poolGroup.pools.length,
          0,
        );

  return (
    <>
      <Head>
        <title>STEAMM</title>
      </Head>

      <div className="flex w-full flex-col gap-8">
        {/* Stats */}
        <div className="flex w-full flex-row items-stretch rounded-md border">
          {/* TVL */}
          <div className="flex-1">
            <div className="w-full p-5 pr-3 sm:pr-5">
              <HistoricalDataChart
                title="TVL"
                value={
                  totalTvlUsd === undefined ? undefined : formatUsd(totalTvlUsd)
                }
                chartType={ChartType.LINE}
                data={globalHistoricalStats.tvlUsd_7d}
                dataPeriodDays={7}
                formatValue={(value) => formatUsd(new BigNumber(value))}
                formatCategory={(category) => category}
              />
            </div>
          </div>

          <Divider className="h-auto w-px bg-border/25 max-sm:hidden" />

          {/* Volume */}
          <div className="flex-1">
            <div className="relative w-full p-5 pl-3 sm:pl-5">
              <HistoricalDataChart
                className="relative z-[1]"
                title={rhsChartConfig.title}
                value={rhsChartConfig.value}
                valuePeriodDays={rhsChartConfig.valuePeriodDays}
                chartType={rhsChartConfig.chartType}
                data={rhsChartConfig.data}
                dataPeriodDays={rhsChartConfig.dataPeriodDays}
                formatValue={rhsChartConfig.formatValue}
                formatCategory={(category) => category}
              />

              <div className="absolute left-3 top-5 z-[2] flex h-[21px] flex-row items-center gap-1 bg-background sm:left-auto sm:right-5">
                {Object.values(RhsChartStat).map((rhsChartStat) => (
                  <button
                    key={rhsChartStat}
                    className={cn(
                      "group flex h-6 flex-row items-center rounded-md border px-2 transition-colors",
                      selectedRhsChartStat === rhsChartStat
                        ? "cursor-default bg-border"
                        : "hover:bg-border/50",
                    )}
                    onClick={() => onSelectedRhsChartStatChange(rhsChartStat)}
                  >
                    <p
                      className={cn(
                        "!text-p2 transition-colors sm:!text-p3",
                        selectedRhsChartStat === rhsChartStat
                          ? "text-foreground"
                          : "text-secondary-foreground group-hover:text-foreground",
                      )}
                    >
                      {chartStatNameMap[rhsChartStat]}
                    </p>
                  </button>
                ))}
              </div>
            </div>
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
          <div className="flex h-[30px] w-full flex-row items-center justify-between gap-4">
            <div className="flex flex-row items-center gap-3">
              <h2 className="text-h3 text-foreground">Verified pools</h2>

              {verifiedPoolGroupsCount === undefined ||
              filteredVerifiedPoolGroupsCount === undefined ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <Tag>
                  {filteredVerifiedPoolGroupsCount !==
                    verifiedPoolGroupsCount && (
                    <>
                      {filteredVerifiedPoolGroupsCount}
                      {"/"}
                    </>
                  )}
                  {verifiedPoolGroupsCount}
                </Tag>
              )}
            </div>

            <PoolsSearchInput
              value={verifiedPoolsSearchString}
              onChange={setVerifiedPoolsSearchString}
            />
          </div>

          <PoolsTable
            tableId="verified-pools"
            poolGroups={filteredVerifiedPoolGroups}
            searchString={verifiedPoolsSearchString}
          />
        </div>

        {/* All pools */}
        <div className="flex w-full flex-col gap-6">
          <div className="flex h-[30px] w-full flex-row items-center justify-between gap-4">
            <div className="flex flex-row items-center gap-3">
              <h2 className="text-h3 text-foreground">All pools</h2>

              {poolGroupsCount === undefined ||
              filteredPoolGroupsCount === undefined ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <Tag>
                  {filteredPoolGroupsCount !== poolGroupsCount && (
                    <>
                      {filteredPoolGroupsCount}
                      {"/"}
                    </>
                  )}
                  {poolGroupsCount}
                </Tag>
              )}
            </div>

            <PoolsSearchInput
              value={allPoolsSearchString}
              onChange={setAllPoolsSearchString}
            />
          </div>

          <PoolsTable
            tableId="all-pools"
            poolGroups={filteredPoolGroups}
            searchString={allPoolsSearchString}
          />
        </div>
      </div>
    </>
  );
}
