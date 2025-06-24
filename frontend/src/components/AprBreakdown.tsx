import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";

import {
  Side,
  getDedupedAprRewards,
  getDedupedPerDayRewards,
  getFilteredRewards,
} from "@suilend/sdk";
import { ParsedPool } from "@suilend/steamm-sdk";
import {
  formatPercent,
  formatPoints,
  formatToken,
  getToken,
  isSteammPoints,
} from "@suilend/sui-fe";

import BreakdownRow from "@/components/BreakdownRow";
import TokenLogo from "@/components/TokenLogo";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { ChartPeriod } from "@/lib/chart";
import {
  getPoolStakingYieldAprPercent,
  getPoolTotalAprPercent,
} from "@/lib/liquidityMining";
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
  const { appData } = useLoadedAppContext();
  const { poolStats } = useStatsContext();

  const rewards =
    appData.normalizedPoolRewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? [];
  const filteredRewards = getFilteredRewards(rewards);

  // Rewards - per day
  const perDayRewards = getDedupedPerDayRewards(filteredRewards);

  // LST staking yield APR
  const stakingYieldAprPercent: BigNumber = getPoolStakingYieldAprPercent(
    pool,
    appData.lstAprPercentMap,
  );

  // Rewards - APR
  const aprRewards = getDedupedAprRewards(filteredRewards);

  // Total APR
  const totalAprPercent: BigNumber | undefined =
    poolStats.aprPercent[ChartPeriod.ONE_DAY][pool.id] !== undefined &&
    stakingYieldAprPercent !== undefined
      ? getPoolTotalAprPercent(
          poolStats.aprPercent[ChartPeriod.ONE_DAY][pool.id].feesAprPercent,
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
          pool.suilendDepositAprPercents.some((aprPercent) =>
            aprPercent.gt(0),
          ) ||
          stakingYieldAprPercent.gt(0) ||
          aprRewards.length > 0 ? (
            <div className="flex flex-col gap-3">
              {/* Rewards - per day */}
              {perDayRewards.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-p1 text-foreground">Points</p>

                  {perDayRewards.map((r, index) => (
                    <BreakdownRow
                      key={index}
                      isLast={index === perDayRewards.length - 1}
                      value={
                        <>
                          {isSteammPoints(r.stats.rewardCoinType)
                            ? formatPoints(r.stats.perDay, { dp: 4 })
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
                    </BreakdownRow>
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
                <BreakdownRow
                  isLast={
                    !pool.suilendDepositAprPercents.some((aprPercent) =>
                      aprPercent.gt(0),
                    ) &&
                    !stakingYieldAprPercent.gt(0) &&
                    aprRewards.length === 0
                  }
                  labelEndDecorator="24H"
                  value={formatPercent(
                    poolStats.aprPercent[ChartPeriod.ONE_DAY][pool.id]
                      ?.feesAprPercent ?? new BigNumber(0),
                  )}
                >
                  LP fees
                </BreakdownRow>

                {/* suilendDepositAprPercents */}
                {pool.suilendDepositAprPercents.some((aprPercent) =>
                  aprPercent.gt(0),
                ) &&
                  pool.suilendDepositAprPercents.map((aprPercent, index) => {
                    if (aprPercent.eq(0)) return null;
                    return (
                      <BreakdownRow
                        key={index}
                        isLast={
                          index === pool.suilendDepositAprPercents.length - 1 &&
                          !stakingYieldAprPercent.gt(0) &&
                          aprRewards.length === 0
                        }
                        value={formatPercent(
                          aprPercent
                            .times(
                              pool.balances[index].times(pool.prices[index]),
                            )
                            .div(pool.tvlUsd),
                        )}
                      >
                        <TokenLogo
                          token={getToken(
                            pool.coinTypes[index],
                            appData.coinMetadataMap[pool.coinTypes[index]],
                          )}
                          size={16}
                        />{" "}
                        Suilend deposit APR
                      </BreakdownRow>
                    );
                  })}

                {/* LST staking yield */}
                {stakingYieldAprPercent.gt(0) && (
                  <BreakdownRow
                    isLast={aprRewards.length === 0}
                    value={formatPercent(stakingYieldAprPercent)}
                  >
                    Staking yield*
                  </BreakdownRow>
                )}

                {/* Rewards - APR */}
                {aprRewards.map((r, index) => (
                  <BreakdownRow
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
                  </BreakdownRow>
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
                pool.suilendDepositAprPercents.some((aprPercent) =>
                  aprPercent.gt(0),
                ) ||
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
