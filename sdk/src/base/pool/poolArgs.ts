import {
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

import { SuiAddressType, SuiTypeName } from "../../utils";
import {
  CpQuoteSwapArgs,
  CpSwapArgs,
  CreateCpPoolArgs,
  CreateCpPooltTopArgs,
} from "../quoters/constantQuoter/args";
import {
  CreateOraclePoolArgs,
  CreateOraclePoolTopArgs,
  OracleQuoteSwapArgs,
  OracleSwapArgs,
} from "../quoters/oracleQuoter/args";

export type PoolArgs = {
  pool: SuiAddressType;
  coinTypeA: SuiTypeName;
  coinTypeB: SuiTypeName;
};

export type SwapArgs = CpSwapArgs | OracleSwapArgs;
export type QuoteSwapArgs = CpQuoteSwapArgs | OracleQuoteSwapArgs;

export type CreatePoolArgs = CreateCpPoolArgs | CreateOraclePoolArgs;
export type CreatePoolTopArgs = CreateCpPooltTopArgs | CreateOraclePoolTopArgs;

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

export interface BaseSwapArgs {
  coinA: TransactionObjectInput;
  coinB: TransactionObjectInput;
  a2b: boolean | TransactionArgument;
  amountIn: bigint | TransactionArgument;
  minAmountOut: bigint | TransactionArgument;
}

export interface BaseQuoteSwapArgs {
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
