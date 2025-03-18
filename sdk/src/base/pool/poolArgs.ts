import {
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";

import {
  CpQuoteSwapArgs,
  CpSwapArgs,
  CreateCpPoolArgs,
} from "../quoters/constantQuoter/args";
import {
  CreateOraclePoolArgs,
  OracleQuoteSwapArgs,
  OracleSwapArgs,
} from "../quoters/oracleQuoter/args";

export type SwapFullArgs = CpSwapArgs | OracleSwapArgs;
export type QuoteSwapFullArgs = CpQuoteSwapArgs | OracleQuoteSwapArgs;
export type CreatePoolArgs = CreateCpPoolArgs | CreateOraclePoolArgs;

export interface CreatePoolBaseArgs {
  coinTypeA: string;
  coinTypeB: string;
  lpTokenType: string;
  registry: string | TransactionObjectInput;
  swapFeeBps: bigint | TransactionArgument;
  coinMetaA: string | TransactionObjectInput;
  coinMetaB: string | TransactionObjectInput;
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

export interface MigrateArgs {
  adminCap: TransactionObjectInput;
}

export interface MigratePoolArgs {
  globalAdmin: TransactionObjectInput;
}

export interface SharePoolArgs {
  pool: TransactionResult;
  coinTypeA: string;
  coinTypeB: string;
  lpTokenType: string;
}
