import {
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

import { SuiAddressType } from "../../../utils";
import {
  CreatePoolBaseArgs,
  QuoteSwapArgs,
  SwapArgs,
} from "../../pool/poolArgs";

export type StableSwapArgs = SwapArgs & StableSwapExtraArgs;
export type StableQuoteSwapArgs = QuoteSwapArgs & StableSwapExtraArgs;

export interface StableSwapExtraArgs {
  type: "Stable";
  oraclePriceA: TransactionArgument;
  oraclePriceB: TransactionArgument;
  // TODO: Remove these after refactor
  bankA?: SuiAddressType;
  bankB?: SuiAddressType;
  lendingMarket?: SuiAddressType;
}

export type CreateStablePoolArgs = CreatePoolBaseArgs & {
  type: "Stable";
  lendingMarket: SuiAddressType;
  oracleRegistry: SuiAddressType;
  oracleIndexA: bigint | TransactionArgument;
  oracleIndexB: bigint | TransactionArgument;
  lendingMarketType: string;
  coinTypeA: string;
  coinTypeB: string;
  coinMetaA: string | TransactionObjectInput;
  coinMetaB: string | TransactionObjectInput;
  amplifier: bigint | TransactionArgument;
};
