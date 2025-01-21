import { PUBLISHED_AT } from "..";
import { obj, pure } from "../../_framework/util";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export interface NewArgs {
  registry: TransactionObjectInput;
  swapFeeBps: bigint | TransactionArgument;
  offset: bigint | TransactionArgument;
  metaA: TransactionObjectInput;
  metaB: TransactionObjectInput;
  metaLp: TransactionObjectInput;
  lpTreasury: TransactionObjectInput;
}

export function new_(
  tx: Transaction,
  typeArgs: [string, string, string],
  args: NewArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::cpmm::new`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.registry),
      pure(tx, args.swapFeeBps, `u64`),
      pure(tx, args.offset, `u64`),
      obj(tx, args.metaA),
      obj(tx, args.metaB),
      obj(tx, args.metaLp),
      obj(tx, args.lpTreasury),
    ],
  });
}

export interface SwapArgs {
  pool: TransactionObjectInput;
  coinA: TransactionObjectInput;
  coinB: TransactionObjectInput;
  a2B: boolean | TransactionArgument;
  amountIn: bigint | TransactionArgument;
  minAmountOut: bigint | TransactionArgument;
}

export function swap(
  tx: Transaction,
  typeArgs: [string, string, string],
  args: SwapArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::cpmm::swap`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      obj(tx, args.coinA),
      obj(tx, args.coinB),
      pure(tx, args.a2B, `bool`),
      pure(tx, args.amountIn, `u64`),
      pure(tx, args.minAmountOut, `u64`),
    ],
  });
}

export function k(
  tx: Transaction,
  typeArgs: [string, string, string],
  pool: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::cpmm::k`,
    typeArguments: typeArgs,
    arguments: [obj(tx, pool)],
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
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::cpmm::migrate`,
    typeArguments: typeArgs,
    arguments: [obj(tx, args.pool), obj(tx, args.admin)],
  });
}

export interface CheckInvarianceArgs {
  pool: TransactionObjectInput;
  k0: bigint | TransactionArgument;
  offset: bigint | TransactionArgument;
}

export function checkInvariance(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: CheckInvarianceArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::cpmm::check_invariance`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      pure(tx, args.k0, `u128`),
      pure(tx, args.offset, `u64`),
    ],
  });
}

export function offset(
  tx: Transaction,
  typeArgs: [string, string, string],
  pool: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::cpmm::offset`,
    typeArguments: typeArgs,
    arguments: [obj(tx, pool)],
  });
}

export interface KExternalArgs {
  pool: TransactionObjectInput;
  offset: bigint | TransactionArgument;
}

export function kExternal(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: KExternalArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::cpmm::k_external`,
    typeArguments: typeArgs,
    arguments: [obj(tx, args.pool), pure(tx, args.offset, `u64`)],
  });
}

export function maxAmountInOnA2b(
  tx: Transaction,
  typeArgs: [string, string, string],
  pool: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::cpmm::max_amount_in_on_a2b`,
    typeArguments: typeArgs,
    arguments: [obj(tx, pool)],
  });
}

export interface QuoteSwapArgs {
  pool: TransactionObjectInput;
  amountIn: bigint | TransactionArgument;
  a2B: boolean | TransactionArgument;
}

export function quoteSwap(
  tx: Transaction,
  typeArgs: [string, string, string],
  args: QuoteSwapArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::cpmm::quote_swap`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      pure(tx, args.amountIn, `u64`),
      pure(tx, args.a2B, `bool`),
    ],
  });
}

export interface QuoteSwap_Args {
  amountIn: bigint | TransactionArgument;
  reserveIn: bigint | TransactionArgument;
  reserveOut: bigint | TransactionArgument;
  offset: bigint | TransactionArgument;
  a2B: boolean | TransactionArgument;
}

export function quoteSwap_(
  tx: Transaction,
  args: QuoteSwap_Args,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::cpmm::quote_swap_`,
    arguments: [
      pure(tx, args.amountIn, `u64`),
      pure(tx, args.reserveIn, `u64`),
      pure(tx, args.reserveOut, `u64`),
      pure(tx, args.offset, `u64`),
      pure(tx, args.a2B, `bool`),
    ],
  });
}

export interface QuoteSwapImplArgs {
  reserveA: bigint | TransactionArgument;
  reserveB: bigint | TransactionArgument;
  amountIn: bigint | TransactionArgument;
  offset: bigint | TransactionArgument;
  a2B: boolean | TransactionArgument;
}

export function quoteSwapImpl(
  tx: Transaction,
  args: QuoteSwapImplArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::cpmm::quote_swap_impl`,
    arguments: [
      pure(tx, args.reserveA, `u64`),
      pure(tx, args.reserveB, `u64`),
      pure(tx, args.amountIn, `u64`),
      pure(tx, args.offset, `u64`),
      pure(tx, args.a2B, `bool`),
    ],
  });
}
