import { PUBLISHED_AT } from "..";
import { obj, pure } from "../../_framework/util";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export interface AbsDiffArgs {
  x: TransactionObjectInput;
  y: TransactionObjectInput;
}

export function absDiff(
  tx: Transaction,
  args: AbsDiffArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::math::abs_diff`,
    arguments: [obj(tx, args.x), obj(tx, args.y)],
  });
}

export interface CheckedMulDivArgs {
  x: bigint | TransactionArgument;
  y: bigint | TransactionArgument;
  z: bigint | TransactionArgument;
}

export function checkedMulDiv(
  tx: Transaction,
  args: CheckedMulDivArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::math::checked_mul_div`,
    arguments: [
      pure(tx, args.x, `u64`),
      pure(tx, args.y, `u64`),
      pure(tx, args.z, `u64`),
    ],
  });
}

export interface CheckedMulDivUpArgs {
  x: bigint | TransactionArgument;
  y: bigint | TransactionArgument;
  z: bigint | TransactionArgument;
}

export function checkedMulDivUp(
  tx: Transaction,
  args: CheckedMulDivUpArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::math::checked_mul_div_up`,
    arguments: [
      pure(tx, args.x, `u64`),
      pure(tx, args.y, `u64`),
      pure(tx, args.z, `u64`),
    ],
  });
}

export interface MinNonZeroArgs {
  x: bigint | TransactionArgument;
  y: bigint | TransactionArgument;
}

export function minNonZero(
  tx: Transaction,
  args: MinNonZeroArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::math::min_non_zero`,
    arguments: [pure(tx, args.x, `u64`), pure(tx, args.y, `u64`)],
  });
}

export interface SafeCompareMulU64Args {
  a1: bigint | TransactionArgument;
  b1: bigint | TransactionArgument;
  a2: bigint | TransactionArgument;
  b2: bigint | TransactionArgument;
}

export function safeCompareMulU64(
  tx: Transaction,
  args: SafeCompareMulU64Args,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::math::safe_compare_mul_u64`,
    arguments: [
      pure(tx, args.a1, `u64`),
      pure(tx, args.b1, `u64`),
      pure(tx, args.a2, `u64`),
      pure(tx, args.b2, `u64`),
    ],
  });
}

export interface SafeMulDivArgs {
  x: bigint | TransactionArgument;
  y: bigint | TransactionArgument;
  z: bigint | TransactionArgument;
}

export function safeMulDiv(
  tx: Transaction,
  args: SafeMulDivArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::math::safe_mul_div`,
    arguments: [
      pure(tx, args.x, `u64`),
      pure(tx, args.y, `u64`),
      pure(tx, args.z, `u64`),
    ],
  });
}

export interface SafeMulDivUpArgs {
  x: bigint | TransactionArgument;
  y: bigint | TransactionArgument;
  z: bigint | TransactionArgument;
}

export function safeMulDivUp(
  tx: Transaction,
  args: SafeMulDivUpArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::math::safe_mul_div_up`,
    arguments: [
      pure(tx, args.x, `u64`),
      pure(tx, args.y, `u64`),
      pure(tx, args.z, `u64`),
    ],
  });
}
