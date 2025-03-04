import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";

import { formatPercent } from "@suilend/frontend-sui";

import AprBreakdownRow from "@/components/AprBreakdownRow";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useStatsContext } from "@/contexts/StatsContext";
import { ParsedPool } from "@/lib/types";
import { cn, hoverUnderlineClassName } from "@/lib/utils";

interface AprBreakdownProps {
  skeletonClassName?: ClassValue;
  valueClassName?: ClassValue;
  pool: ParsedPool;
}

export default function AprBreakdown({
  skeletonClassName,
  valueClassName,
  pool,
}: AprBreakdownProps) {
  const { poolStats } = useStatsContext();

  const hasSuilendDepositAprPercent =
    poolStats.aprPercent_24h[
      pool.id
    ]?.suilendWeightedAverageDepositAprPercent?.gt(0);

  if (poolStats.aprPercent_24h[pool.id] === undefined)
    return <Skeleton className={cn("h-[24px] w-16", skeletonClassName)} />;
  return (
    <div>
      <Tooltip
        content={
          hasSuilendDepositAprPercent ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                {/* Total APR */}
                <div className="flex flex-row items-center justify-between gap-4">
                  <p className="text-p2 text-foreground">Total APR</p>
                  <p className="text-p2 text-foreground">
                    {formatPercent(poolStats.aprPercent_24h[pool.id].total)}
                  </p>
                </div>

                {/* feesAprPercent */}
                <AprBreakdownRow
                  isLast={!hasSuilendDepositAprPercent}
                  labelEndDecorator="24H"
                  value={formatPercent(
                    poolStats.aprPercent_24h[pool.id].feesAprPercent,
                  )}
                >
                  Fees
                </AprBreakdownRow>

                {/* suilendWeightedAverageDepositAprPercent */}
                {hasSuilendDepositAprPercent && (
                  <AprBreakdownRow
                    isLast
                    value={formatPercent(
                      poolStats.aprPercent_24h[pool.id]
                        .suilendWeightedAverageDepositAprPercent as BigNumber,
                    )}
                  >
                    Suilend deposit APR
                  </AprBreakdownRow>
                )}
              </div>
            </div>
          ) : undefined
        }
      >
        <div className="flex w-full flex-row items-center gap-2">
          <TokenLogos
            suilend={hasSuilendDepositAprPercent}
            coinTypes={[]} // TODO
            size={16}
          />
          <p
            className={cn(
              "!text-p1 text-foreground",
              hasSuilendDepositAprPercent &&
                cn("decoration-foreground/50", hoverUnderlineClassName),
              valueClassName,
            )}
          >
            {formatPercent(poolStats.aprPercent_24h[pool.id].total)}
          </p>
        </div>
      </Tooltip>
    </div>
  );
}
