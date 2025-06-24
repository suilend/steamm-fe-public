import { PropsWithChildren, createContext, useContext, useMemo } from "react";

import BigNumber from "bignumber.js";

import {
  Side,
  getFilteredRewards,
  getStakingYieldAprPercent,
} from "@suilend/sdk";
import { isSteammPoints } from "@suilend/sui-fe";

import { useAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { useUserContext } from "@/contexts/UserContext";
import { ChartPeriod } from "@/lib/chart";
import { getPoolTotalAprPercent } from "@/lib/liquidityMining";
import {
  getIndexesOfObligationsWithDeposit,
  getObligationDepositedAmount,
} from "@/lib/obligation";
import { PoolPosition } from "@/lib/types";

interface PoolPositionsContext {
  poolPositions: PoolPosition[] | undefined;
}

const PoolPositionsContext = createContext<PoolPositionsContext>({
  poolPositions: undefined,
});

export const usePoolPositionsContext = () => useContext(PoolPositionsContext);

export function PoolPositionsContextProvider({ children }: PropsWithChildren) {
  const { appData } = useAppContext();
  const { getBalance, userData } = useUserContext();
  const { poolStats } = useStatsContext();

  // Pool positions
  const poolPositions: PoolPosition[] | undefined = useMemo(
    () =>
      appData === undefined || userData === undefined
        ? undefined
        : (appData.pools
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
                appData.normalizedPoolRewardMap[pool.lpTokenType]?.[
                  Side.DEPOSIT
                ] ?? [];
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
                                appData.lstAprPercentMap,
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
                    poolStats.aprPercent[ChartPeriod.ONE_DAY][pool.id] !==
                      undefined && stakingYieldAprPercent !== undefined
                      ? getPoolTotalAprPercent(
                          poolStats.aprPercent[ChartPeriod.ONE_DAY][pool.id]
                            .feesAprPercent,
                          pool.suilendWeightedAverageDepositAprPercent,
                          filteredRewards,
                          stakingYieldAprPercent,
                        )
                      : undefined,
                },
                balances,
                balanceUsd,
                pnlPercent: undefined, // Fetched separately (BE)
                pnlUsd: undefined, // Fetched separately (BE)
                stakedPercent,
                claimableRewards: Object.fromEntries(
                  Object.entries(userData.poolRewardMap[pool.id] ?? {}).filter(
                    ([coinType, amount]) => !isSteammPoints(coinType),
                  ),
                ),
              };
            })
            .filter(Boolean) as PoolPosition[]),
    [appData, userData, getBalance, poolStats.aprPercent],
  );

  // Context
  const contextValue: PoolPositionsContext = useMemo(
    () => ({
      poolPositions,
    }),
    [poolPositions],
  );

  return (
    <PoolPositionsContext.Provider value={contextValue}>
      {children}
    </PoolPositionsContext.Provider>
  );
}
