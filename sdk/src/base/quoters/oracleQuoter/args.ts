import {
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

import {
  // PoolNewArgs,
  PoolQuoteSwapArgs,
  PoolSwapArgs,
} from "../../pool/poolArgs";

// export type OracleNewArgs = PoolNewArgs & {
//   oracle_index_a: bigint;
//   oracle_index_b: bigint;
// };
export type OracleSwapArgs = PoolSwapArgs & {};
export type OracleQuoteSwapArgs = PoolQuoteSwapArgs & {};

export interface CreateCpPoolArgs {
  coinTypeA: string;
  coinTypeB: string;
  lpTokenType: string;
  registry: string | TransactionObjectInput;
  swapFeeBps: bigint | TransactionArgument;
  offset: bigint | TransactionArgument;
  coinMetaA: string | TransactionObjectInput;
  coinMetaB: string | TransactionObjectInput;
  lpTokenMeta: string | TransactionObjectInput;
  lpTreasury: string | TransactionObjectInput;
}
