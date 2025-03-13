import { TransactionArgument } from "@mysten/sui/transactions";

import {
  BaseQuoteSwapArgs,
  BaseSwapArgs,
  CreatePoolBaseArgs,
} from "../../pool/poolArgs";

export type CreateCpPoolArgs = CreatePoolBaseArgs & {
  type: "ConstantProduct";
  offset: bigint | TransactionArgument;
};

export type CreateCpPooltTopArgs = Omit<CreateCpPoolArgs, "registry">;
export type CpSwapArgs = BaseSwapArgs & { type: "ConstantProduct" };
export type CpQuoteSwapArgs = BaseQuoteSwapArgs & { type: "ConstantProduct" };
