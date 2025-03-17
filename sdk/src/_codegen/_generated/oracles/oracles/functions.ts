import { PUBLISHED_AT } from "..";
import { obj, pure } from "../../_framework/util";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export function metadata(
  tx: Transaction,
  priceUpdate: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::metadata`,
    arguments: [obj(tx, priceUpdate)],
  });
}

export function price(
  tx: Transaction,
  priceUpdate: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::price`,
    arguments: [obj(tx, priceUpdate)],
  });
}

export function init(tx: Transaction, publishedAt: string = PUBLISHED_AT) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::init`,
    arguments: [],
  });
}

export function emaPrice(
  tx: Transaction,
  priceUpdate: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::ema_price`,
    arguments: [obj(tx, priceUpdate)],
  });
}

export interface AddPythOracleArgs {
  registry: TransactionObjectInput;
  adminCap: TransactionObjectInput;
  priceInfoObj: TransactionObjectInput;
}

export function addPythOracle(
  tx: Transaction,
  args: AddPythOracleArgs,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::add_pyth_oracle`,
    arguments: [
      obj(tx, args.registry),
      obj(tx, args.adminCap),
      obj(tx, args.priceInfoObj),
    ],
  });
}

export interface AddSwitchboardOracleArgs {
  registry: TransactionObjectInput;
  adminCap: TransactionObjectInput;
  aggregator: TransactionObjectInput;
}

export function addSwitchboardOracle(
  tx: Transaction,
  args: AddSwitchboardOracleArgs,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::add_switchboard_oracle`,
    arguments: [
      obj(tx, args.registry),
      obj(tx, args.adminCap),
      obj(tx, args.aggregator),
    ],
  });
}

export interface GetPythPriceArgs {
  registry: TransactionObjectInput;
  priceInfoObj: TransactionObjectInput;
  oracleIndex: bigint | TransactionArgument;
  clock: TransactionObjectInput;
}

export function getPythPrice(
  tx: Transaction,
  args: GetPythPriceArgs,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::get_pyth_price`,
    arguments: [
      obj(tx, args.registry),
      obj(tx, args.priceInfoObj),
      pure(tx, args.oracleIndex, `u64`),
      obj(tx, args.clock),
    ],
  });
}

export function oracleIndex(
  tx: Transaction,
  priceUpdate: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::oracle_index`,
    arguments: [obj(tx, priceUpdate)],
  });
}

export interface GetSwitchboardPriceArgs {
  registry: TransactionObjectInput;
  aggregator: TransactionObjectInput;
  oracleIndex: bigint | TransactionArgument;
  clock: TransactionObjectInput;
}

export function getSwitchboardPrice(
  tx: Transaction,
  args: GetSwitchboardPriceArgs,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::get_switchboard_price`,
    arguments: [
      obj(tx, args.registry),
      obj(tx, args.aggregator),
      pure(tx, args.oracleIndex, `u64`),
      obj(tx, args.clock),
    ],
  });
}

export function metadataPyth(
  tx: Transaction,
  oracleMetadata: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::metadata_pyth`,
    arguments: [obj(tx, oracleMetadata)],
  });
}

export function metadataSwitchboard(
  tx: Transaction,
  oracleMetadata: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::metadata_switchboard`,
    arguments: [obj(tx, oracleMetadata)],
  });
}

export interface NewOracleRegistryConfigArgs {
  pythMaxStalenessThresholdS: bigint | TransactionArgument;
  pythMaxConfidenceIntervalPct: bigint | TransactionArgument;
  switchboardMaxStalenessThresholdS: bigint | TransactionArgument;
  switchboardMaxConfidenceIntervalPct: bigint | TransactionArgument;
}

export function newOracleRegistryConfig(
  tx: Transaction,
  args: NewOracleRegistryConfigArgs,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::new_oracle_registry_config`,
    arguments: [
      pure(tx, args.pythMaxStalenessThresholdS, `u64`),
      pure(tx, args.pythMaxConfidenceIntervalPct, `u64`),
      pure(tx, args.switchboardMaxStalenessThresholdS, `u64`),
      pure(tx, args.switchboardMaxConfidenceIntervalPct, `u64`),
    ],
  });
}

export function oracleRegistryId(
  tx: Transaction,
  priceUpdate: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::oracle_registry_id`,
    arguments: [obj(tx, priceUpdate)],
  });
}

export interface SetPythOracleArgs {
  registry: TransactionObjectInput;
  adminCap: TransactionObjectInput;
  priceInfoObj: TransactionObjectInput;
  oracleIndex: bigint | TransactionArgument;
}

export function setPythOracle(
  tx: Transaction,
  args: SetPythOracleArgs,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::set_pyth_oracle`,
    arguments: [
      obj(tx, args.registry),
      obj(tx, args.adminCap),
      obj(tx, args.priceInfoObj),
      pure(tx, args.oracleIndex, `u64`),
    ],
  });
}

export interface SetSwitchboardOracleArgs {
  registry: TransactionObjectInput;
  adminCap: TransactionObjectInput;
  aggregator: TransactionObjectInput;
  oracleIndex: bigint | TransactionArgument;
}

export function setSwitchboardOracle(
  tx: Transaction,
  args: SetSwitchboardOracleArgs,
  publishedAt: string = PUBLISHED_AT,
) {
  return tx.moveCall({
    target: `${publishedAt}::oracles::set_switchboard_oracle`,
    arguments: [
      obj(tx, args.registry),
      obj(tx, args.adminCap),
      obj(tx, args.aggregator),
      pure(tx, args.oracleIndex, `u64`),
    ],
  });
}
