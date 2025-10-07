import BigNumber from "bignumber.js";
import { cloneDeep } from "lodash";

import {
  RewardMap,
  RewardSummary,
  Side,
  getDepositShare,
  getRewardsAprPercent,
  getStakingYieldAprPercent,
} from "@suilend/sdk";
import { ParsedPool } from "@suilend/steamm-sdk";

import { AppData } from "@/contexts/AppContext";

export const getPoolStakingYieldAprPercent = (
  pool: ParsedPool,
  lstAprPercentMap: AppData["lstAprPercentMap"],
) =>
  pool.tvlUsd.gt(0)
    ? pool.coinTypes
        .reduce(
          (acc, coinType, index) =>
            acc.plus(
              new BigNumber(
                getStakingYieldAprPercent(
                  Side.DEPOSIT,
                  coinType,
                  Object.fromEntries(
                    Object.entries(lstAprPercentMap).map(
                      ([coinType, aprPercent]) => [coinType, { aprPercent }],
                    ),
                  ),
                ) ?? 0,
              ).times(pool.prices[index].times(pool.balances[index])),
            ),
          new BigNumber(0),
        )
        .div(pool.tvlUsd)
    : new BigNumber(0);

export const getPoolTotalAprPercent = (
  feesAprPercent: BigNumber,
  suilendWeightedAverageDepositAprPercent: BigNumber,
  filteredRewards: RewardSummary[],
  stakingYieldAprPercent?: BigNumber,
) =>
  feesAprPercent
    .plus(suilendWeightedAverageDepositAprPercent)
    .plus(getRewardsAprPercent(Side.DEPOSIT, filteredRewards))
    .plus(stakingYieldAprPercent ?? 0);

export const normalizeRewards = (
  rewardMap: RewardMap,
  lmMarket_reserveMap: AppData["suilend"]["lmMarket"]["reserveMap"],
  pools: AppData["pools"],
) => {
  const clonedRewardMap = cloneDeep(rewardMap);

  for (const coinType of Object.keys(clonedRewardMap)) {
    const pool = pools.find((_pool) => _pool.lpTokenType === coinType);
    if (!pool) continue; // Skip rewards for reserves that don't have a pool (should not happen)

    const reserve = lmMarket_reserveMap[coinType];
    const rewards = clonedRewardMap[coinType][Side.DEPOSIT];
    for (const r of rewards) {
      if (r.stats.aprPercent !== undefined) {
        // Undo division in @suilend/sdk/src/lib/liquidityMining.ts:formatRewards
        r.stats.aprPercent = r.stats.aprPercent.times(
          getDepositShare(
            reserve,
            new BigNumber(
              reserve.depositsPoolRewardManager.totalShares.toString(),
            ),
          ).times(reserve.price),
        );

        // Divide by pool TVL
        if (pool.tvlUsd.gt(0))
          r.stats.aprPercent = r.stats.aprPercent.div(pool.tvlUsd);
      } else if (r.stats.perDay !== undefined) {
        // Undo division in @suilend/sdk/src/lib/liquidityMining.ts:formatRewards
        r.stats.perDay = r.stats.perDay.times(
          getDepositShare(
            reserve,
            new BigNumber(
              reserve.depositsPoolRewardManager.totalShares.toString(),
            ),
          ),
        ); // Will be NaN if totalShares is 0

        // Divide by pool TVL
        if (pool.tvlUsd.gt(0)) r.stats.perDay = r.stats.perDay.div(pool.tvlUsd);
      }
    }
  }

  return clonedRewardMap;
};
