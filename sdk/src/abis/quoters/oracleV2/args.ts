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

export type OracleV2SwapArgs = SwapArgs & OracleV2SwapExtraArgs;
export type OracleV2QuoteSwapArgs = QuoteSwapArgs & OracleV2SwapExtraArgs;

export interface OracleV2SwapExtraArgs {
  type: "OracleV2";
  oraclePriceA: TransactionArgument;
  oraclePriceB: TransactionArgument;
  // TODO: Remove these after refactor
  bankA?: SuiAddressType;
  bankB?: SuiAddressType;
  lendingMarket?: SuiAddressType;
}

export type CreateOracleV2PoolArgs = CreatePoolBaseArgs & {
  type: "OracleV2";
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
