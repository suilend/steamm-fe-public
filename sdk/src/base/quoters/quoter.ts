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
  swap(tx: Transaction, args: CpSwapArgs): TransactionResult;
  quoteSwap(tx: Transaction, args: CpQuoteSwapArgs): TransactionArgument;
  poolType(): [string];
  quoterTypes(): [string, string, string];
  poolTypes(): [string, string, string, string];
}
