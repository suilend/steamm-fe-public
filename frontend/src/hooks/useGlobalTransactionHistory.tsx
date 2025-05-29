import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as Sentry from "@sentry/nextjs";

import { showErrorToast, useWalletContext } from "@suilend/sui-fe-next";

import { fetchHistoricalLpTransactions } from "@/lib/lp";
import { fetchHistoricalSwapTransactions } from "@/lib/swap";
import { HistoryDeposit, HistorySwap, HistoryWithdraw } from "@/lib/types";

const useGlobalTransactionHistory = () => {
  const { address } = useWalletContext();

  const [globalTransactionHistoryMap, setGlobalTransactionHistoryMap] =
    useState<
      Record<string, (HistoryDeposit | HistoryWithdraw | HistorySwap)[]>
    >({});
  const globalTransactionHistory:
    | (HistoryDeposit | HistoryWithdraw | HistorySwap)[]
    | undefined = useMemo(
    () => (!address ? [] : globalTransactionHistoryMap[address]),
    [address, globalTransactionHistoryMap],
  );

  const fetchGlobalTransactionHistory = useCallback(async () => {
    console.log("fetchGlobalTransactionHistory");

    try {
      const [lpTransactionHistory, swapTransactionHistory] = await Promise.all([
        fetchHistoricalLpTransactions(
          address!, // Checked in useEffect below
        ),
        fetchHistoricalSwapTransactions(
          address!, // Checked in useEffect below
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
        );

      setGlobalTransactionHistoryMap((prev) => ({
        ...prev,
        [address!]: transactionHistory,
      }));
    } catch (err) {
      showErrorToast(
        "Failed to fetch global transaction history",
        err as Error,
      );
      console.error(err);
      Sentry.captureException(err);
    }
  }, [address]);

  const hasFetchedGlobalTransactionHistoryMapRef = useRef<
    Record<string, boolean>
  >({});
  useEffect(() => {
    if (!address) return;

    if (hasFetchedGlobalTransactionHistoryMapRef.current[address]) return;
    hasFetchedGlobalTransactionHistoryMapRef.current[address] = true;

    fetchGlobalTransactionHistory();
  }, [address, fetchGlobalTransactionHistory]);

  return { globalTransactionHistory, fetchGlobalTransactionHistory };
};

export default useGlobalTransactionHistory;
