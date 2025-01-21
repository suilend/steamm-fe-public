import { PUBLISHED_AT } from "..";
import { obj, pure } from "../../_framework/util";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export interface NewArgs {
  feeNumerator: bigint | TransactionArgument;
  feeDenominator: bigint | TransactionArgument;
  minFee: bigint | TransactionArgument;
}

export function new_(
  tx: Transaction,
  typeArgs: [string, string],
  args: NewArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::fees::new`,
    typeArguments: typeArgs,
    arguments: [
      pure(tx, args.feeNumerator, `u64`),
      pure(tx, args.feeDenominator, `u64`),
      pure(tx, args.minFee, `u64`),
    ],
  });
}

export function config(
  tx: Transaction,
  typeArgs: [string, string],
  fees: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::fees::config`,
    typeArguments: typeArgs,
    arguments: [obj(tx, fees)],
  });
}

export function withdraw(
  tx: Transaction,
  typeArgs: [string, string],
  fees: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::fees::withdraw`,
    typeArguments: typeArgs,
    arguments: [obj(tx, fees)],
  });
}

export function balances(
  tx: Transaction,
  typeArgs: [string, string],
  fees: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::fees::balances`,
    typeArguments: typeArgs,
    arguments: [obj(tx, fees)],
  });
}

export interface NewConfigArgs {
  feeNumerator: bigint | TransactionArgument;
  feeDenominator: bigint | TransactionArgument;
  minFee: bigint | TransactionArgument;
}

export function newConfig(
  tx: Transaction,
  args: NewConfigArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::fees::new_config`,
    arguments: [
      pure(tx, args.feeNumerator, `u64`),
      pure(tx, args.feeDenominator, `u64`),
      pure(tx, args.minFee, `u64`),
    ],
  });
}

export function balancesMut(
  tx: Transaction,
  typeArgs: [string, string],
  fees: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::fees::balances_mut`,
    typeArguments: typeArgs,
    arguments: [obj(tx, fees)],
  });
}

export function feeA(
  tx: Transaction,
  typeArgs: [string, string],
  fees: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::fees::fee_a`,
    typeArguments: typeArgs,
    arguments: [obj(tx, fees)],
  });
}

export function feeB(
  tx: Transaction,
  typeArgs: [string, string],
  fees: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::fees::fee_b`,
    typeArguments: typeArgs,
    arguments: [obj(tx, fees)],
  });
}

export function feeDenominator(
  tx: Transaction,
  feeConfig: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::fees::fee_denominator`,
    arguments: [obj(tx, feeConfig)],
  });
}

export function feeNumerator(
  tx: Transaction,
  feeConfig: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::fees::fee_numerator`,
    arguments: [obj(tx, feeConfig)],
  });
}

export function feeRatio(
  tx: Transaction,
  typeArgs: [string, string],
  fees: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::fees::fee_ratio`,
    typeArguments: typeArgs,
    arguments: [obj(tx, fees)],
  });
}

export function feeRatio_(
  tx: Transaction,
  feeConfig: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::fees::fee_ratio_`,
    arguments: [obj(tx, feeConfig)],
  });
}

export function minFee(
  tx: Transaction,
  feeConfig: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::fees::min_fee`,
    arguments: [obj(tx, feeConfig)],
  });
}

export interface SetConfigArgs {
  fees: TransactionObjectInput;
  feeNumerator: bigint | TransactionArgument;
  feeDenominator: bigint | TransactionArgument;
  minFee: bigint | TransactionArgument;
}

export function setConfig(
  tx: Transaction,
  typeArgs: [string, string],
  args: SetConfigArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::fees::set_config`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.fees),
      pure(tx, args.feeNumerator, `u64`),
      pure(tx, args.feeDenominator, `u64`),
      pure(tx, args.minFee, `u64`),
    ],
  });
}
