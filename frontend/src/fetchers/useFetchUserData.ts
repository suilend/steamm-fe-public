import BigNumber from "bignumber.js";
import useSWR, { useSWRConfig } from "swr";

import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import { Side, formatRewards, initializeObligations } from "@suilend/sdk";

import { useAppContext } from "@/contexts/AppContext";
import { UserData } from "@/contexts/UserContext";
import { normalizeRewards } from "@/lib/liquidityMining";

export default function useFetchUserData() {
  const { suiClient } = useSettingsContext();
  const { address } = useWalletContext();
  const { appData } = useAppContext();

  const { cache } = useSWRConfig();

  // Data
  const dataFetcher = async () => {
    if (!appData) return undefined as unknown as UserData; // In practice `dataFetcher` won't be called if `appData` is falsy

    const { obligationOwnerCaps: _obligationOwnerCaps, obligations } =
      await initializeObligations(
        suiClient,
        appData.suilend.lmMarket.suilendClient,
        appData.suilend.lmMarket.refreshedRawReserves,
        appData.suilend.lmMarket.reserveMap,
        address,
      );
    const obligationOwnerCaps = _obligationOwnerCaps
      .slice()
      .sort(
        (a, b) =>
          obligations.findIndex((o) => o.id === a.obligationId) -
          obligations.findIndex((o) => o.id === b.obligationId),
      ); // Same order as `obligations`

    const rewardMap = normalizeRewards(
      formatRewards(
        appData.suilend.lmMarket.reserveMap,
        appData.suilend.lmMarket.rewardCoinMetadataMap,
        appData.suilend.lmMarket.rewardPriceMap,
        obligations,
      ),
      appData.suilend.lmMarket.reserveMap,
      appData.pools,
    );

    // Pool rewards
    const poolRewardMap = appData.pools.reduce(
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
    !appData ? null : `userData-${address}`,
    dataFetcher,
    {
      refreshInterval: 30 * 1000,
      onSuccess: (data) => {
        console.log("Refreshed user data", data);
      },
      onError: (err, key) => {
        const isInitialLoad = cache.get(key)?.data === undefined;
        if (isInitialLoad) showErrorToast("Failed to fetch user data", err);

        console.error(err);
      },
    },
  );

  return { data, mutateData: mutate };
}
