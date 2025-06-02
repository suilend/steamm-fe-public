import BigNumber from "bignumber.js";

import { ParsedPool } from "@suilend/steamm-sdk";

export enum TokenDirection {
  IN = "in",
  OUT = "out",
}

export type PoolGroup = {
  id: string;
  coinTypes: [string, string];
  pools: ParsedPool[];
};

export type PoolPosition = {
  pool: ParsedPool;
  balances: [BigNumber, BigNumber];
  balanceUsd: BigNumber;
  pnlPercent?: BigNumber | null; // Fetched separately (BE)
  pnlUsd?: BigNumber; // Fetched separately (BE)
  stakedPercent: BigNumber;
  claimableRewards: Record<string, BigNumber>;
};

export enum HistoryTransactionType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
  SWAP = "swap",
}

export type HistoryDeposit = {
  id: number;
  timestamp: number;
  digest: string;
  eventIndex: number;
  user: string;
  pool_id: string;
  deposit_a: string;
  deposit_b: string;
  mint_lp: string;
  balance_a: string;
  balance_b: string;
  coin_a_exchange_rate: number;
  coin_b_exchange_rate: number;
  coin_a_price: number;
  coin_b_price: number;

  // Custom
  type: HistoryTransactionType.DEPOSIT;
};

export type HistoryWithdraw = {
  id: number;
  timestamp: number;
  digest: string;
  eventIndex: number;
  user: string;
  pool_id: string;
  withdraw_a: string;
  withdraw_b: string;
  fees_a: string;
  fees_b: string;
  burn_lp: string;
  balance_a: string;
  balance_b: string;
  coin_a_exchange_rate: number;
  coin_b_exchange_rate: number;
  coin_a_price: number;
  coin_b_price: number;

  // Custom
  type: HistoryTransactionType.WITHDRAW;
};

export type HistorySwap = {
  id: number;
  timestamp: number;
  digest: string;
  eventIndex: number;
  user: string;
  pool_id: string;
  amount_in: string;
  amount_out: string;
  a_to_b: boolean;
  protocol_fees: string;
  pool_fees: string;
  balance_a: string;
  balance_b: string;

  // Custom
  type: HistoryTransactionType.SWAP;
};
