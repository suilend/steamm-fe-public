import {
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

// TODO: change TransactionObjectInput to TransactionArgument

export interface CreatePoolArgs {
  coinTypeA: string;
  coinTypeB: string;
  lpTokenType: string;
  registry: string | TransactionObjectInput;
  swapFeeBps: bigint | TransactionArgument;
  coinMetaA: string | TransactionObjectInput;
  coinMetaB: string | TransactionObjectInput;
  lpTokenMeta: string | TransactionObjectInput;
  lpTreasury: string | TransactionObjectInput;
}

export interface PoolSwapArgs {
  coinA: TransactionObjectInput;
  coinB: TransactionObjectInput;
  a2b: boolean | TransactionArgument;
  amountIn: bigint | TransactionArgument;
  minAmountOut: bigint | TransactionArgument;
}

export interface PoolQuoteSwapArgs {
  amountIn: bigint | TransactionArgument;
  a2b: boolean | TransactionArgument;
}

export interface PoolDepositLiquidityArgs {
  coinA: TransactionArgument;
  coinB: TransactionArgument;
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
