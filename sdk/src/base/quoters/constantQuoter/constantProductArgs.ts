import {
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";
import {
  PoolNewArgs,
  PoolQuoteSwapBaseArgs,
  PoolSwapBaseArgs,
} from "../../pool/poolArgs";

export type CpNewArgs = PoolNewArgs & {
  offset: bigint | TransactionArgument;
};
export type CpSwapArgs = PoolSwapBaseArgs & {};
export type CpQuoteSwapArgs = PoolQuoteSwapBaseArgs & {};

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
