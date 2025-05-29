import { API_URL } from "@suilend/sui-fe";

import {
  HistoryDeposit,
  HistoryTransactionType,
  HistoryWithdraw,
} from "@/lib/types";

export const fetchHistoricalLpTransactions = async (
  address: string,
  poolId?: string,
) => {
  const urlSearchParams: Record<string, string> = { user: address };
  if (poolId) urlSearchParams.poolId = poolId;

  const res = await fetch(
    `${API_URL}/steamm/historical/lp?${new URLSearchParams(urlSearchParams)}`,
  );
  const json: {
    deposits: Omit<HistoryDeposit, "type">[];
    redeems: Omit<HistoryWithdraw, "type">[];
  } = await res.json();
  if ((json as any)?.statusCode === 500)
    throw new Error("Failed to fetch historical LP transactions");

  return [
    ...(json.deposits.map((entry) => ({
      ...entry,
      type: HistoryTransactionType.DEPOSIT,
    })) as HistoryDeposit[]),
    ...(json.redeems.map((entry) => ({
      ...entry,
      type: HistoryTransactionType.WITHDRAW,
    })) as HistoryWithdraw[]),
  ];
};
