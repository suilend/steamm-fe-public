import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as Sentry from "@sentry/nextjs";
import pLimit, { LimitFunction } from "p-limit";

import { showErrorToast, useWalletContext } from "@suilend/frontend-sui-next";

import { API_URL } from "@/lib/navigation";
import {
  HistoryDeposit,
  HistoryRedeem,
  HistoryTransactionType,
} from "@/lib/types";

const usePoolTransactionHistoryMap = (poolIds: string[] | undefined) => {
  const { address } = useWalletContext();

  const [poolTransactionHistoryMapMap, setPoolTransactionHistoryMapMap] =
    useState<
      Record<string, Record<string, (HistoryDeposit | HistoryRedeem)[]>>
    >({});
  const poolTransactionHistoryMap:
    | Record<string, (HistoryDeposit | HistoryRedeem)[]>
    | undefined = useMemo(
    () => (!address ? {} : poolTransactionHistoryMapMap[address]),
    [address, poolTransactionHistoryMapMap],
  );

  const limitRef = useRef<LimitFunction>(pLimit(3));
  const fetchPoolTransactionHistoryMap = useCallback(
    async (_poolIds: string[]) => {
      console.log("fetchPoolTransactionHistoryMap", _poolIds);

      try {
        await Promise.all(
          _poolIds.map((poolId) =>
            limitRef.current(async () => {
              const res = await fetch(
                `${API_URL}/steamm/historical/lp?${new URLSearchParams({
                  user: address!, // Checked in useEffect below
                  poolId,
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

              setPoolTransactionHistoryMapMap((prev) => ({
                ...prev,
                [address!]: {
                  ...prev[address!],
                  [poolId]: transactionHistory,
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
