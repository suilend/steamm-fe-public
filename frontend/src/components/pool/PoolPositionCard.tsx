import { Loader2 } from "lucide-react";

import { formatUsd } from "@suilend/sui-fe";

import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { usePoolPositionsContext } from "@/contexts/PoolPositionsContext";
import useStake from "@/hooks/useStake";

export default function PoolPositionCard() {
  const { appData } = useLoadedAppContext();
  const { poolPositions } = usePoolPositionsContext();
  const { pool } = usePoolContext();

  const poolPosition =
    poolPositions === undefined
      ? undefined
      : (poolPositions.find((position) => position.pool.id === pool.id) ??
        null);

  // Stake
  const { isStaking, onStakeClick } = useStake(poolPosition ?? undefined);

  if (poolPosition === null) return null;
  return (
    <>
      {/* LP Tokens not staked */}
      {!!appData.suilend.lmMarket.reserveMap[pool.lpTokenType] &&
        poolPosition !== undefined &&
        poolPosition.stakedPercent.lt(100) && (
          <div className="flex w-full flex-row items-center justify-between gap-4 rounded-md border border-warning bg-warning/25 px-5 py-2">
            <p className="text-p2 text-foreground">
              Your LP tokens are not staked. Stake to earn rewards.
            </p>

            <button
              className="flex h-6 w-[48px] flex-row items-center justify-center rounded-md bg-foreground px-2 transition-colors hover:bg-foreground/80 disabled:pointer-events-none disabled:opacity-50"
              disabled={isStaking}
              onClick={onStakeClick}
            >
              {isStaking ? (
                <Loader2 className="h-4 w-4 animate-spin text-background" />
              ) : (
                <p className="text-p3 text-background">Stake</p>
              )}
            </button>
          </div>
        )}

      <div className="flex w-full flex-col gap-1 rounded-md border p-5">
        <p className="text-p2 text-secondary-foreground">Your balance</p>
        {poolPosition === undefined ? (
          <Skeleton className="h-[36px] w-20" />
        ) : (
          <Tooltip title={formatUsd(poolPosition.balanceUsd, { exact: true })}>
            <p className="w-max text-h2 text-foreground">
              {formatUsd(poolPosition.balanceUsd)}
            </p>
          </Tooltip>
        )}
      </div>
    </>
  );
}
