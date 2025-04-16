import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";

import {
  formatPercent,
  formatPoints,
  formatToken,
  getToken,
  isSteammPoints,
} from "@suilend/frontend-sui";
import {
  Side,
  getDedupedAprRewards,
  getDedupedPerDayRewards,
  getFilteredRewards,
  getStakingYieldAprPercent,
} from "@suilend/sdk";

import AprBreakdownRow from "@/components/AprBreakdownRow";
import TokenLogo from "@/components/TokenLogo";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { getTotalAprPercent } from "@/lib/liquidityMining";
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
  const { appData, poolsData } = useLoadedAppContext();
  const { poolStats } = useStatsContext();

  const rewards = poolsData?.rewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? [];
  const filteredRewards = getFilteredRewards(rewards);

  // Rewards - per day
  const perDayRewards = getDedupedPerDayRewards(filteredRewards);

  // LST staking yield APR
  const stakingYieldAprPercent: BigNumber | undefined =
    poolsData !== undefined
      ? pool.tvlUsd.gt(0)
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
                  ).times(pool.prices[index].times(pool.balances[index])),
                ),
              new BigNumber(0),
            )
            .div(pool.tvlUsd)
        : new BigNumber(0)
      : undefined;

  // Rewards - APR
  const aprRewards = getDedupedAprRewards(filteredRewards);

  // Total APR
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

  if (stakingYieldAprPercent === undefined || totalAprPercent === undefined)
    return <Skeleton className={cn("h-[24px] w-16", skeletonClassName)} />;
  return (
    <div>
      <Tooltip
        content={
          perDayRewards.length > 0 ||
          pool.suilendWeightedAverageDepositAprPercent.gt(0) ||
          stakingYieldAprPercent.gt(0) ||
          aprRewards.length > 0 ? (
            <div className="flex flex-col gap-3">
              {/* Rewards - per day */}
              {perDayRewards.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-p1 text-foreground">Points</p>

                  {perDayRewards.map((r, index) => (
                    <AprBreakdownRow
                      key={index}
                      isLast={index === perDayRewards.length - 1}
                      value={
                        <>
                          {isSteammPoints(r.stats.rewardCoinType)
                            ? formatPoints(r.stats.perDay, { dp: 3 })
                            : formatToken(r.stats.perDay, { exact: false })}
                          <span className="text-p2 text-secondary-foreground">
                            Per $ per day
                          </span>
                        </>
                      }
                    >
                      <div className="flex flex-row items-center gap-1.5">
                        <TokenLogo
                          token={getToken(
                            r.stats.rewardCoinType,
                            appData.coinMetadataMap[r.stats.rewardCoinType],
                          )}
                          size={16}
                        />
                        {r.stats.symbol}
                      </div>
                    </AprBreakdownRow>
                  ))}
                </div>
              )}

              {/* APR */}
              <div className="flex flex-col gap-2">
                {/* Total APR */}
                <div className="flex flex-row items-center justify-between gap-4">
                  <p className="text-p1 text-foreground">Total APR</p>
                  <p className="text-p1 font-bold text-foreground">
                    {formatPercent(totalAprPercent)}
                  </p>
                </div>

                {/* feesAprPercent */}
                <AprBreakdownRow
                  isLast={
                    !pool.suilendWeightedAverageDepositAprPercent.gt(0) &&
                    !stakingYieldAprPercent.gt(0) &&
                    aprRewards.length === 0
                  }
                  labelEndDecorator="24H"
                  value={formatPercent(
                    poolStats.aprPercent_24h[pool.id].feesAprPercent,
                  )}
                >
                  LP fees
                </AprBreakdownRow>

                {/* suilendWeightedAverageDepositAprPercent */}
                {pool.suilendWeightedAverageDepositAprPercent.gt(0) && (
                  <AprBreakdownRow
                    isLast={
                      !stakingYieldAprPercent.gt(0) && aprRewards.length === 0
                    }
                    value={formatPercent(
                      pool.suilendWeightedAverageDepositAprPercent,
                    )}
                  >
                    Suilend deposit APR
                  </AprBreakdownRow>
                )}

                {/* LST staking yield */}
                {stakingYieldAprPercent.gt(0) && (
                  <AprBreakdownRow
                    isLast={aprRewards.length === 0}
                    value={formatPercent(stakingYieldAprPercent)}
                  >
                    Staking yield*
                  </AprBreakdownRow>
                )}

                {/* Rewards - APR */}
                {aprRewards.map((r, index) => (
                  <AprBreakdownRow
                    key={index}
                    isLast={index === aprRewards.length - 1}
                    value={formatPercent(r.stats.aprPercent)}
                  >
                    Rewards in
                    <div className="flex flex-row items-center gap-1.5">
                      <TokenLogo
                        token={getToken(
                          r.stats.rewardCoinType,
                          appData.coinMetadataMap[r.stats.rewardCoinType],
                        )}
                        size={16}
                      />
                      {r.stats.symbol}
                    </div>
                  </AprBreakdownRow>
                ))}
              </div>
            </div>
          ) : undefined
        }
      >
        <div className="flex w-max flex-row items-center gap-2">
          <TokenLogos
            coinTypes={Array.from(
              new Set(
                [...perDayRewards, ...aprRewards].map(
                  (r) => r.stats.rewardCoinType,
                ),
              ),
            )}
            size={16}
          />
          <p
            className={cn(
              "!text-p1",
              perDayRewards.length > 0 ||
                pool.suilendWeightedAverageDepositAprPercent.gt(0) ||
                stakingYieldAprPercent.gt(0) ||
                aprRewards.length > 0
                ? perDayRewards.length > 0 || aprRewards.length > 0
                  ? cn(
                      "text-button-2-foreground decoration-button-2-foreground/50",
                      hoverUnderlineClassName,
                    )
                  : cn(
                      "text-foreground decoration-foreground/50",
                      hoverUnderlineClassName,
                    )
                : "text-foreground",
              valueClassName,
            )}
          >
            {formatPercent(totalAprPercent)}
            {stakingYieldAprPercent.gt(0) && "*"}
          </p>
        </div>
      </Tooltip>
    </div>
  );
}
