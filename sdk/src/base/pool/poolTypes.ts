export interface DepositQuote {
  initialDeposit: boolean;
  depositA: bigint;
  depositB: bigint;
  mintLp: bigint;
}

export interface RedeemQuote {
  withdrawA: bigint;
  withdrawB: bigint;
  burnLp: bigint;
}

export interface SwapQuote {
  amountIn: bigint;
  amountOut: bigint;
  outputFees: SwapFee;
  a2b: boolean;
}

export interface SwapFee {
  protocolFees: bigint;
  poolFees: bigint;
}



export function castDepositQuote(obj: any): DepositQuote {
  return {
    depositA: BigInt(obj.deposit_a),
    depositB: BigInt(obj.deposit_b),
    initialDeposit: obj.initial_deposit,
    mintLp: BigInt(obj.mint_lp),
  };
}

export function castRedeemQuote(obj: any): RedeemQuote {
  return {
    burnLp: BigInt(obj.burn_lp),
    withdrawA: BigInt(obj.withdraw_a),
    withdrawB: BigInt(obj.withdraw_b),
  };
}

export function castSwapQuote(obj: any): SwapQuote {
  return {
    a2b: obj.a2b,
    amountIn: BigInt(obj.amount_in),
    amountOut: BigInt(obj.amount_out),
    outputFees: castSwapFee(obj.output_fees),
  };
}

export function castSwapFee(obj: any): SwapFee {
  return {
    poolFees: BigInt(obj.pool_fees),
    protocolFees: BigInt(obj.protocol_fees),
  };
}