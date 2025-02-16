import {SCRIPT_PUBLISHED_AT} from "..";
import {obj, pure} from "../../_framework/util";
import {Transaction, TransactionArgument, TransactionObjectInput} from "@mysten/sui/transactions";

export interface QuoteDepositArgs {
    pool: TransactionObjectInput; bankA: TransactionObjectInput; bankB: TransactionObjectInput; lendingMarket: TransactionObjectInput; maxA: bigint | TransactionArgument; maxB: bigint | TransactionArgument; clock: TransactionObjectInput
}

export function quoteDeposit(
    tx: Transaction,
    typeArgs: [string, string, string, string, string, string, string],
    args: QuoteDepositArgs,
    publishedAt: string = SCRIPT_PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::pool_script::quote_deposit`,
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
    publishedAt: string = SCRIPT_PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::pool_script::quote_redeem`,
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
    publishedAt: string = SCRIPT_PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::pool_script::deposit_liquidity`,
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
    publishedAt: string = SCRIPT_PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::pool_script::redeem_liquidity`,
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
    publishedAt: string = SCRIPT_PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::pool_script::cpmm_swap`,
        typeArguments: typeArgs,
        arguments: [
            obj(tx, args.pool), obj(tx, args.bankA), obj(tx, args.bankB), obj(tx, args.lendingMarket), obj(tx, args.coinA), obj(tx, args.coinB), pure(tx, args.a2B, `bool`), pure(tx, args.amountIn, `u64`), pure(tx, args.minAmountOut, `u64`), obj(tx, args.clock)
        ],
    })
}

export function destroyOrTransfer(
    tx: Transaction,
    typeArg: string,
    token: TransactionObjectInput,
    publishedAt: string = SCRIPT_PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::pool_script::destroy_or_transfer`,
        typeArguments: [typeArg],
        arguments: [
            obj(tx, token)
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
    publishedAt: string = SCRIPT_PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::pool_script::quote_cpmm_swap`,
        typeArguments: typeArgs,
        arguments: [
            obj(tx, args.pool), obj(tx, args.bankA), obj(tx, args.bankB), obj(tx, args.lendingMarket), pure(tx, args.a2B, `bool`), pure(tx, args.amountIn, `u64`), obj(tx, args.clock)
        ],
    })
}

export interface ToMultiSwapRouteArgs {
    bankX: TransactionObjectInput; bankY: TransactionObjectInput; lendingMarket: TransactionObjectInput; x2Y: boolean | TransactionArgument; amountIn: bigint | TransactionArgument; amountOut: bigint | TransactionArgument; clock: TransactionObjectInput
}

export function toMultiSwapRoute(
    tx: Transaction,
    typeArgs: [string, string, string, string, string],
    args: ToMultiSwapRouteArgs,
    publishedAt: string = SCRIPT_PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::pool_script::to_multi_swap_route`,
        typeArguments: typeArgs,
        arguments: [
            obj(tx, args.bankX), obj(tx, args.bankY), obj(tx, args.lendingMarket), pure(tx, args.x2Y, `bool`), pure(tx, args.amountIn, `u64`), pure(tx, args.amountOut, `u64`), obj(tx, args.clock)
        ],
    })
}
