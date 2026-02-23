import {PUBLISHED_AT} from "..";
import {obj} from "../../_framework/util";
import {Transaction, TransactionObjectInput} from "@mysten/sui/transactions";

export interface NeedsRebalanceArgs {
    bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; clock: TransactionObjectInput
}

export function needsRebalance(
    tx: Transaction,
    typeArgs: [string, string, string],
    args: NeedsRebalanceArgs,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::bank_script::needs_rebalance`,
        typeArguments: typeArgs,
        arguments: [
            obj(tx, args.bank), obj(tx, args.lendingMarket), obj(tx, args.clock)
        ],
    })
}
