import {PUBLISHED_AT} from "..";
import {obj, pure} from "../../_framework/util";
import {Transaction, TransactionArgument, TransactionObjectInput} from "@mysten/sui/transactions";

export function fromPythPrice( tx: Transaction, price: TransactionObjectInput, publishedAt: string = PUBLISHED_AT ) { return tx.moveCall({ target: `${publishedAt}::pyth::from_pyth_price`, arguments: [ obj(tx, price) ], }) }

export interface GetPricesArgs { priceInfoObj: TransactionObjectInput; clock: TransactionObjectInput; maxStalenessThresholdS: bigint | TransactionArgument; maxConfidenceIntervalPct: bigint | TransactionArgument; expectedPriceIdentifier: TransactionObjectInput }

export function getPrices( tx: Transaction, args: GetPricesArgs, publishedAt: string = PUBLISHED_AT ) { return tx.moveCall({ target: `${publishedAt}::pyth::get_prices`, arguments: [ obj(tx, args.priceInfoObj), obj(tx, args.clock), pure(tx, args.maxStalenessThresholdS, `u64`), pure(tx, args.maxConfidenceIntervalPct, `u64`), obj(tx, args.expectedPriceIdentifier) ], }) }
