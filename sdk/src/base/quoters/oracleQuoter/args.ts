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

export type OracleSwapArgs = SwapArgs & OracleSwapExtraArgs;
export type OracleQuoteSwapArgs = QuoteSwapArgs & OracleSwapExtraArgs;

export interface OracleSwapExtraArgs {
  type: "Oracle";
  oraclePriceA: TransactionArgument;
  oraclePriceB: TransactionArgument;
  // TODO: Remove these after refactor
  bankA?: SuiAddressType;
  bankB?: SuiAddressType;
  lendingMarket?: SuiAddressType;
}

export type CreateOraclePoolArgs = CreatePoolBaseArgs & {
  type: "Oracle";
  lendingMarket: SuiAddressType;
  oracleRegistry: SuiAddressType;
  oracleIndexA: bigint | TransactionArgument;
  oracleIndexB: bigint | TransactionArgument;
  lendingMarketType: string;
  coinTypeA: string;
  coinTypeB: string;
  coinMetaA: string | TransactionObjectInput;
  coinMetaB: string | TransactionObjectInput;
};
