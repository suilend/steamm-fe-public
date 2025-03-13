import {
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

import { SuiAddressType } from "../../../utils";
import {
  BaseQuoteSwapArgs,
  BaseSwapArgs,
  CreatePoolBaseArgs,
} from "../../pool/poolArgs";

// {
//   pool: poolAB.poolId,
//   coinTypeA: coinAData.coinType,
//   coinTypeB: coinBData.coinType,
//   coinA: coinIn,
//   coinB: coinOut,
//   a2b: false,
//   amountIn: BigInt("10000"),
//   minAmountOut: BigInt("0"),
// }

export type OracleSwapArgs = BaseSwapArgs & {
  type: "Oracle";
  lendingMarket: SuiAddressType;
  bankA: SuiAddressType;
  bankB: SuiAddressType;
  oraclePriceUpdateA: SuiAddressType;
  oraclePriceUpdateB: SuiAddressType;
};

export type OracleQuoteSwapArgs = BaseQuoteSwapArgs & {
  type: "Oracle";
  lendingMarket: SuiAddressType;
  bankA: SuiAddressType;
  bankB: SuiAddressType;
  oraclePriceUpdateA: SuiAddressType;
  oraclePriceUpdateB: SuiAddressType;
};

export type CreateOraclePoolArgs = CreatePoolBaseArgs & {
  type: "Oracle";
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

export type CreateOraclePoolTopArgs = Omit<
  CreateOraclePoolArgs,
  "registry" | "oracleRegistry" | "lendingMarket" | "lendingMarketType"
>;
