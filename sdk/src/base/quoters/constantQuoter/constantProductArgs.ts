import { TransactionArgument } from "@mysten/sui/transactions";

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
