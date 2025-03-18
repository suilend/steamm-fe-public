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

import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { useLoadedUserContext } from "@/contexts/UserContext";
import { getTotalAprPercent } from "@/lib/liquidityMining";
import {
  getIndexOfObligationWithDeposit,
  getObligationDepositedAmount,
} from "@/lib/obligation";
import { PoolPosition } from "@/lib/types";

interface PoolPositionsContext {
  poolPositions: PoolPosition[];
}

const PoolPositionsContext = createContext<PoolPositionsContext>({
  poolPositions: [],
});

export const usePoolPositionsContext = () => useContext(PoolPositionsContext);

export function PoolPositionsContextProvider({ children }: PropsWithChildren) {
  const { appData, lstData } = useLoadedAppContext();
  const { getBalance, userData } = useLoadedUserContext();
  const { poolStats } = useStatsContext();

  // Pool positions
  const poolPositions: PoolPosition[] = useMemo(
    () =>
      appData.pools
        .map((pool) => {
          const obligationIndex = getIndexOfObligationWithDeposit(
            userData.obligations,
            pool.lpTokenType,
          ); // Assumes up to one obligation has deposits of the LP token type

          const lpTokenBalance = getBalance(pool.lpTokenType);
          const lpTokenDepositedAmount = getObligationDepositedAmount(
            userData.obligations[obligationIndex],
            pool.lpTokenType,
          );
          const lpTokenTotalAmount = lpTokenBalance.plus(
            lpTokenDepositedAmount,
          );
          if (lpTokenTotalAmount.eq(0)) return undefined;

          const balances = [0, 1].map((index) =>
            lpTokenTotalAmount.div(pool.lpSupply).times(pool.balances[index]),
          );
          const balanceUsd = new BigNumber(
            balances[0].times(pool.prices[0]),
          ).plus(balances[1].times(pool.prices[1]));

          // Same code as in frontend/src/components/AprBreakdown.tsx
          const rewards =
            userData.rewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? [];
          const filteredRewards = getFilteredRewards(rewards);

          const stakingYieldAprPercent: BigNumber | undefined =
            lstData !== undefined
              ? pool.tvlUsd.gt(0)
                ? pool.coinTypes
                    .reduce(
                      (acc, coinType, index) =>
                        acc.plus(
                          new BigNumber(
                            getStakingYieldAprPercent(
                              Side.DEPOSIT,
                              coinType,
                              lstData.aprPercentMap,
                            ) ?? 0,
                          ).times(
                            pool.prices[index].times(pool.balances[index]),
                          ),
                        ),
                      new BigNumber(0),
                    )
                    .div(pool.tvlUsd)
                : new BigNumber(0)
              : undefined;

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

          return {
            pool: {
              ...pool,
              aprPercent_24h: totalAprPercent,
            },
            balances,
            balanceUsd,
            pnlPercent: undefined, // Fetched separately (BE)
            stakedPercent: lpTokenDepositedAmount
              .div(lpTokenTotalAmount)
              .times(100),
            claimableRewards: Object.fromEntries(
              Object.entries(userData.poolRewardMap[pool.id] ?? {}).filter(
                ([coinType, amount]) => !isSteammPoints(coinType),
              ),
            ),
            points:
              userData.poolRewardMap[pool.id]?.[
                NORMALIZED_STEAMM_POINTS_COINTYPE
              ] ?? new BigNumber(0),
          };
        })
        .filter(Boolean) as PoolPosition[],
    [
      appData.pools,
      getBalance,
      userData.obligations,
      userData.rewardMap,
      lstData,
      poolStats.aprPercent_24h,
      userData.poolRewardMap,
    ],
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
