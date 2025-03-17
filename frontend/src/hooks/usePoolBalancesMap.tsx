import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as Sentry from "@sentry/nextjs";
import BigNumber from "bignumber.js";
import pLimit from "p-limit";

import { showErrorToast, useWalletContext } from "@suilend/frontend-sui-next";

import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedUserContext } from "@/contexts/UserContext";
import {
  getIndexOfObligationWithDeposit,
  getObligationDepositedAmount,
} from "@/lib/obligation";
import { ParsedPool } from "@/lib/types";

const usePoolBalancesMap = (poolIds: string[] | undefined) => {
  const { address } = useWalletContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { userData, getBalance } = useLoadedUserContext();

  const pools = useMemo(
    () =>
      poolIds === undefined
        ? undefined
        : appData.pools.filter((pool) => poolIds.includes(pool.id)),
    [appData.pools, poolIds],
  );

  const [poolBalancesMapMap, setPoolBalancesMap] = useState<
    Record<
      string,
      Record<string, { a: BigNumber; b: BigNumber; usd: BigNumber }>
    >
  >({});
  const poolBalancesMap = useMemo(
    () => (!address ? {} : poolBalancesMapMap[address]),
    [address, poolBalancesMapMap],
  );

  const fetchPoolBalancesMap = useCallback(
    async (_pools: ParsedPool[]) => {
      console.log("fetchPoolBalancesMap", _pools);

      try {
        const limit = pLimit(3);
        await Promise.all(
          _pools.map((pool) =>
            limit(async () => {
              const obligationIndex = getIndexOfObligationWithDeposit(
                userData.obligations,
                pool.lpTokenType,
              ); // Assumes up to one obligation has deposits of the LP token type

              const balance = getBalance(pool.lpTokenType);
              const depositedAmount = getObligationDepositedAmount(
                userData.obligations[obligationIndex],
                pool.lpTokenType,
              );
              const totalAmount = balance.plus(depositedAmount);

              const redeemQuote = await steammClient.Pool.quoteRedeem({
                lpTokens: BigInt(
                  totalAmount
                    .times(
                      10 ** appData.coinMetadataMap[pool.lpTokenType].decimals,
                    )
                    .integerValue(BigNumber.ROUND_DOWN)
                    .toString(),
                ),
                poolInfo: pool.poolInfo,
                bankInfoA: appData.bankMap[pool.coinTypes[0]].bankInfo,
                bankInfoB: appData.bankMap[pool.coinTypes[1]].bankInfo,
              });

              const balanceA = new BigNumber(
                redeemQuote.withdrawA.toString(),
              ).div(10 ** appData.coinMetadataMap[pool.coinTypes[0]].decimals);
              const balanceB = new BigNumber(
                redeemQuote.withdrawB.toString(),
              ).div(10 ** appData.coinMetadataMap[pool.coinTypes[1]].decimals);

              const result = {
                a: balanceA,
                b: balanceB,
                usd: new BigNumber(balanceA.times(pool.prices[0])).plus(
                  balanceB.times(pool.prices[1]),
                ),
              };

              setPoolBalancesMap((prev) => ({
                ...prev,
                [address!]: {
                  ...prev[address!],
                  [pool.id]: result,
                },
              }));
            }),
          ),
        );
      } catch (err) {
        showErrorToast("Failed to fetch pool balances", err as Error);
        console.error(err);
        Sentry.captureException(err);
      }
    },
    [
      getBalance,
      userData.obligations,
      steammClient,
      appData.coinMetadataMap,
      appData.bankMap,
      address,
    ],
  );

  const hasFetchedPoolBalancesMapMapRef = useRef<
    Record<string, Record<string, boolean>>
  >({});
  useEffect(() => {
    if (!address) return;
    if (pools === undefined) return;

    const filteredPools = pools.filter(
      (pool) =>
        !(
          hasFetchedPoolBalancesMapMapRef.current[address] !== undefined &&
          hasFetchedPoolBalancesMapMapRef.current[address][pool.id]
        ),
    );
    if (filteredPools.length === 0) return;

    hasFetchedPoolBalancesMapMapRef.current[address] =
      hasFetchedPoolBalancesMapMapRef.current[address] ?? {};
    for (const pool of filteredPools)
      hasFetchedPoolBalancesMapMapRef.current[address][pool.id] = true;

    fetchPoolBalancesMap(filteredPools);
  }, [address, pools, fetchPoolBalancesMap]);

  return poolBalancesMap;
};

export default usePoolBalancesMap;
