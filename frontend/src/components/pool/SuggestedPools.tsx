import { useMemo } from "react";

import { v4 as uuidv4 } from "uuid";

import { Side, getFilteredRewards } from "@suilend/sdk";

import PoolsTable from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import {
  getPoolStakingYieldAprPercent,
  getPoolTotalAprPercent,
} from "@/lib/liquidityMining";
import { ParsedPool } from "@/lib/types";

interface SuggestedPoolsProps {
  tableId: string;
  title: string;
  pools?: ParsedPool[];
  isTvlOnly?: boolean;
}

export default function SuggestedPools({
  tableId,
  title,
  pools,
  isTvlOnly,
}: SuggestedPoolsProps) {
  const { appData, poolsData } = useLoadedAppContext();
  const { poolStats } = useStatsContext();

  const poolsWithExtraData = useMemo(
    () =>
      pools === undefined || poolsData === undefined
        ? undefined
        : pools.map((pool) => {
            // Same code as in frontend/src/components/AprBreakdown.tsx
            const rewards =
              poolsData.rewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? [];
            const filteredRewards = getFilteredRewards(rewards);

            const stakingYieldAprPercent: BigNumber =
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
      pools,
      poolsData,
      appData.lstAprPercentMap,
      poolStats.volumeUsd_24h,
      poolStats.aprPercent_24h,
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
