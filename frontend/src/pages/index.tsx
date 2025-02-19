import Head from "next/head";
import { useMemo } from "react";

import BigNumber from "bignumber.js";
import { v4 as uuidv4 } from "uuid";

import { formatUsd } from "@suilend/frontend-sui";

import Divider from "@/components/Divider";
import HistoricalDataChart from "@/components/HistoricalDataChart";
import PoolsTable from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { ChartType } from "@/lib/chart";
import { formatPair } from "@/lib/format";
import { ParsedPool, PoolGroup } from "@/lib/types";

export default function PoolsPage() {
  const { appData } = useLoadedAppContext();
  const { statsData } = useStatsContext();

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
          pools: pools.map((pool) => ({
            ...pool,
            volumeUsd_24h: statsData?.poolVolumeUsd_24h_map?.[pool.id],
            aprPercent_24h: statsData?.poolAprPercent_24h_map?.[pool.id],
          })),
        },
      ],
      [] as PoolGroup[],
    );
  }, [
    appData.pools,
    statsData?.poolVolumeUsd_24h_map,
    statsData?.poolAprPercent_24h_map,
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
                  data={statsData?.historicalTvlUsd_24h}
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
                    statsData?.volumeUsd_24h === undefined
                      ? undefined
                      : formatUsd(statsData.volumeUsd_24h)
                  }
                  chartType={ChartType.BAR}
                  periodDays={1}
                  periodChangePercent={null}
                  data={statsData?.historicalVolumeUsd_24h}
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
          <div className="flex h-[30px] w-full flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-3">
              <h2 className="text-h3 text-foreground">All pools</h2>
              <Tag>
                {poolGroups.reduce(
                  (acc, poolGroup) => acc + poolGroup.pools.length,
                  0,
                )}
              </Tag>
            </div>

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

          <PoolsTable tableId="pools" poolGroups={poolGroups} />
        </div>
      </div>
    </>
  );
}
