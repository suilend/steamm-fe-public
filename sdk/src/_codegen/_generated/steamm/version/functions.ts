import { PUBLISHED_AT } from "..";
import { obj, pure } from "../../_framework/util";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export interface AssertVersionArgs {
  version: TransactionObjectInput;
  currentVersion: number | TransactionArgument;
}

export function assertVersion(
  tx: Transaction,
  args: AssertVersionArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::version::assert_version`,
    arguments: [obj(tx, args.version), pure(tx, args.currentVersion, `u16`)],
  });
}

export interface AssertVersionAndUpgradeArgs {
  version: TransactionObjectInput;
  currentVersion: number | TransactionArgument;
}

export function assertVersionAndUpgrade(
  tx: Transaction,
  args: AssertVersionAndUpgradeArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::version::assert_version_and_upgrade`,
    arguments: [obj(tx, args.version), pure(tx, args.currentVersion, `u16`)],
  });
}

export interface Migrate_Args {
  version: TransactionObjectInput;
  currentVersion: number | TransactionArgument;
}

export function migrate_(
  tx: Transaction,
  args: Migrate_Args,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::version::migrate_`,
    arguments: [obj(tx, args.version), pure(tx, args.currentVersion, `u16`)],
  });
}

export function new_(
  tx: Transaction,
  version: number | TransactionArgument,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::version::new`,
    arguments: [pure(tx, version, `u16`)],
  });
}
