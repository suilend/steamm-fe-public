import { useMemo } from "react";

import { v4 as uuidv4 } from "uuid";

import { ParsedPool } from "@suilend/steamm-sdk";

import PoolsTable from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { getPoolsWithExtraData } from "@/lib/pools";

interface SuggestedPoolsProps {
  tableId: string;
  title: string;
  pools: ParsedPool[];
  isTvlOnly?: boolean;
}

export default function SuggestedPools({
  tableId,
  title,
  pools,
  isTvlOnly,
}: SuggestedPoolsProps) {
  const { appData } = useLoadedAppContext();
  const { poolStats } = useStatsContext();

  const poolsWithExtraData = useMemo(
    () =>
      getPoolsWithExtraData(
        {
          lstAprPercentMap: appData.lstAprPercentMap,
          pools,
          normalizedPoolRewardMap: appData.normalizedPoolRewardMap,
        },
        poolStats,
      ),
    [
      appData.lstAprPercentMap,
      pools,
      appData.normalizedPoolRewardMap,
      poolStats,
    ],
  );

  const poolGroups = useMemo(
    () =>
      poolsWithExtraData === undefined
        ? undefined
        : poolsWithExtraData.map((pool) => ({
            id: uuidv4(),
            coinTypes: pool.coinTypes,
            pools: [pool],
          })),
    [poolsWithExtraData],
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-row items-center gap-3">
        <p className="text-h3 text-foreground">{title}</p>

        {poolGroups === undefined ? (
          <Skeleton className="h-5 w-12" />
        ) : (
          <Tag>{poolGroups.length}</Tag>
        )}
      </div>

      <PoolsTable
        tableId={tableId}
        poolGroups={poolGroups}
        isFlat
        isTvlOnly={isTvlOnly}
      />
    </div>
  );
}
