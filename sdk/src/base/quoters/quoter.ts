import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";

import { QuoteSwapArgs, SwapArgs } from "../pool";

export interface Quoter {
  swap(tx: Transaction, args: SwapArgs): TransactionResult;
  quoteSwap(tx: Transaction, args: QuoteSwapArgs): TransactionArgument;
  poolType(): [string];
  quoterTypes(): [string, string, string];
  poolTypes(): [string, string, string, string];
}
