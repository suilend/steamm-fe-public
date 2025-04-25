import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as Sentry from "@sentry/nextjs";

import { showErrorToast, useWalletContext } from "@suilend/frontend-sui-next";

import { API_URL } from "@/lib/navigation";
import {
  HistoryDeposit,
  HistoryRedeem,
  HistoryTransactionType,
} from "@/lib/types";

const useGlobalTransactionHistory = () => {
  const { address } = useWalletContext();

  const [globalTransactionHistoryMap, setGlobalTransactionHistoryMap] =
    useState<Record<string, (HistoryDeposit | HistoryRedeem)[]>>({});
  const globalTransactionHistory:
    | (HistoryDeposit | HistoryRedeem)[]
    | undefined = useMemo(
    () => (!address ? [] : globalTransactionHistoryMap[address]),
    [address, globalTransactionHistoryMap],
  );

  const fetchGlobalTransactionHistory = useCallback(async () => {
    console.log("fetchGlobalTransactionHistory");

    try {
      const res = await fetch(
        `${API_URL}/steamm/historical/lp?${new URLSearchParams({
          user: address!, // Checked in useEffect below
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
      ].sort((a, b) => +b.timestamp - +a.timestamp); // Sort by timestamp (desc)

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
