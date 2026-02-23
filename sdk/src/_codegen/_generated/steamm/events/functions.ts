import {PUBLISHED_AT} from "..";
import {GenericArg, generic} from "../../_framework/util";
import {Transaction} from "@mysten/sui/transactions";

export function emitEvent(
    tx: Transaction,
    typeArg: string,
    event: GenericArg,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::events::emit_event`,
        typeArguments: [typeArg],
        arguments: [
            generic(tx, `${typeArg}`, event)
        ],
    })
}
