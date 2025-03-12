import { PUBLISHED_AT } from "..";
import { obj, pure } from "../../_framework/util";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export interface SwapArgs {
  pool: TransactionObjectInput;
  bankA: TransactionObjectInput;
  bankB: TransactionObjectInput;
  lendingMarket: TransactionObjectInput;
  coinA: TransactionObjectInput;
  coinB: TransactionObjectInput;
  oraclePriceUpdateA: TransactionObjectInput;
  oraclePriceUpdateB: TransactionObjectInput;
  a2B: boolean | TransactionArgument;
  amountIn: bigint | TransactionArgument;
  minAmountOut: bigint | TransactionArgument;
  clock: TransactionObjectInput;
}

export function swap(
  tx: Transaction,
  typeArgs: [string, string, string],
  args: SwapArgs,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::omm::swap`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      obj(tx, args.bankA),
      obj(tx, args.bankB),
      obj(tx, args.lendingMarket),
      obj(tx, args.coinA),
      obj(tx, args.coinB),
      obj(tx, args.oraclePriceUpdateA),
      obj(tx, args.oraclePriceUpdateB),
      pure(tx, args.a2B, `bool`),
      pure(tx, args.amountIn, `u64`),
      pure(tx, args.minAmountOut, `u64`),
      obj(tx, args.clock),
    ],
  });
}

export interface NewArgs {
  registry: TransactionObjectInput;
  lendingMarket: TransactionObjectInput;
  swapFeeBps: bigint | TransactionArgument;
  oracleIndexA: bigint | TransactionArgument;
  oracleIndexB: bigint | TransactionArgument;
  oracleRegistry: TransactionObjectInput;
  metaA: TransactionObjectInput;
  metaB: TransactionObjectInput;
  metaBA: TransactionObjectInput;
  metaBB: TransactionObjectInput;
  metaLp: TransactionObjectInput;
  lpTreasury: TransactionObjectInput;
}

export function new_(
  tx: Transaction,
  typeArgs: [string, string, string],
  args: NewArgs,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::omm::new`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.registry),
      obj(tx, args.lendingMarket),
      obj(tx, args.metaA),
      obj(tx, args.metaB),
      obj(tx, args.metaBA),
      obj(tx, args.metaBB),
      obj(tx, args.metaLp),
      obj(tx, args.lpTreasury),
      pure(tx, args.swapFeeBps, `u64`),
      obj(tx, args.oracleRegistry),
      pure(tx, args.oracleIndexA, `u64`),
      pure(tx, args.oracleIndexB, `u64`),
    ],
  });
}

export interface MigrateArgs {
  pool: TransactionObjectInput;
  admin: TransactionObjectInput;
}

export function migrate(
  tx: Transaction,
  typeArgs: [string, string, string],
  args: MigrateArgs,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::cpmm::migrate`,
    typeArguments: typeArgs,
    arguments: [obj(tx, args.pool), obj(tx, args.admin)],
  });
}

export interface QuoteSwapArgs {
  pool: TransactionObjectInput;
  bankA: TransactionObjectInput;
  bankB: TransactionObjectInput;
  lendingMarket: TransactionObjectInput;
  amountIn: bigint | TransactionArgument;
  oraclePriceUpdateA: TransactionObjectInput;
  oraclePriceUpdateB: TransactionObjectInput;
  clock: TransactionObjectInput;
  a2B: boolean | TransactionArgument;
}

export function quoteSwap(
  tx: Transaction,
  typeArgs: [string, string, string],
  args: QuoteSwapArgs,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::cpmm::quote_swap`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      obj(tx, args.bankA),
      obj(tx, args.bankB),
      obj(tx, args.lendingMarket),
      pure(tx, args.amountIn, `u64`),
      obj(tx, args.oraclePriceUpdateA),
      obj(tx, args.oraclePriceUpdateB),
      obj(tx, args.clock),
      pure(tx, args.a2B, `bool`),
    ],
  });
}
