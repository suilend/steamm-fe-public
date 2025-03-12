import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";

import { quoteSwapArgs, swapArgs } from ".";

export interface Quoter {
  swap(tx: Transaction, args: swapArgs): TransactionResult;
  quoteSwap(tx: Transaction, args: quoteSwapArgs): TransactionArgument;
  poolType(): [string];
  quoterTypes(): [string, string, string];
  poolTypes(): [string, string, string, string];
}
