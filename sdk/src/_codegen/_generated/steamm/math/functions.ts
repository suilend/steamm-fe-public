import {PUBLISHED_AT} from "..";
import {obj, pure} from "../../_framework/util";
import {Transaction, TransactionArgument, TransactionObjectInput} from "@mysten/sui/transactions";

export interface AbsDiffArgs {
    x: TransactionObjectInput; y: TransactionObjectInput
}

export function absDiff(
    tx: Transaction,
    args: AbsDiffArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::math::abs_diff`,
        arguments: [
            obj(tx, args.x), obj(tx, args.y)
        ],
    })
}

export interface CheckedMulDivArgs {
    x: bigint | TransactionArgument; y: bigint | TransactionArgument; z: bigint | TransactionArgument
}

export function checkedMulDiv(
    tx: Transaction,
    args: CheckedMulDivArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::math::checked_mul_div`,
        arguments: [
            pure(tx, args.x, `u64`), pure(tx, args.y, `u64`), pure(tx, args.z, `u64`)
        ],
    })
}

export interface CheckedMulDivUpArgs {
    x: bigint | TransactionArgument; y: bigint | TransactionArgument; z: bigint | TransactionArgument
}

export function checkedMulDivUp(
    tx: Transaction,
    args: CheckedMulDivUpArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::math::checked_mul_div_up`,
        arguments: [
            pure(tx, args.x, `u64`), pure(tx, args.y, `u64`), pure(tx, args.z, `u64`)
        ],
    })
}

export interface MinNonZeroArgs {
    x: bigint | TransactionArgument; y: bigint | TransactionArgument
}

export function minNonZero(
    tx: Transaction,
    args: MinNonZeroArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::math::min_non_zero`,
        arguments: [
            pure(tx, args.x, `u64`), pure(tx, args.y, `u64`)
        ],
    })
}

export interface SafeMulDivArgs {
    x: bigint | TransactionArgument; y: bigint | TransactionArgument; z: bigint | TransactionArgument
}

export function safeMulDiv(
    tx: Transaction,
    args: SafeMulDivArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::math::safe_mul_div`,
        arguments: [
            pure(tx, args.x, `u64`), pure(tx, args.y, `u64`), pure(tx, args.z, `u64`)
        ],
    })
}

export interface SafeMulDivUpArgs {
    x: bigint | TransactionArgument; y: bigint | TransactionArgument; z: bigint | TransactionArgument
}

export function safeMulDivUp(
    tx: Transaction,
    args: SafeMulDivUpArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::math::safe_mul_div_up`,
        arguments: [
            pure(tx, args.x, `u64`), pure(tx, args.y, `u64`), pure(tx, args.z, `u64`)
        ],
    })
}
