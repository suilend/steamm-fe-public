import BigNumber from "bignumber.js";
import useSWR from "swr";

import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import {
  Side,
  formatRewards,
  getDepositShare,
  initializeObligations,
} from "@suilend/sdk";

import { useAppContext } from "@/contexts/AppContext";
import { UserData } from "@/contexts/UserContext";

export default function useFetchUserData() {
  const { suiClient } = useSettingsContext();
  const { address } = useWalletContext();
  const { appData } = useAppContext();

  // Data
  const dataFetcher = async () => {
    if (!appData) return undefined as unknown as UserData; // In practice `dataFetcher` won't be called if `appData` is falsy

    const { obligationOwnerCaps: _obligationOwnerCaps, obligations } =
      await initializeObligations(
        suiClient,
        appData.lm.suilendClient,
        appData.lm.refreshedRawReserves,
        appData.lm.reserveMap,
        address,
      );
    const obligationOwnerCaps = _obligationOwnerCaps
      .slice()
      .sort(
        (a, b) =>
          obligations.findIndex((o) => o.id === a.obligationId) -
          obligations.findIndex((o) => o.id === b.obligationId),
      ); // Same order as `obligations`

    const rewardMap = formatRewards(
      appData.lm.reserveMap,
      appData.lm.rewardCoinMetadataMap,
      appData.lm.rewardPriceMap,
      obligations,
    );
    for (const coinType of Object.keys(rewardMap)) {
      const pool = appData.pools.find(
        (_pool) => _pool.lpTokenType === coinType,
      );
      if (!pool) continue; // Skip rewards for reserves that don't have a pool

      const reserve = appData.lm.reserveMap[coinType];
      const rewards = rewardMap[coinType][Side.DEPOSIT];
      for (const reward of rewards) {
        if (reward.stats.aprPercent !== undefined) {
          // Undo division in @suilend/sdk/src/lib/liquidityMining.ts:formatRewards
          reward.stats.aprPercent = reward.stats.aprPercent.times(
            getDepositShare(
              reserve,
              new BigNumber(
                reserve.depositsPoolRewardManager.totalShares.toString(),
              ),
            ).times(reserve.price),
          );

          // Divide by pool TVL
          if (pool.tvlUsd.gt(0))
            reward.stats.aprPercent = reward.stats.aprPercent.div(pool.tvlUsd);
        } else if (reward.stats.perDay !== undefined) {
          // Undo division in @suilend/sdk/src/lib/liquidityMining.ts:formatRewards
          reward.stats.perDay = reward.stats.perDay.times(
            getDepositShare(
              reserve,
              new BigNumber(
                reserve.depositsPoolRewardManager.totalShares.toString(),
              ),
            ),
          ); // Will be NaN if totalShares is 0

          // Divide by pool TVL
          if (pool.tvlUsd.gt(0))
            reward.stats.perDay = reward.stats.perDay.div(pool.tvlUsd);
        }
      }
    }

    return { obligationOwnerCaps, obligations, rewardMap };
  };

  const { data, mutate } = useSWR<UserData>(
    !appData ? null : `userData-${address}`,
    dataFetcher,
    {
      refreshInterval: 30 * 1000,
      onSuccess: (data) => {
        console.log("Refreshed obligations data", data);
      },
      onError: (err) => {
        showErrorToast("Failed to refresh obligations data", err);
        console.error(err);
      },
    },
  );

  return { data, mutateData: mutate };
}
