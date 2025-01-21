export interface DepositQuote {
  initialDeposit: boolean;
  depositA: bigint;
  depositB: bigint;
  mintLp: bigint;
}

export interface RedeemQuote {
  withdrawA: bigint;
  withdrawB: bigint;
  feesA: bigint;
  feesB: bigint;
  burnLp: bigint;
}
