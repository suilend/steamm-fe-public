import Head from "next/head";
import { useMemo, useState } from "react";

import BigNumber from "bignumber.js";
import { v4 as uuidv4 } from "uuid";

import { formatUsd } from "@suilend/frontend-sui";
import {
  Side,
  getFilteredRewards,
  getStakingYieldAprPercent,
} from "@suilend/sdk";

import Divider from "@/components/Divider";
import HistoricalDataChart from "@/components/HistoricalDataChart";
import PoolsTable from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import { ChartType } from "@/lib/chart";
import { formatPair } from "@/lib/format";
import { getTotalAprPercent } from "@/lib/liquidityMining";
import { ParsedPool, PoolGroup } from "@/lib/types";

export default function PoolsPage() {
  const { appData, poolsData, featuredPoolIds } = useLoadedAppContext();
  const { poolStats, globalHistoricalStats, globalStats } = useStatsContext();

  const { sm } = useBreakpoint();

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

  // Group pools by pair
  const poolGroups: PoolGroup[] | undefined = useMemo(() => {
    if (poolsData === undefined) return undefined;

    const poolGroupsByPair: Record<string, ParsedPool[]> = {};

    for (const pool of poolsData.pools) {
      const formattedPair = formatPair(pool.coinTypes);

      if (!poolGroupsByPair[formattedPair])
        poolGroupsByPair[formattedPair] = [pool];
      else poolGroupsByPair[formattedPair].push(pool);
    }

    return Object.values(poolGroupsByPair).reduce(
      (acc, pools) => [
        ...acc,
        {
          id: uuidv4(),
          coinTypes: pools[0].coinTypes,
          pools: pools.map((pool) => {
            // Same code as in frontend/src/components/AprBreakdown.tsx
            const rewards =
              poolsData.rewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? [];
            const filteredRewards = getFilteredRewards(rewards);

            const stakingYieldAprPercent: BigNumber | undefined =
              pool.tvlUsd.gt(0)
                ? pool.coinTypes
                    .reduce(
                      (acc, coinType, index) =>
                        acc.plus(
                          new BigNumber(
                            getStakingYieldAprPercent(
                              Side.DEPOSIT,
                              coinType,
                              poolsData.lstAprPercentMap,
                            ) ?? 0,
                          ).times(
                            pool.prices[index].times(pool.balances[index]),
                          ),
                        ),
                      new BigNumber(0),
                    )
                    .div(pool.tvlUsd)
                : new BigNumber(0);

            const totalAprPercent: BigNumber | undefined =
              poolStats.aprPercent_24h[pool.id] !== undefined &&
              stakingYieldAprPercent !== undefined
                ? getTotalAprPercent(
                    poolStats.aprPercent_24h[pool.id].feesAprPercent,
                    pool.suilendWeightedAverageDepositAprPercent,
                    filteredRewards,
                    stakingYieldAprPercent,
                  )
                : undefined;

            return {
              ...pool,
              volumeUsd_24h: poolStats.volumeUsd_24h[pool.id],
              aprPercent_24h: totalAprPercent,
            };
          }),
        },
      ],
      [] as PoolGroup[],
    );
  }, [poolsData, poolStats.aprPercent_24h, poolStats.volumeUsd_24h]);

  // Featured pools
  const featuredPoolGroups = useMemo(
    () =>
      poolGroups === undefined || featuredPoolIds === undefined
        ? undefined
        : poolGroups
            .filter((poolGroup) =>
              poolGroup.pools.some((pool) => featuredPoolIds.includes(pool.id)),
            )
            .map((poolGroup) => ({
              ...poolGroup,
              pools: poolGroup.pools.filter((pool) =>
                featuredPoolIds.includes(pool.id),
              ),
            })),
    [poolGroups, featuredPoolIds],
  );

  // Search
  const [searchString, setSearchString] = useState<string>("");

  const filteredPoolGroups = useMemo(() => {
    if (poolGroups === undefined) return undefined;
    if (searchString === "") return poolGroups;

    return poolGroups
      .filter((poolGroup) =>
        poolGroup.coinTypes.some((coinType) =>
          `${coinType}${appData.coinMetadataMap[coinType].symbol}`
            .toLowerCase()
            .includes(searchString.toLowerCase()),
        ),
      )
      .map((poolGroup) => ({
        ...poolGroup,
        pools: poolGroup.pools.filter((pool) =>
          pool.coinTypes.some((coinType) =>
            `${coinType}${appData.coinMetadataMap[coinType].symbol}`
              .toLowerCase()
              .includes(searchString.toLowerCase()),
          ),
        ),
      }));
  }, [poolGroups, searchString, appData.coinMetadataMap]);

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
                  formatCategory={(category) => category}
                  formatValue={(value) => formatUsd(new BigNumber(value))}
                />
              </div>
            </div>

            <Divider className="md:h-auto md:w-px" />

            {/* Volume */}
            <div className="flex-1">
              <div className="w-full p-5">
                <HistoricalDataChart
                  title="Volume"
                  value={
                    globalStats.volumeUsd_7d === undefined
                      ? undefined
                      : formatUsd(globalStats.volumeUsd_7d)
                  }
                  valuePeriodDays={7}
                  chartType={ChartType.BAR}
                  data={globalHistoricalStats.volumeUsd_7d}
                  dataPeriodDays={7}
                  formatCategory={(category) => category}
                  formatValue={(value) => formatUsd(new BigNumber(value))}
                />
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
                  <Tag>
                    {featuredPoolGroups.reduce(
                      (acc, poolGroup) => acc + poolGroup.pools.length,
                      0,
                    )}
                  </Tag>
                )}
              </div>
            </div>

            <PoolsTable
              tableId="featured-pools"
              poolGroups={featuredPoolGroups}
            />
          </div>
        )}

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

            <div className="flex flex-row items-center justify-end gap-2 max-md:flex-1">
              {/* Filter */}
              <div className="relative z-[1] h-10 max-w-[180px] rounded-md bg-card transition-colors focus-within:bg-card focus-within:shadow-[inset_0_0_0_1px_hsl(var(--focus))] max-md:flex-1 md:w-[180px]">
                <input
                  className="h-full w-full min-w-0 !border-0 !bg-[transparent] px-3 text-p2 text-foreground !outline-0 placeholder:text-tertiary-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  type="text"
                  placeholder={sm ? "Search pools..." : "Search..."}
                  value={searchString}
                  onChange={(e) => setSearchString(e.target.value)}
                />
              </div>

              {/* Create pool */}
              <Tooltip title="Coming soon">
                <div className="w-max">
                  <button
                    className="flex h-10 flex-row items-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
                    disabled
                  >
                    <p className="text-p2 text-button-1-foreground">
                      Create pool
                    </p>
                  </button>
                </div>
              </Tooltip>
            </div>
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
