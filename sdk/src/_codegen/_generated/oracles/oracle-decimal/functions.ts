import {PUBLISHED_AT} from "..";
import {obj, pure} from "../../_framework/util";
import {Transaction, TransactionArgument, TransactionObjectInput} from "@mysten/sui/transactions";

export interface NewArgs { base: bigint | TransactionArgument; expo: bigint | TransactionArgument; isExpoNegative: boolean | TransactionArgument }

export function new_( tx: Transaction, args: NewArgs, publishedAt: string = PUBLISHED_AT ) { return tx.moveCall({ target: `${publishedAt}::oracle_decimal::new`, arguments: [ pure(tx, args.base, `u128`), pure(tx, args.expo, `u64`), pure(tx, args.isExpoNegative, `bool`) ], }) }

export function base( tx: Transaction, decimal: TransactionObjectInput, publishedAt: string = PUBLISHED_AT ) { return tx.moveCall({ target: `${publishedAt}::oracle_decimal::base`, arguments: [ obj(tx, decimal) ], }) }

export function expo( tx: Transaction, decimal: TransactionObjectInput, publishedAt: string = PUBLISHED_AT ) { return tx.moveCall({ target: `${publishedAt}::oracle_decimal::expo`, arguments: [ obj(tx, decimal) ], }) }

export function isExpoNegative( tx: Transaction, decimal: TransactionObjectInput, publishedAt: string = PUBLISHED_AT ) { return tx.moveCall({ target: `${publishedAt}::oracle_decimal::is_expo_negative`, arguments: [ obj(tx, decimal) ], }) }
