import {PUBLISHED_AT} from "..";
import {ID} from "../../_dependencies/source/0x2/object/structs";
import {obj, pure} from "../../_framework/util";
import {Transaction, TransactionArgument, TransactionObjectInput} from "@mysten/sui/transactions";

export interface GetPriceArgs { switchboardFeed: TransactionObjectInput; clock: TransactionObjectInput; maxStalenessS: bigint | TransactionArgument; maxConfidenceIntervalPct: bigint | TransactionArgument; expectedFeedId: string | TransactionArgument }

export function getPrice( tx: Transaction, args: GetPriceArgs, publishedAt: string = PUBLISHED_AT ) { return tx.moveCall({ target: `${publishedAt}::switchboard::get_price`, arguments: [ obj(tx, args.switchboardFeed), obj(tx, args.clock), pure(tx, args.maxStalenessS, `u64`), pure(tx, args.maxConfidenceIntervalPct, `u64`), pure(tx, args.expectedFeedId, `${ID.$typeName}`) ], }) }

export function fromSwitchboardDecimal( tx: Transaction, d: TransactionObjectInput, publishedAt: string = PUBLISHED_AT ) { return tx.moveCall({ target: `${publishedAt}::switchboard::from_switchboard_decimal`, arguments: [ obj(tx, d) ], }) }
