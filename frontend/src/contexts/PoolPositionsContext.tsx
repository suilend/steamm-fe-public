import { PropsWithChildren, createContext, useContext, useMemo } from "react";

import BigNumber from "bignumber.js";

import {
  NORMALIZED_STEAMM_POINTS_COINTYPE,
  isSteammPoints,
} from "@suilend/frontend-sui";
import {
  Side,
  getFilteredRewards,
  getStakingYieldAprPercent,
} from "@suilend/sdk";

import { useAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { useUserContext } from "@/contexts/UserContext";
import { getPoolTotalAprPercent } from "@/lib/liquidityMining";
import {
  getIndexesOfObligationsWithDeposit,
  getObligationDepositedAmount,
} from "@/lib/obligation";
import { PoolPosition } from "@/lib/types";

interface PoolPositionsContext {
  poolPositions: PoolPosition[] | undefined;

  totalPoints: BigNumber | undefined;
  pointsPerDay: BigNumber | undefined;
}

const PoolPositionsContext = createContext<PoolPositionsContext>({
  poolPositions: undefined,

  totalPoints: undefined,
  pointsPerDay: undefined,
});

export const usePoolPositionsContext = () => useContext(PoolPositionsContext);

export function PoolPositionsContextProvider({ children }: PropsWithChildren) {
  const { poolsData } = useAppContext();
  const { getBalance, userData } = useUserContext();
  const { poolStats } = useStatsContext();

  // Pool positions
  const poolPositions: PoolPosition[] | undefined = useMemo(
    () =>
      poolsData === undefined || userData === undefined
        ? undefined
        : (poolsData.pools
            .map((pool) => {
              const obligationIndexes = getIndexesOfObligationsWithDeposit(
                userData.obligations,
                pool.lpTokenType,
              );

              const lpTokenBalance = getBalance(pool.lpTokenType);
              const lpTokenDepositedAmount = obligationIndexes.reduce(
                (acc, obligationIndex) =>
                  acc.plus(
                    getObligationDepositedAmount(
                      userData.obligations[obligationIndex],
                      pool.lpTokenType,
                    ),
                  ),
                new BigNumber(0),
              );
              const lpTokenTotalAmount = lpTokenBalance.plus(
                lpTokenDepositedAmount,
              );
              if (lpTokenTotalAmount.eq(0)) return undefined;

              const balances = [0, 1].map((index) =>
                lpTokenTotalAmount
                  .div(pool.lpSupply)
                  .times(pool.balances[index]),
              );
              const balanceUsd = new BigNumber(
                balances[0].times(pool.prices[0]),
              ).plus(balances[1].times(pool.prices[1]));

              const stakedPercent = lpTokenDepositedAmount
                .div(lpTokenTotalAmount)
                .times(100);

              // Same code as in frontend/src/components/AprBreakdown.tsx
              const rewards =
                poolsData.rewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? [];
              const filteredRewards = getFilteredRewards(rewards);

              const stakingYieldAprPercent: BigNumber | undefined =
                pool.tvlUsd.gt(0)
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
                            ).times(
                              pool.prices[index].times(pool.balances[index]),
                            ),
                          ),
                        new BigNumber(0),
                      )
                      .div(pool.tvlUsd)
                  : new BigNumber(0);

              return {
                pool: {
                  ...pool,
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
                },
                balances,
                balanceUsd,
                pnlPercent: undefined, // Fetched separately (BE)
                stakedPercent,
                claimableRewards: Object.fromEntries(
                  Object.entries(userData.poolRewardMap[pool.id] ?? {}).filter(
                    ([coinType, amount]) => !isSteammPoints(coinType),
                  ),
                ),
                totalPoints:
                  userData.poolRewardMap[pool.id]?.[
                    NORMALIZED_STEAMM_POINTS_COINTYPE
                  ] ?? new BigNumber(0),
                pointsPerDay: (
                  poolsData.rewardMap[pool.lpTokenType]?.[Side.DEPOSIT].find(
                    (reward) => isSteammPoints(reward.stats.rewardCoinType),
                  )?.stats.perDay ?? new BigNumber(0)
                )
                  .times(balanceUsd)
                  .times(stakedPercent.div(100)),
              };
            })
            .filter(Boolean) as PoolPosition[]),
    [poolsData, userData, getBalance, poolStats.aprPercent_24h],
  );

  // Points
  const totalPoints: BigNumber | undefined = useMemo(
    () =>
      poolsData === undefined || userData === undefined
        ? undefined
        : poolsData.pools.reduce(
            (acc, pool) =>
              acc.plus(
                userData.poolRewardMap[pool.id]?.[
                  NORMALIZED_STEAMM_POINTS_COINTYPE
                ] ?? new BigNumber(0),
              ),
            new BigNumber(0),
          ),
    [poolsData, userData],
  );

  const pointsPerDay: BigNumber | undefined = useMemo(
    () =>
      poolPositions === undefined
        ? undefined
        : poolPositions.reduce(
            (acc, position) => acc.plus(position.pointsPerDay),
            new BigNumber(0),
          ),
    [poolPositions],
  );

  // Context
  const contextValue: PoolPositionsContext = useMemo(
    () => ({
      poolPositions,

      totalPoints,
      pointsPerDay,
    }),
    [poolPositions, totalPoints, pointsPerDay],
  );

  return (
    <PoolPositionsContext.Provider value={contextValue}>
      {children}
    </PoolPositionsContext.Provider>
  );
}
