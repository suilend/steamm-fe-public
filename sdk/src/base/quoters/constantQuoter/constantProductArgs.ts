import {
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";

import {
  PoolNewArgs,
  PoolQuoteSwapArgs,
  PoolSwapArgs,
} from "../../pool/poolArgs";

export type CpNewArgs = PoolNewArgs & {
  offset: bigint | TransactionArgument;
};
export type CpSwapArgs = PoolSwapArgs & {};
export type CpQuoteSwapArgs = PoolQuoteSwapArgs & {};

export interface CreateCpPoolArgs {
  coinTypeA: string;
  coinMetaA: string | TransactionObjectInput;
  coinTypeB: string;
  coinMetaB: string | TransactionObjectInput;
  lpTreasury: string | TransactionObjectInput;
  lpTokenType: string;
  lpTokenMeta: string | TransactionObjectInput;
  swapFeeBps: bigint | TransactionArgument;
  offset: bigint | TransactionArgument;
  registry: string | TransactionObjectInput;
}

export interface ShareCpPoolArgs {
  pool: TransactionResult;
  coinTypeA: string;
  coinTypeB: string;
  lpTokenType: string;
}
