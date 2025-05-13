import {
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";

import {
  CreatePoolBaseArgs,
  QuoteSwapArgs,
  SwapArgs,
} from "../../pool/poolArgs";

export type CreateCpPoolArgs = CreatePoolBaseArgs & {
  type: "ConstantProduct";
  offset: bigint | TransactionArgument;
};

export type CpSwapArgs = SwapArgs & { type: "ConstantProduct" };
export type CpQuoteSwapArgs = QuoteSwapArgs & { type: "ConstantProduct" };
