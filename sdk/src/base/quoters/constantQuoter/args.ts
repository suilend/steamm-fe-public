import { TransactionArgument } from "@mysten/sui/transactions";

import {
  CreatePoolArgs,
  PoolQuoteSwapArgs,
  PoolSwapArgs,
} from "../../pool/poolArgs";

export type CreateCpPoolArgs = CreatePoolArgs & {
  offset: bigint | TransactionArgument;
};
export type CpSwapArgs = PoolSwapArgs & {};
export type CpQuoteSwapArgs = PoolQuoteSwapArgs & {};
