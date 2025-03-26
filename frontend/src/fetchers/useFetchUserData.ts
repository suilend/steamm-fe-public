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
  const { appData, poolsData } = useAppContext();

  // Data
  const dataFetcher = async () => {
    if (!appData || !poolsData) return undefined as unknown as UserData; // In practice `dataFetcher` won't be called if `appData` is falsy

    const { obligationOwnerCaps: _obligationOwnerCaps, obligations } =
      await initializeObligations(
        suiClient,
        appData.lmMarket.suilendClient,
        appData.lmMarket.refreshedRawReserves,
        appData.lmMarket.reserveMap,
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
      appData.lmMarket.reserveMap,
      appData.lmMarket.rewardCoinMetadataMap,
      appData.lmMarket.rewardPriceMap,
      obligations,
    );
    for (const coinType of Object.keys(rewardMap)) {
      const pool = poolsData.pools.find(
        (_pool) => _pool.lpTokenType === coinType,
      );
      if (!pool) continue; // Skip rewards for reserves that don't have a pool

      const reserve = appData.lmMarket.reserveMap[coinType];
      const rewards = rewardMap[coinType][Side.DEPOSIT];
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
          if (pool.tvlUsd.gt(0))
            r.stats.perDay = r.stats.perDay.div(pool.tvlUsd);
        }
      }
    }

    // Pool rewards
    const poolRewardMap = poolsData.pools.reduce(
      (acc, pool) => ({
        ...acc,
        [pool.id]: (rewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? []).reduce(
          (acc2, r) => {
            for (let i = 0; i < obligations.length; i++) {
              const obligation = obligations[i];

              const minAmount = 10 ** (-1 * r.stats.mintDecimals);
              if (
                !r.obligationClaims[obligation.id] ||
                r.obligationClaims[obligation.id].claimableAmount.lt(minAmount) // This also covers the 0 case
              )
                continue;

              acc2[r.stats.rewardCoinType] = new BigNumber(
                acc2[r.stats.rewardCoinType] ?? 0,
              ).plus(r.obligationClaims[obligation.id].claimableAmount);
            }

            return acc2;
          },
          {} as Record<string, BigNumber>,
        ),
      }),
      {} as Record<string, Record<string, BigNumber>>,
    );

    return {
      obligationOwnerCaps,
      obligations,

      rewardMap,
      poolRewardMap,
    };
  };

  const { data, mutate } = useSWR<UserData>(
    !appData || !poolsData ? null : `userData-${address}`,
    dataFetcher,
    {
      refreshInterval: 30 * 1000,
      onSuccess: (data) => {
        console.log("Refreshed user data", data);
      },
      onError: (err) => {
        showErrorToast("Failed to refresh user data", err);
        console.error(err);
      },
    },
  );

  return { data, mutateData: mutate };
}
