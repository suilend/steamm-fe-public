import {PUBLISHED_AT} from "..";
import {obj, pure} from "../../_framework/util";
import {Transaction, TransactionArgument, TransactionObjectInput} from "@mysten/sui/transactions";

export interface QuoteDepositArgs {
    pool: TransactionObjectInput; bankA: TransactionObjectInput; bankB: TransactionObjectInput; lendingMarket: TransactionObjectInput; maxA: bigint | TransactionArgument; maxB: bigint | TransactionArgument; clock: TransactionObjectInput
}

export function quoteDeposit(
    tx: Transaction,
    typeArgs: [string, string, string, string, string, string, string],
    args: QuoteDepositArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::script_v1::quote_deposit`,
        typeArguments: typeArgs,
        arguments: [
            obj(tx, args.pool), obj(tx, args.bankA), obj(tx, args.bankB), obj(tx, args.lendingMarket), pure(tx, args.maxA, `u64`), pure(tx, args.maxB, `u64`), obj(tx, args.clock)
        ],
    })
}

export interface QuoteRedeemArgs {
    pool: TransactionObjectInput; bankA: TransactionObjectInput; bankB: TransactionObjectInput; lendingMarket: TransactionObjectInput; lpTokens: bigint | TransactionArgument; clock: TransactionObjectInput
}

export function quoteRedeem(
    tx: Transaction,
    typeArgs: [string, string, string, string, string, string, string],
    args: QuoteRedeemArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::script_v1::quote_redeem`,
        typeArguments: typeArgs,
        arguments: [
            obj(tx, args.pool), obj(tx, args.bankA), obj(tx, args.bankB), obj(tx, args.lendingMarket), pure(tx, args.lpTokens, `u64`), obj(tx, args.clock)
        ],
    })
}

export interface DepositLiquidityArgs {
    pool: TransactionObjectInput; bankA: TransactionObjectInput; bankB: TransactionObjectInput; lendingMarket: TransactionObjectInput; coinA: TransactionObjectInput; coinB: TransactionObjectInput; maxA: bigint | TransactionArgument; maxB: bigint | TransactionArgument; clock: TransactionObjectInput
}

export function depositLiquidity(
    tx: Transaction,
    typeArgs: [string, string, string, string, string, string, string],
    args: DepositLiquidityArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::script_v1::deposit_liquidity`,
        typeArguments: typeArgs,
        arguments: [
            obj(tx, args.pool), obj(tx, args.bankA), obj(tx, args.bankB), obj(tx, args.lendingMarket), obj(tx, args.coinA), obj(tx, args.coinB), pure(tx, args.maxA, `u64`), pure(tx, args.maxB, `u64`), obj(tx, args.clock)
        ],
    })
}

export interface RedeemLiquidityArgs {
    pool: TransactionObjectInput; bankA: TransactionObjectInput; bankB: TransactionObjectInput; lendingMarket: TransactionObjectInput; lpTokens: TransactionObjectInput; minA: bigint | TransactionArgument; minB: bigint | TransactionArgument; clock: TransactionObjectInput
}

export function redeemLiquidity(
    tx: Transaction,
    typeArgs: [string, string, string, string, string, string, string],
    args: RedeemLiquidityArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::script_v1::redeem_liquidity`,
        typeArguments: typeArgs,
        arguments: [
            obj(tx, args.pool), obj(tx, args.bankA), obj(tx, args.bankB), obj(tx, args.lendingMarket), obj(tx, args.lpTokens), pure(tx, args.minA, `u64`), pure(tx, args.minB, `u64`), obj(tx, args.clock)
        ],
    })
}

export interface CpmmSwapArgs {
    pool: TransactionObjectInput; bankA: TransactionObjectInput; bankB: TransactionObjectInput; lendingMarket: TransactionObjectInput; coinA: TransactionObjectInput; coinB: TransactionObjectInput; a2B: boolean | TransactionArgument; amountIn: bigint | TransactionArgument; minAmountOut: bigint | TransactionArgument; clock: TransactionObjectInput
}

export function cpmmSwap(
    tx: Transaction,
    typeArgs: [string, string, string, string, string, string],
    args: CpmmSwapArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::script_v1::cpmm_swap`,
        typeArguments: typeArgs,
        arguments: [
            obj(tx, args.pool), obj(tx, args.bankA), obj(tx, args.bankB), obj(tx, args.lendingMarket), obj(tx, args.coinA), obj(tx, args.coinB), pure(tx, args.a2B, `bool`), pure(tx, args.amountIn, `u64`), pure(tx, args.minAmountOut, `u64`), obj(tx, args.clock)
        ],
    })
}

export interface DestroyOrTransferArgs {
    btokenA: TransactionObjectInput; btokenB: TransactionObjectInput
}

export function destroyOrTransfer(
    tx: Transaction,
    typeArgs: [string, string],
    args: DestroyOrTransferArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::script_v1::destroy_or_transfer`,
        typeArguments: typeArgs,
        arguments: [
            obj(tx, args.btokenA), obj(tx, args.btokenB)
        ],
    })
}

export interface QuoteCpmmSwapArgs {
    pool: TransactionObjectInput; bankA: TransactionObjectInput; bankB: TransactionObjectInput; lendingMarket: TransactionObjectInput; a2B: boolean | TransactionArgument; amountIn: bigint | TransactionArgument; clock: TransactionObjectInput
}

export function quoteCpmmSwap(
    tx: Transaction,
    typeArgs: [string, string, string, string, string, string],
    args: QuoteCpmmSwapArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::script_v1::quote_cpmm_swap`,
        typeArguments: typeArgs,
        arguments: [
            obj(tx, args.pool), obj(tx, args.bankA), obj(tx, args.bankB), obj(tx, args.lendingMarket), pure(tx, args.a2B, `bool`), pure(tx, args.amountIn, `u64`), obj(tx, args.clock)
        ],
    })
}
