export * from "./constantProduct";
export * from "./oracleV1";

import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";

import { QuoteSwapArgs, SwapArgs } from "../pool";

export interface QuoterAbi {
  swap(tx: Transaction, args: SwapArgs): TransactionResult;
  quoteSwap(tx: Transaction, args: QuoteSwapArgs): TransactionArgument;
  poolType(): [string];
  quoterTypes(): [string, string, string];
  poolTypes(): [string, string, string, string];
}
