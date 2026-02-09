import {PUBLISHED_AT} from "..";
import {Transaction} from "@mysten/sui-v1/transactions";

export function getTypeReflection(
    tx: Transaction,
    typeArg: string,
    publishedAt: string = PUBLISHED_AT
) {
    return tx.moveCall({
        target: `${publishedAt}::utils::get_type_reflection`,
        typeArguments: [typeArg],
        arguments: [],
    })
}
