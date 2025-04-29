import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as Sentry from "@sentry/nextjs";
import pLimit from "p-limit";

import { showErrorToast, useWalletContext } from "@suilend/frontend-sui-next";

import { fetchHistoricalLpTransactions } from "@/lib/lp";
import { fetchHistoricalSwapTransactions } from "@/lib/swap";
import {
  HistoryDeposit,
  HistorySwap,
  HistoryTransactionType,
  HistoryWithdraw,
} from "@/lib/types";

const usePoolTransactionHistoryMap = (poolIds: string[] | undefined) => {
  const { address } = useWalletContext();

  const [poolTransactionHistoryMapMap, setPoolTransactionHistoryMapMap] =
    useState<
      Record<
        string,
        Record<string, (HistoryDeposit | HistoryWithdraw | HistorySwap)[][]>
      >
    >({});
  const poolTransactionHistoryMap:
    | Record<string, (HistoryDeposit | HistoryWithdraw | HistorySwap)[][]>
    | undefined = useMemo(
    () => (!address ? {} : poolTransactionHistoryMapMap[address]),
    [address, poolTransactionHistoryMapMap],
  );

  const limitRef = useRef<pLimit.Limit>(pLimit(3));
  const fetchPoolTransactionHistoryMap = useCallback(
    async (_poolIds: string[]) => {
      console.log("fetchPoolTransactionHistoryMap", _poolIds);

      try {
        await Promise.all(
          _poolIds.map((poolId) =>
            limitRef.current(async () => {
              const [lpTransactionHistory, swapTransactionHistory] =
                await Promise.all([
                  fetchHistoricalLpTransactions(
                    address!, // Checked in useEffect below
                    poolId,
                  ),
                  fetchHistoricalSwapTransactions(
                    address!, // Checked in useEffect below
                    poolId,
                  ),
                ]);

              const transactionHistory = [
                ...lpTransactionHistory,
                ...swapTransactionHistory,
              ]
                .slice()
                .sort(
                  (a, b) =>
                    a.timestamp === b.timestamp
                      ? a.eventIndex - b.eventIndex // Sort by eventIndex (asc) if timestamps are the same
                      : b.timestamp - a.timestamp, // Sort by timestamp (desc)
                )
                .reverse(); // Oldest first

              // Split transaction history into separate positions
              let positions: (
                | HistoryDeposit
                | HistoryWithdraw
                | HistorySwap
              )[][] = [];
              let currentPositionLpTokens = 0;

              for (let i = 0; i < transactionHistory.length; i++) {
                const transaction = transactionHistory[i];

                if (transaction.type === HistoryTransactionType.DEPOSIT) {
                  if (currentPositionLpTokens === 0)
                    positions.push([transaction]);
                  else positions[positions.length - 1].push(transaction);

                  currentPositionLpTokens += +transaction.mint_lp;
                } else if (
                  transaction.type === HistoryTransactionType.WITHDRAW
                ) {
                  positions[positions.length - 1].push(transaction);

                  currentPositionLpTokens -= +transaction.burn_lp;
                } else {
                  if (positions.length === 0) positions.push([transaction]);
                  else positions[positions.length - 1].push(transaction);
                }
              }

              positions = positions
                .map((position) =>
                  position.slice().sort(
                    (a, b) =>
                      a.timestamp === b.timestamp
                        ? a.eventIndex - b.eventIndex // Sort by eventIndex (asc) if timestamps are the same
                        : b.timestamp - a.timestamp, // Sort by timestamp (desc)
                  ),
                )
                .slice()
                .reverse(); // Newest first

              setPoolTransactionHistoryMapMap((prev) => ({
                ...prev,
                [address!]: {
                  ...prev[address!],
                  [poolId]: positions,
                },
              }));
            }),
          ),
        );
      } catch (err) {
        showErrorToast(
          "Failed to fetch pool transaction history map",
          err as Error,
        );
        console.error(err);
        Sentry.captureException(err);
      }
    },
    [address],
  );

  const hasFetchedPoolTransactionHistoryMapMapRef = useRef<
    Record<string, Record<string, boolean>>
  >({});
  useEffect(() => {
    if (!address) return;
    if (poolIds === undefined) return;

    const filteredPoolIds = poolIds.filter(
      (poolId) =>
        !(
          hasFetchedPoolTransactionHistoryMapMapRef.current[address] !==
            undefined &&
          hasFetchedPoolTransactionHistoryMapMapRef.current[address][poolId]
        ),
    );
    if (filteredPoolIds.length === 0) return;

    hasFetchedPoolTransactionHistoryMapMapRef.current[address] =
      hasFetchedPoolTransactionHistoryMapMapRef.current[address] ?? {};
    for (const poolId of filteredPoolIds)
      hasFetchedPoolTransactionHistoryMapMapRef.current[address][poolId] = true;

    fetchPoolTransactionHistoryMap(filteredPoolIds);
  }, [address, poolIds, fetchPoolTransactionHistoryMap]);

  return { poolTransactionHistoryMap, fetchPoolTransactionHistoryMap };
};

export default usePoolTransactionHistoryMap;
