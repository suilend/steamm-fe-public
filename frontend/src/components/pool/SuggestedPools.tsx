import { useMemo } from "react";

import { Side, getFilteredRewards } from "@suilend/sdk";

import MiniPoolsTable from "@/components/pool/MiniPoolsTable";
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
  id: string;
  title: string;
  pools?: ParsedPool[];
  tvlOnly?: boolean;
}

export default function SuggestedPools({
  id,
  title,
  pools,
  tvlOnly,
}: SuggestedPoolsProps) {
  const { poolsData } = useLoadedAppContext();
  const { poolStats } = useStatsContext();

  const poolsWithData = useMemo(() => {
    if (pools === undefined || poolsData === undefined) return undefined;

    return pools.map((pool) => {
      // Same code as in frontend/src/components/AprBreakdown.tsx
      const rewards =
        poolsData.rewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? [];
      const filteredRewards = getFilteredRewards(rewards);

      const stakingYieldAprPercent: BigNumber | undefined =
        getPoolStakingYieldAprPercent(pool, poolsData.lstAprPercentMap);

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
    });
  }, [pools, poolsData, poolStats.volumeUsd_24h, poolStats.aprPercent_24h]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-row items-center gap-3">
        <p className="text-h3 text-foreground">{title}</p>

        {poolsWithData === undefined ? (
          <Skeleton className="h-5 w-12" />
        ) : (
          <Tag>{poolsWithData.length}</Tag>
        )}
      </div>

      <MiniPoolsTable
        tableId={`${id}-table`}
        pools={poolsWithData}
        tvlOnly={tvlOnly}
      />
    </div>
  );
}
