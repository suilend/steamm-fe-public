import BigNumber from "bignumber.js";

import { BankInfo, PoolInfo } from "@suilend/steamm-sdk";
import { Bank } from "@suilend/steamm-sdk/_codegen/_generated/steamm/bank/structs";
import { CpQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/cpmm/structs";
import { OracleQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm/structs";
import { OracleQuoterV2 } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm_v2/structs";
import { Pool } from "@suilend/steamm-sdk/_codegen/_generated/steamm/pool/structs";

export enum TokenDirection {
  IN = "in",
  OUT = "out",
}

export type ParsedBank = {
  id: string;
  bank: Bank<string, string, string>;
  bankInfo: BankInfo;
  coinType: string;
  bTokenType: string;

  fundsAvailable: BigNumber;
  fundsDeployed: BigNumber;
  totalFunds: BigNumber;

  bTokenSupply: BigNumber;
  bTokenExchangeRate: BigNumber;

  utilizationPercent: BigNumber;
  suilendDepositAprPercent: BigNumber;
};

export enum QuoterId {
  CPMM = "cpmm",
  ORACLE = "oracle",
  ORACLE_V2 = "oracle_v2",
}
export const QUOTER_ID_NAME_MAP: Record<QuoterId, string> = {
  [QuoterId.CPMM]: "CPMM",
  [QuoterId.ORACLE]: "Oracle",
  [QuoterId.ORACLE_V2]: "Oracle V2",
};

export type ParsedPool = {
  id: string;
  pool:
    | Pool<string, string, CpQuoter, string>
    | Pool<string, string, OracleQuoter, string>
    | Pool<string, string, OracleQuoterV2, string>;
  poolInfo: PoolInfo;
  quoterId: QuoterId;

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
  totalPoints: BigNumber;
  pointsPerDay: BigNumber;
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
