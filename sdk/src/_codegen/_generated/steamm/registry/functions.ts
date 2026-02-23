import {PUBLISHED_AT} from "..";
import {ID} from "../../_dependencies/source/0x2/object/structs";
import {obj, pure} from "../../_framework/util";
import {Transaction, TransactionArgument, TransactionObjectInput} from "@mysten/sui/transactions";

export function init(
    tx: Transaction,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::registry::init`,
        arguments: [],
    })
}

export interface MigrateArgs {
    registry: TransactionObjectInput; admin: TransactionObjectInput
}

export function migrate(
    tx: Transaction,
    args: MigrateArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::registry::migrate`,
        arguments: [
            obj(tx, args.registry), obj(tx, args.admin)
        ],
    })
}

export interface RegisterBankArgs {
    registry: TransactionObjectInput; bankId: string | TransactionArgument; coinType: TransactionObjectInput; btokenType: TransactionObjectInput; lendingMarketId: string | TransactionArgument; lendingMarketType: TransactionObjectInput
}

export function registerBank(
    tx: Transaction,
    args: RegisterBankArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::registry::register_bank`,
        arguments: [
            obj(tx, args.registry), pure(tx, args.bankId, `${ID.$typeName}`), obj(tx, args.coinType), obj(tx, args.btokenType), pure(tx, args.lendingMarketId, `${ID.$typeName}`), obj(tx, args.lendingMarketType)
        ],
    })
}

export interface RegisterPoolArgs {
    registry: TransactionObjectInput; poolId: string | TransactionArgument; coinTypeA: TransactionObjectInput; coinTypeB: TransactionObjectInput; lpTokenType: TransactionObjectInput; swapFeeBps: bigint | TransactionArgument; quoterType: TransactionObjectInput
}

export function registerPool(
    tx: Transaction,
    args: RegisterPoolArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::registry::register_pool`,
        arguments: [
            obj(tx, args.registry), pure(tx, args.poolId, `${ID.$typeName}`), obj(tx, args.coinTypeA), obj(tx, args.coinTypeB), obj(tx, args.lpTokenType), pure(tx, args.swapFeeBps, `u64`), obj(tx, args.quoterType)
        ],
    })
}
