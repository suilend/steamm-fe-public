import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useMemo, useRef, useState } from "react";

import BigNumber from "bignumber.js";
import { Search, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { formatUsd } from "@suilend/frontend-sui";
import { shallowPushQuery } from "@suilend/frontend-sui-next";
import { Side, getFilteredRewards } from "@suilend/sdk";

import Divider from "@/components/Divider";
import HistoricalDataChart from "@/components/HistoricalDataChart";
import PoolsTable from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import { ChartConfig, ChartType, chartStatNameMap } from "@/lib/chart";
import { formatPair } from "@/lib/format";
import {
  getPoolStakingYieldAprPercent,
  getPoolTotalAprPercent,
} from "@/lib/liquidityMining";
import { CREATE_URL } from "@/lib/navigation";
import { ParsedPool, PoolGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoolsSearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (searchString: string) => void;
}

function PoolsSearchInput({
  placeholder,
  value,
  onChange,
}: PoolsSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { md } = useBreakpoint();

  return (
    <div className="relative z-[1] h-10 rounded-md bg-card transition-colors focus-within:bg-card focus-within:shadow-[inset_0_0_0_1px_hsl(var(--focus))] max-md:max-w-[180px] max-md:flex-1 md:w-[240px]">
      <Search className="pointer-events-none absolute left-3 top-3 z-[2] h-4 w-4 text-secondary-foreground" />
      {value !== "" && (
        <button
          className="group absolute right-1 top-1 z-[2] flex h-8 w-8 flex-row items-center justify-center"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
        >
          <X className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
        </button>
      )}
      <input
        ref={inputRef}
        className={cn(
          "relative z-[1] h-full w-full min-w-0 !border-0 !bg-[transparent] pl-9 text-p2 text-foreground !outline-0 placeholder:text-tertiary-foreground",
          value !== "" ? "pr-9" : "pr-3",
        )}
        type="text"
        placeholder={md ? placeholder : "Search..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

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

  const { appData, poolsData, featuredPoolIds, verifiedPoolIds } =
    useLoadedAppContext();
  const { poolStats, globalHistoricalStats, globalStats } = useStatsContext();

  // TVL
  const totalTvlUsd = useMemo(
    () =>
      poolsData === undefined
        ? undefined
        : poolsData.pools.reduce(
            (acc, pool) => acc.plus(pool.tvlUsd),
            new BigNumber(0),
          ),
    [poolsData],
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
      poolsData === undefined
        ? undefined
        : poolsData.pools.map((pool) => {
            // Same code as in frontend/src/components/AprBreakdown.tsx
            const rewards =
              poolsData.rewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? [];
            const filteredRewards = getFilteredRewards(rewards);

            const stakingYieldAprPercent: BigNumber | undefined =
              getPoolStakingYieldAprPercent(pool, appData.lstAprPercentMap);

            return {
              ...pool,
              volumeUsd_24h: poolStats.volumeUsd_24h[pool.id],
              aprPercent_24h:
                poolStats.aprPercent_24h[pool.id] !== undefined &&
                stakingYieldAprPercent !== undefined
                  ? getPoolTotalAprPercent(
                      poolStats.aprPercent_24h[pool.id].feesAprPercent,
                      pool.suilendWeightedAverageDepositAprPercent,
                      filteredRewards,
                      stakingYieldAprPercent,
                    )
                  : undefined,
            };
          }),
    [
      poolsData,
      appData.lstAprPercentMap,
      poolStats.volumeUsd_24h,
      poolStats.aprPercent_24h,
    ],
  );

  // Group pools by pair
  const poolGroups: PoolGroup[] | undefined = useMemo(() => {
    if (poolsWithExtraData === undefined) return undefined;

    const poolGroupsByPair: Record<string, ParsedPool[]> = {};

    for (const pool of poolsWithExtraData) {
      const formattedPair = formatPair(pool.coinTypes);

      if (!poolGroupsByPair[formattedPair])
        poolGroupsByPair[formattedPair] = [pool];
      else poolGroupsByPair[formattedPair].push(pool);
    }

    return Object.values(poolGroupsByPair).map((pools) => ({
      id: uuidv4(),
      coinTypes: pools[0].coinTypes,
      pools,
    }));
  }, [poolsWithExtraData]);

  // Featured pools (flat)
  const featuredPoolGroups = useMemo(
    () =>
      featuredPoolIds === undefined || poolsWithExtraData === undefined
        ? undefined
        : poolsWithExtraData
            .filter((pool) => featuredPoolIds.includes(pool.id))
            .map((pool) => ({
              id: uuidv4(),
              coinTypes: pool.coinTypes,
              pools: [pool],
            })),
    [featuredPoolIds, poolsWithExtraData],
  );

  // Verified pools (groups)
  const verifiedPoolGroups = useMemo(
    () =>
      verifiedPoolIds === undefined || poolGroups === undefined
        ? undefined
        : poolGroups
            .filter((poolGroup) =>
              poolGroup.pools.some((pool) => verifiedPoolIds.includes(pool.id)),
            )
            .map((poolGroup) => ({
              ...poolGroup,
              pools: poolGroup.pools.filter((pool) =>
                verifiedPoolIds.includes(pool.id),
              ),
            })),
    [verifiedPoolIds, poolGroups],
  );

  // Search
  const getFilteredPoolGroups = useCallback(
    (_searchString: string, _poolGroups: PoolGroup[] | undefined) => {
      if (_poolGroups === undefined) return undefined;
      if (_searchString === "") return _poolGroups;

      return _poolGroups
        .filter((poolGroup) =>
          poolGroup.coinTypes.some((coinType) =>
            `${poolGroup.pools.map((pool) => pool.id).join("__")}__${coinType}__${appData.coinMetadataMap[coinType].symbol}`
              .toLowerCase()
              .includes(_searchString.toLowerCase()),
          ),
        )
        .map((poolGroup) => ({
          ...poolGroup,
          pools: poolGroup.pools.filter((pool) =>
            pool.coinTypes.some((coinType) =>
              `${pool.id}__${coinType}__${appData.coinMetadataMap[coinType].symbol}`
                .toLowerCase()
                .includes(_searchString.toLowerCase()),
            ),
          ),
        }));
    },
    [appData.coinMetadataMap],
  );

  // Search - verified pools
  const [verifiedPoolsSearchString, setVerifiedPoolsSearchString] =
    useState<string>("");
  const filteredVerifiedPoolGroups = getFilteredPoolGroups(
    verifiedPoolsSearchString,
    verifiedPoolGroups,
  );

  // Search - all pools
  const [searchString, setSearchString] = useState<string>("");
  const filteredPoolGroups = getFilteredPoolGroups(searchString, poolGroups);

  return (
    <>
      <Head>
        <title>STEAMM | Pools</title>
      </Head>

      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <div className="flex w-full flex-row items-center justify-between">
            <h1 className="text-h1 text-foreground">Pools</h1>
          </div>

          {/* Stats */}
          <div className="flex w-full flex-col rounded-md border md:flex-row md:items-stretch">
            {/* TVL */}
            <div className="flex-1">
              <div className="w-full p-5">
                <HistoricalDataChart
                  title="TVL"
                  value={
                    totalTvlUsd === undefined
                      ? undefined
                      : formatUsd(totalTvlUsd)
                  }
                  chartType={ChartType.LINE}
                  data={globalHistoricalStats.tvlUsd_7d}
                  dataPeriodDays={7}
                  formatValue={(value) => formatUsd(new BigNumber(value))}
                  formatCategory={(category) => category}
                />
              </div>
            </div>

            <Divider className="md:h-auto md:w-px" />

            {/* Volume */}
            <div className="flex-1">
              <div className="relative w-full p-5">
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

                <div className="absolute right-5 top-5 z-[2] flex flex-row gap-1">
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
                          "!text-p3 transition-colors",
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
        </div>

        {/* Featured pools */}
        {(featuredPoolGroups === undefined ||
          featuredPoolGroups.length > 0) && (
          <div className="flex w-full flex-col gap-6">
            <div className="flex h-[30px] w-full flex-row items-center justify-between gap-4">
              <div className="flex flex-row items-center gap-3">
                <h2 className="text-h3 text-foreground">Featured pools</h2>

                {featuredPoolGroups === undefined ? (
                  <Skeleton className="h-5 w-12" />
                ) : (
                  <Tag>{featuredPoolGroups.length}</Tag>
                )}
              </div>

              <Link href={CREATE_URL}>
                <div className="flex h-10 flex-row items-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80">
                  <p className="text-p2 text-button-1-foreground">
                    Create pool
                  </p>
                </div>
              </Link>
            </div>

            <PoolsTable
              tableId="featured-pools"
              poolGroups={featuredPoolGroups}
              isFlat
            />
          </div>
        )}

        {/* Verified pools */}
        <div className="flex w-full flex-col gap-6">
          <div className="flex h-[30px] w-full flex-row items-center justify-between gap-4">
            <div className="flex flex-row items-center gap-3">
              <h2 className="text-h3 text-foreground">Verified pools</h2>

              {filteredVerifiedPoolGroups === undefined ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <Tag>
                  {filteredVerifiedPoolGroups.reduce(
                    (acc, poolGroup) => acc + poolGroup.pools.length,
                    0,
                  )}
                </Tag>
              )}
            </div>

            <PoolsSearchInput
              placeholder="Search verified pools..."
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

              {filteredPoolGroups === undefined ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <Tag>
                  {filteredPoolGroups.reduce(
                    (acc, poolGroup) => acc + poolGroup.pools.length,
                    0,
                  )}
                </Tag>
              )}
            </div>

            <PoolsSearchInput
              placeholder="Search all pools..."
              value={searchString}
              onChange={setSearchString}
            />
          </div>

          <PoolsTable
            tableId="pools"
            poolGroups={filteredPoolGroups}
            searchString={searchString}
          />
        </div>
      </div>
    </>
  );
}
