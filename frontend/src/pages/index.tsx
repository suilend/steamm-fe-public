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
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { useLoadedUserContext } from "@/contexts/UserContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import { ChartType } from "@/lib/chart";
import { formatPair } from "@/lib/format";
import { getTotalAprPercent } from "@/lib/liquidityMining";
import { ParsedPool, PoolGroup } from "@/lib/types";

export default function PoolsPage() {
  const { appData, lstData } = useLoadedAppContext();
  const { userData } = useLoadedUserContext();
  const { poolStats, totalHistoricalStats, totalStats } = useStatsContext();

  const { sm } = useBreakpoint();

  // TVL
  const totalTvlUsd = useMemo(
    () =>
      appData.pools.reduce(
        (acc, pool) => acc.plus(pool.tvlUsd),
        new BigNumber(0),
      ),
    [appData.pools],
  );

  // Group pools by pair
  const poolGroups = useMemo(() => {
    const poolGroupsByPair: Record<string, ParsedPool[]> = {};

    for (const pool of appData.pools) {
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
              userData.rewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? [];
            const filteredRewards = getFilteredRewards(rewards);

            const stakingYieldAprPercent: BigNumber | undefined =
              lstData !== undefined
                ? pool.tvlUsd.gt(0)
                  ? pool.coinTypes
                      .reduce(
                        (acc, coinType, index) =>
                          acc.plus(
                            new BigNumber(
                              getStakingYieldAprPercent(
                                Side.DEPOSIT,
                                coinType,
                                lstData.aprPercentMap,
                              ) ?? 0,
                            ).times(
                              pool.prices[index].times(pool.balances[index]),
                            ),
                          ),
                        new BigNumber(0),
                      )
                      .div(pool.tvlUsd)
                  : new BigNumber(0)
                : undefined;

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
  }, [
    appData.pools,
    userData.rewardMap,
    lstData,
    poolStats.aprPercent_24h,
    poolStats.volumeUsd_24h,
  ]);

  // Featured pairs
  const featuredPoolGroups = useMemo(
    () =>
      poolGroups.filter(
        (poolGroup) =>
          !!appData.featuredCoinTypePairs.find(
            (pair) =>
              poolGroup.coinTypes[0] === pair[0] &&
              poolGroup.coinTypes[1] === pair[1],
          ),
      ),
    [poolGroups, appData.featuredCoinTypePairs],
  );

  // Search
  const [searchString, setSearchString] = useState<string>("");

  const filteredPoolGroups = useMemo(() => {
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
  }, [searchString, poolGroups, appData.coinMetadataMap]);

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
                  hideTitlePeriod
                  value={formatUsd(totalTvlUsd)}
                  chartType={ChartType.LINE}
                  periodDays={1}
                  periodChangePercent={null}
                  data={totalHistoricalStats.tvlUsd_24h}
                  // formatCategory={(category) =>
                  //   formatCoinTypeCategory(
                  //     category,
                  //     appData.coinMetadataMap,
                  //   )
                  // }
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
                    totalStats.volumeUsd_24h === undefined
                      ? undefined
                      : formatUsd(totalStats.volumeUsd_24h)
                  }
                  chartType={ChartType.BAR}
                  periodDays={1}
                  periodChangePercent={null}
                  data={totalHistoricalStats.volumeUsd_24h}
                  // formatCategory={(category) =>
                  //   formatCoinTypeCategory(
                  //     category,
                  //     appData.coinMetadataMap,
                  //   )
                  // }
                  formatCategory={(category) => category}
                  formatValue={(value) => formatUsd(new BigNumber(value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Featured pools */}
        {featuredPoolGroups.length > 0 && (
          <div className="flex w-full flex-col gap-6">
            <div className="flex h-[30px] w-full flex-row items-center justify-between">
              <h2 className="text-h3 text-foreground">Featured pools</h2>
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
              <Tag>
                {filteredPoolGroups.reduce(
                  (acc, poolGroup) => acc + poolGroup.pools.length,
                  0,
                )}
              </Tag>
            </div>

            <div className="flex flex-row items-center justify-end gap-2 max-md:flex-1">
              {/* Filter */}
              <div className="relative z-[1] h-10 max-w-[180px] rounded-md bg-card transition-colors focus-within:bg-card focus-within:shadow-[inset_0_0_0_1px_hsl(var(--focus))] max-md:flex-1 md:w-[180px]">
                <input
                  className="h-full w-full min-w-0 !border-0 !bg-[transparent] px-3 text-p1 text-foreground !outline-0 placeholder:text-tertiary-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
