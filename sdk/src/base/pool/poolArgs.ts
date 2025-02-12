import {
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export interface PoolNewArgs {
  coinMetadataA: TransactionObjectInput;
  coinMetadataB: TransactionObjectInput;
  coinMetadataLp: TransactionObjectInput;
  LpTreasury: TransactionObjectInput;
  registry: TransactionObjectInput;
  swapFeeBps: bigint | TransactionArgument;
}
export interface PoolSwapArgs {
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

export interface PoolQuoteSwapArgs {
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
  lpCoin: TransactionObjectInput;
  minA: bigint | TransactionArgument;
  minB: bigint | TransactionArgument;
}

export interface PoolQuoteDepositArgs {
  maxA: bigint | TransactionArgument;
  maxB: bigint | TransactionArgument;
}

export interface PoolQuoteRedeemArgs {
  lpTokens: bigint | TransactionArgument;
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
