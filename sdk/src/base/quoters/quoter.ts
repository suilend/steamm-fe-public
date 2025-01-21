import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";
import {
  CpQuoteSwapArgs,
  CpSwapArgs,
} from "./constantQuoter/constantProductArgs";

// TODO: Should be generic args
export interface Quoter {
  swap(args: CpSwapArgs, tx: Transaction): TransactionResult;
  quoteSwap(args: CpQuoteSwapArgs, tx: Transaction): TransactionArgument;
  poolType(): [string];
  quoterTypes(): [string, string, string];
  poolTypes(): [string, string, string, string];
}
