import BigNumber from "bignumber.js";

export type ParsedBank = {
  id: string;
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
  ORACLE_AMM = "oracle-amm",
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
    id: QuoterId.ORACLE_AMM,
    name: "Oracle AMM",
  },
];

export type ParsedPool = {
  id: string;
  quoter: Quoter;

  lpTokenType: string;
  bTokenTypes: [string, string];
  coinTypes: [string, string];
  balances: [BigNumber, BigNumber];
  prices: [BigNumber, BigNumber];

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
  balanceUsd?: BigNumber;
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
