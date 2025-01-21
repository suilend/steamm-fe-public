import {PUBLISHED_AT} from "..";
import {Transaction} from "@mysten/sui/transactions";

export function getTypeReflection( tx: Transaction, typeArg: string, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::utils::get_type_reflection`, typeArguments: [typeArg], arguments: [ ], }) }
