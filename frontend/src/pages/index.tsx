import Head from "next/head";
import { useMemo } from "react";

import BigNumber from "bignumber.js";
import { v4 as uuidv4 } from "uuid";

import { formatUsd } from "@suilend/frontend-sui";

import Divider from "@/components/Divider";
import HistoricalDataChart from "@/components/HistoricalDataChart";
import PoolsTable from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { ChartType, formatCoinTypeCategory } from "@/lib/chart";
import { formatPair } from "@/lib/format";
import { ParsedPool, PoolGroup } from "@/lib/types";

export default function PoolsPage() {
  const { appData } = useLoadedAppContext();

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
          pools,
        },
      ],
      [] as PoolGroup[],
    );
  }, [appData.pools]);

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
          <h1 className="text-h1 text-foreground">Pools</h1>

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
                  periodDays={30}
                  periodChangePercent={null}
                  data={appData.historicalTvlUsd_30d}
                  formatCategory={(category) =>
                    formatCoinTypeCategory(
                      category,
                      appData.poolCoinMetadataMap,
                    )
                  }
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
                    appData.volumeUsd_30d !== undefined
                      ? formatUsd(appData.volumeUsd_30d)
                      : undefined
                  }
                  chartType={ChartType.BAR}
                  periodDays={30}
                  periodChangePercent={new BigNumber(-5 + Math.random() * 10)}
                  data={appData.historicalVolumeUsd_30d}
                  formatCategory={(category) =>
                    formatCoinTypeCategory(
                      category,
                      appData.poolCoinMetadataMap,
                    )
                  }
                  formatValue={(value) => formatUsd(new BigNumber(value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Featured pools */}
        <div className="flex w-full flex-col gap-6">
          <h2 className="text-h3 text-foreground">Featured pools</h2>

          <PoolsTable
            className="max-h-[480px]"
            tableId="featured-pools"
            poolGroups={featuredPoolGroups}
          />
        </div>

        {/* All pools */}
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-row items-center gap-3">
            <h2 className="text-h3 text-foreground">All pools</h2>
            <Tag>
              {poolGroups.reduce(
                (acc, poolGroup) => acc + poolGroup.pools.length,
                0,
              )}
            </Tag>
          </div>

          <PoolsTable
            className="max-h-[480px]"
            tableId="pools"
            poolGroups={poolGroups}
          />
        </div>
      </div>
    </>
  );
}
