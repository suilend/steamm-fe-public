import BigNumber from "bignumber.js";

import { BankInfo, PoolInfo } from "@suilend/steamm-sdk";
import { Bank } from "@suilend/steamm-sdk/_codegen/_generated/steamm/bank/structs";
import { CpQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/cpmm/structs";
import { OracleQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm/structs";
import { Pool } from "@suilend/steamm-sdk/_codegen/_generated/steamm/pool/structs";

export type ParsedBank = {
  id: string;
  bank: Bank<string, string, string>;
  bankInfo: BankInfo;
  coinType: string;
  bTokenType: string;

  liquidAmount: BigNumber;
  depositedAmount: BigNumber;
  totalAmount: BigNumber;

  utilizationPercent: BigNumber;
  suilendDepositAprPercent: BigNumber;
};

export enum QuoterId {
  CPMM = "cpmm",
  ORACLE = "oracle",
  STABLE = "stable",
}
export type Quoter = {
  id: QuoterId;
  name: string;
};
export const QUOTERS: Quoter[] = [
  {
    id: QuoterId.CPMM,
    name: "CPMM",
  },
  {
    id: QuoterId.ORACLE,
    name: "Oracle",
  },
  {
    id: QuoterId.STABLE,
    name: "Stable",
  },
];

export type ParsedPool = {
  id: string;
  pool:
    | Pool<string, string, CpQuoter, string>
    | Pool<string, string, OracleQuoter, string>;
  poolInfo: PoolInfo;
  quoter: Quoter;

  lpTokenType: string;
  bTokenTypes: [string, string];
  coinTypes: [string, string];
  balances: [BigNumber, BigNumber];
  prices: [BigNumber, BigNumber];

  lpSupply: BigNumber;
  tvlUsd: BigNumber;

  feeTierPercent: BigNumber;
  protocolFeePercent: BigNumber;

  suilendWeightedAverageDepositAprPercent: BigNumber;

  //
  volumeUsd_24h?: BigNumber; // Used on Pools page
  aprPercent_24h?: BigNumber; // Used on Pools and Portfolio pages
};

export type PoolGroup = {
  id: string;
  coinTypes: [string, string];
  pools: ParsedPool[];
};

export type PoolPosition = {
  pool: ParsedPool;
  balances: [BigNumber, BigNumber];
  balanceUsd: BigNumber;
  pnlPercent?: BigNumber; // Fetched separately (BE)
  stakedPercent: BigNumber;
  claimableRewards: Record<string, BigNumber>;
  points: BigNumber;
};

export enum HistoryTransactionType {
  DEPOSIT = "DEPOSIT",
  REDEEM = "REDEEM",
}

export type HistoryDeposit = {
  id: number;
  timestamp: string;
  digest: string;
  eventIndex: number;
  user: string;
  pool_id: string;
  deposit_a: string;
  deposit_b: string;
  mint_lp: string;
  balance_a: string;
  balance_b: string;

  // Custom
  type: HistoryTransactionType.DEPOSIT;
};

export type HistoryRedeem = {
  id: number;
  timestamp: string;
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

  // Custom
  type: HistoryTransactionType.REDEEM;
};
