import {
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";
import {
  CpQuoteSwapArgs,
  CpSwapArgs,
} from "../quoters/constantQuoter/constantProductArgs";

export interface PoolNewArgs {
  coinMetadataA: TransactionObjectInput;
  coinMetadataB: TransactionObjectInput;
  coinMetadataLp: TransactionObjectInput;
  LpTreasury: TransactionObjectInput;
  registry: TransactionObjectInput;
  swapFeeBps: bigint | TransactionArgument;
}

export type PoolSwapArgs = CpSwapArgs; // Add more types here for new quoters
export type PoolQuoteSwapArgs = CpQuoteSwapArgs; // Add more types here for new quoters

export interface PoolSwapBaseArgs {
  coinA: TransactionObjectInput;
  coinB: TransactionObjectInput;
  a2b: boolean | TransactionArgument;
  amountIn: bigint | TransactionArgument;
  minAmountOut: bigint | TransactionArgument;
}

export interface PoolExecuteSwapArgs {
  intent: TransactionObjectInput;

  minAmountOut: bigint | TransactionArgument;
}

export interface PoolQuoteSwapBaseArgs {
  amountIn: bigint | TransactionArgument;
  a2b: boolean | TransactionArgument;
}

export interface PoolDepositLiquidityArgs {
  coinA: TransactionObjectInput;
  coinB: TransactionObjectInput;
  maxA: bigint | TransactionArgument;
  maxB: bigint | TransactionArgument;
}

export interface PoolRedeemLiquidityArgs {
  lpCoinObj: TransactionObjectInput;
  minA: bigint | TransactionArgument;
  minB: bigint | TransactionArgument;
}

export interface QuoteDepositArgs {
  maxA: bigint | TransactionArgument;
  maxB: bigint | TransactionArgument;
}

export interface PoolQuoteRedeemArgs {
  lpTokens: bigint | TransactionArgument;
}

export interface PoolSetPoolSwapFeesArgs {
  poolCap: TransactionObjectInput;
  swapFeeBps: bigint | TransactionArgument;
}

export interface PoolSetRedemptionFeesArgs {
  poolCap: TransactionObjectInput;
  redemptionFeeBps: bigint | TransactionArgument;
}

export interface CollectRedemptionFeesArgs {
  poolCap: TransactionObjectInput;
}

export interface CollectProtocolFeesArgs {
  globalAdmin: TransactionObjectInput;
}

export interface MigrateArgs {
  adminCap: TransactionObjectInput;
}

export interface MigratePoolArgs {
  globalAdmin: TransactionObjectInput;
}
