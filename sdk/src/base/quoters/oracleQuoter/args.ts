import {
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

import { SuiAddressType } from "../../../utils";
import {
  CreatePoolArgs,
  PoolQuoteSwapArgs,
  PoolSwapArgs,
} from "../../pool/poolArgs";

export type OracleSwapArgs = PoolSwapArgs & {
  lendingMarket: SuiAddressType;
  bankA: SuiAddressType;
  bankB: SuiAddressType;
  oraclePriceUpdateA: SuiAddressType;
  oraclePriceUpdateB: SuiAddressType;
};

export type OracleQuoteSwapArgs = PoolQuoteSwapArgs & {
  lendingMarket: SuiAddressType;
  bankA: SuiAddressType;
  bankB: SuiAddressType;
  oraclePriceUpdateA: SuiAddressType;
  oraclePriceUpdateB: SuiAddressType;
};

export type CreateOraclePoolArgs = CreatePoolArgs & {
  lendingMarket: SuiAddressType;
  oracleRegistry: SuiAddressType;
  oracleIndexA: bigint | TransactionArgument;
  oracleIndexB: bigint | TransactionArgument;
  lendingMarketType: string;
  bTokenTypeA: string;
  bTokenTypeB: string;
  bTokenMetaA: string | TransactionObjectInput;
  bTokenMetaB: string | TransactionObjectInput;
};
