import BigNumber from "bignumber.js";

import { RewardSummary, Side, getRewardsAprPercent } from "@suilend/sdk";

export const getTotalAprPercent = (
  feesAprPercent: BigNumber,
  suilendWeightedAverageDepositAprPercent: BigNumber,
  filteredRewards: RewardSummary[],
  stakingYieldAprPercent?: BigNumber,
) =>
  feesAprPercent
    .plus(suilendWeightedAverageDepositAprPercent)
    .plus(getRewardsAprPercent(Side.DEPOSIT, filteredRewards))
    .plus(stakingYieldAprPercent ?? 0);
