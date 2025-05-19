import Head from "next/head";
import { useMemo, useState } from "react";

import PoolsSearchInput from "@/components/pools/PoolsSearchInput";
import PoolsTable from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import {
  getFilteredPoolGroups,
  getPoolGroups,
  getPoolsWithExtraData,
} from "@/lib/pools";

export default function PoolsPage() {
  const { appData } = useLoadedAppContext();
  const { poolStats } = useStatsContext();

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

  // Search
  // Search - all pools
  const [searchString, setSearchString] = useState<string>("");
  const filteredPoolGroups = getFilteredPoolGroups(
    appData.coinMetadataMap,
    searchString,
    poolGroups,
  );

  const filteredPoolGroupsCount =
    filteredPoolGroups === undefined
      ? undefined
      : filteredPoolGroups.reduce(
          (acc, poolGroup) => acc + poolGroup.pools.length,
          0,
        );

  return (
    <>
      <Head>
        <title>STEAMM | Pools</title>
      </Head>

      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full flex-row items-center justify-between gap-4">
          <div className="flex flex-row items-center gap-3">
            <h1 className="text-h1 text-foreground">All pools</h1>

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

          <PoolsSearchInput value={searchString} onChange={setSearchString} />
        </div>

        <PoolsTable
          tableId="pools"
          poolGroups={filteredPoolGroups}
          searchString={searchString}
        />
      </div>
    </>
  );
}
