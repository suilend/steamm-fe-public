import { PUBLISHED_AT } from "..";
import { Transaction } from "@mysten/sui/transactions";

export function init(tx: Transaction, publishedAt: string = PUBLISHED_AT) {
  return tx.moveCall({
    target: `${publishedAt}::global_admin::init`,
    arguments: [],
  });
}
