import {
  TransactionArgument,
  TransactionObjectInput,
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
  coinTypeB: string;
  lpTokenType: string;
  registry: string | TransactionObjectInput;
  swapFeeBps: bigint | TransactionArgument;
  offset: bigint | TransactionArgument;
  coinMetaA: string | TransactionObjectInput;
  coinMetaB: string | TransactionObjectInput;
  lpTokenMeta: string | TransactionObjectInput;
  lpTreasury: string | TransactionObjectInput;
}
