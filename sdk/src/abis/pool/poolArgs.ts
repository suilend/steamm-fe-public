import {
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";

import {
  CpQuoteSwapArgs,
  CpSwapArgs,
  CreateCpPoolArgs,
} from "../quoters/constantProduct/args";
import {
  CreateOraclePoolArgs,
  OracleQuoteSwapArgs,
  OracleSwapArgs,
} from "../quoters/oracleV1/args";
import {
  CreateOracleV2PoolArgs,
  OracleV2QuoteSwapArgs,
  OracleV2SwapArgs,
} from "../quoters/oracleV2/args";

export type SwapFullArgs = CpSwapArgs | OracleSwapArgs | OracleV2SwapArgs;
export type QuoteSwapFullArgs =
  | CpQuoteSwapArgs
  | OracleQuoteSwapArgs
  | OracleV2QuoteSwapArgs;
export type CreatePoolArgs =
  | CreateCpPoolArgs
  | CreateOraclePoolArgs
  | CreateOracleV2PoolArgs;

export interface CreatePoolBaseArgs {
  bTokenTypeA: string;
  bTokenTypeB: string;
  lpTokenType: string;
  registry: string | TransactionObjectInput;
  swapFeeBps: bigint | TransactionArgument;
  bTokenMetaA: string | TransactionObjectInput;
  bTokenMetaB: string | TransactionObjectInput;
  lpMetadataId: string | TransactionObjectInput;
  lpTreasuryId: string | TransactionObjectInput;
}

export interface SwapArgs {
  coinA: TransactionObjectInput;
  coinB: TransactionObjectInput;
  a2b: boolean | TransactionArgument;
  amountIn: bigint | TransactionArgument;
  minAmountOut: bigint | TransactionArgument;
}

export interface QuoteSwapArgs {
  amountIn: bigint | TransactionArgument;
  a2b: boolean | TransactionArgument;
}

export interface DepositLiquidityArgs {
  coinA: TransactionArgument;
  coinB: TransactionArgument;
  maxA: bigint | TransactionArgument;
  maxB: bigint | TransactionArgument;
}

export interface RedeemLiquidityArgs {
  lpCoin: TransactionObjectInput;
  minA: bigint | TransactionArgument;
  minB: bigint | TransactionArgument;
}

export interface QuoteDepositArgs {
  maxA: bigint | TransactionArgument;
  maxB: bigint | TransactionArgument;
}

export interface QuoteRedeemArgs {
  lpTokens: bigint | TransactionArgument;
}

export interface CollectProtocolFeesArgs {
  globalAdmin: TransactionObjectInput;
}

export interface SetDepositLimitArgs {
  globalAdmin: TransactionObjectInput;
  k: bigint | TransactionArgument;
}

export interface MigrateArgs {
  adminCap: TransactionObjectInput;
}

export interface MigratePoolArgs {
  globalAdmin: TransactionObjectInput;
}

export interface SharePoolArgs {
  pool: TransactionResult;
  bTokenTypeA: string;
  bTokenTypeB: string;
  lpTokenType: string;
}
