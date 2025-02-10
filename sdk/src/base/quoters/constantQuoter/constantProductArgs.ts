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
