import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as Sentry from "@sentry/nextjs";
import BigNumber from "bignumber.js";
import pLimit from "p-limit";

import { showErrorToast, useWalletContext } from "@suilend/frontend-sui-next";

import { useLoadedAppContext } from "@/contexts/AppContext";
import { API_URL } from "@/lib/navigation";
import {
  HistoryDeposit,
  HistoryRedeem,
  HistoryTransactionType,
  ParsedPool,
} from "@/lib/types";

const usePoolDepositedUsdMap = (poolIds: string[] | undefined) => {
  const { address } = useWalletContext();
  const { appData } = useLoadedAppContext();

  const pools = useMemo(
    () =>
      poolIds === undefined
        ? undefined
        : appData.pools.filter((pool) => poolIds.includes(pool.id)),
    [appData.pools, poolIds],
  );

  const [poolDepositedUsdMapMap, setPoolDepositedUsdMapMap] = useState<
    Record<string, Record<string, BigNumber>>
  >({});
  const poolDepositedUsdMap = useMemo(
    () => (!address ? {} : poolDepositedUsdMapMap[address]),
    [address, poolDepositedUsdMapMap],
  );

  const fetchPoolDepositedUsdMap = useCallback(
    async (_pools: ParsedPool[]) => {
      console.log("fetchPoolDepositedUsdMap", _pools);

      try {
        const limit = pLimit(3);
        await Promise.all(
          _pools.map((pool) =>
            limit(async () => {
              const res = await fetch(
                `${API_URL}/steamm/historical/lp?${new URLSearchParams({
                  user: address!, // Checked in useEffect below
                  poolId: pool.id,
                })}`,
              );
              const json: {
                deposits: Omit<HistoryDeposit, "type">[];
                redeems: Omit<HistoryRedeem, "type">[];
              } = await res.json();
              if ((json as any)?.statusCode === 500) return;

              const transactionHistory = [
                ...(json.deposits.map((entry) => ({
                  ...entry,
                  type: HistoryTransactionType.DEPOSIT,
                })) as HistoryDeposit[]),
                ...(json.redeems.map((entry) => ({
                  ...entry,
                  type: HistoryTransactionType.REDEEM,
                })) as HistoryRedeem[]),
              ].sort((a, b) => +b.timestamp - +a.timestamp);

              const depositedA = transactionHistory.reduce(
                (acc, entry) =>
                  entry.type === HistoryTransactionType.DEPOSIT
                    ? acc.plus(
                        new BigNumber(entry.deposit_a).div(
                          10 **
                            appData.coinMetadataMap[pool.coinTypes[0]].decimals,
                        ),
                      )
                    : acc.minus(
                        new BigNumber(entry.withdraw_a).div(
                          10 **
                            appData.coinMetadataMap[pool.coinTypes[0]].decimals,
                        ),
                      ),
                new BigNumber(0),
              );
              const depositedB = transactionHistory.reduce(
                (acc, entry) =>
                  entry.type === HistoryTransactionType.DEPOSIT
                    ? acc.plus(
                        new BigNumber(entry.deposit_b).div(
                          10 **
                            appData.coinMetadataMap[pool.coinTypes[1]].decimals,
                        ),
                      )
                    : acc.minus(
                        new BigNumber(entry.withdraw_b).div(
                          10 **
                            appData.coinMetadataMap[pool.coinTypes[1]].decimals,
                        ),
                      ),
                new BigNumber(0),
              );

              const result = new BigNumber(
                depositedA.times(pool.prices[0]),
              ).plus(depositedB.times(pool.prices[1]));

              setPoolDepositedUsdMapMap((prev) => ({
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
        showErrorToast(
          "Failed to fetch pool transaction history",
          err as Error,
        );
        console.error(err);
        Sentry.captureException(err);
      }
    },
    [appData.coinMetadataMap, address],
  );

  const hasFetchedPoolDepositedUsdMapMapRef = useRef<
    Record<string, Record<string, boolean>>
  >({});
  useEffect(() => {
    if (!address) return;
    if (pools === undefined) return;

    const filteredPools = pools.filter(
      (pool) =>
        !(
          hasFetchedPoolDepositedUsdMapMapRef.current[address] !== undefined &&
          hasFetchedPoolDepositedUsdMapMapRef.current[address][pool.id]
        ),
    );
    if (filteredPools.length === 0) return;

    hasFetchedPoolDepositedUsdMapMapRef.current[address] =
      hasFetchedPoolDepositedUsdMapMapRef.current[address] ?? {};
    for (const pool of filteredPools)
      hasFetchedPoolDepositedUsdMapMapRef.current[address][pool.id] = true;

    fetchPoolDepositedUsdMap(filteredPools);
  }, [address, pools, fetchPoolDepositedUsdMap]);

  return poolDepositedUsdMap;
};

export default usePoolDepositedUsdMap;
