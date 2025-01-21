import { PUBLISHED_AT } from "..";
import { obj, pure } from "../../_framework/util";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export interface QuoteArgs {
  amountIn: bigint | TransactionArgument;
  amountOut: bigint | TransactionArgument;
  protocolFees: bigint | TransactionArgument;
  poolFees: bigint | TransactionArgument;
  a2B: boolean | TransactionArgument;
}

export function quote(
  tx: Transaction,
  args: QuoteArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::quote`,
    arguments: [
      pure(tx, args.amountIn, `u64`),
      pure(tx, args.amountOut, `u64`),
      pure(tx, args.protocolFees, `u64`),
      pure(tx, args.poolFees, `u64`),
      pure(tx, args.a2B, `bool`),
    ],
  });
}

export function a2b(
  tx: Transaction,
  swapQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::a2b`,
    arguments: [obj(tx, swapQuote)],
  });
}

export interface AddExtraFeesArgs {
  swapQuote: TransactionObjectInput;
  protocolFees: bigint | TransactionArgument;
  poolFees: bigint | TransactionArgument;
}

export function addExtraFees(
  tx: Transaction,
  args: AddExtraFeesArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::add_extra_fees`,
    arguments: [
      obj(tx, args.swapQuote),
      pure(tx, args.protocolFees, `u64`),
      pure(tx, args.poolFees, `u64`),
    ],
  });
}

export function protocolFees(
  tx: Transaction,
  swapFee: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::protocol_fees`,
    arguments: [obj(tx, swapFee)],
  });
}

export function poolFees(
  tx: Transaction,
  swapFee: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::pool_fees`,
    arguments: [obj(tx, swapFee)],
  });
}

export function amountIn(
  tx: Transaction,
  swapQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::amount_in`,
    arguments: [obj(tx, swapQuote)],
  });
}

export function amountOut(
  tx: Transaction,
  swapQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::amount_out`,
    arguments: [obj(tx, swapQuote)],
  });
}

export function amountOutNet(
  tx: Transaction,
  swapQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::amount_out_net`,
    arguments: [obj(tx, swapQuote)],
  });
}

export function amountOutNetOfPoolFees(
  tx: Transaction,
  swapQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::amount_out_net_of_pool_fees`,
    arguments: [obj(tx, swapQuote)],
  });
}

export function amountOutNetOfProtocolFees(
  tx: Transaction,
  swapQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::amount_out_net_of_protocol_fees`,
    arguments: [obj(tx, swapQuote)],
  });
}

export function burnLp(
  tx: Transaction,
  redeemQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::burn_lp`,
    arguments: [obj(tx, redeemQuote)],
  });
}

export interface RedeemQuoteArgs {
  withdrawA: bigint | TransactionArgument;
  withdrawB: bigint | TransactionArgument;
  feesA: bigint | TransactionArgument;
  feesB: bigint | TransactionArgument;
  burnLp: bigint | TransactionArgument;
}

export function redeemQuote(
  tx: Transaction,
  args: RedeemQuoteArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::redeem_quote`,
    arguments: [
      pure(tx, args.withdrawA, `u64`),
      pure(tx, args.withdrawB, `u64`),
      pure(tx, args.feesA, `u64`),
      pure(tx, args.feesB, `u64`),
      pure(tx, args.burnLp, `u64`),
    ],
  });
}

export function depositA(
  tx: Transaction,
  depositQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::deposit_a`,
    arguments: [obj(tx, depositQuote)],
  });
}

export interface DepositQuoteArgs {
  initialDeposit: boolean | TransactionArgument;
  depositA: bigint | TransactionArgument;
  depositB: bigint | TransactionArgument;
  mintLp: bigint | TransactionArgument;
}

export function depositQuote(
  tx: Transaction,
  args: DepositQuoteArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::deposit_quote`,
    arguments: [
      pure(tx, args.initialDeposit, `bool`),
      pure(tx, args.depositA, `u64`),
      pure(tx, args.depositB, `u64`),
      pure(tx, args.mintLp, `u64`),
    ],
  });
}

export function depositB(
  tx: Transaction,
  depositQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::deposit_b`,
    arguments: [obj(tx, depositQuote)],
  });
}

export function initialDeposit(
  tx: Transaction,
  depositQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::initial_deposit`,
    arguments: [obj(tx, depositQuote)],
  });
}

export function mintLp(
  tx: Transaction,
  depositQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::mint_lp`,
    arguments: [obj(tx, depositQuote)],
  });
}

export function outputFeeRate(
  tx: Transaction,
  swapQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::output_fee_rate`,
    arguments: [obj(tx, swapQuote)],
  });
}

export function outputFees(
  tx: Transaction,
  swapQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::output_fees`,
    arguments: [obj(tx, swapQuote)],
  });
}

export function withdrawA(
  tx: Transaction,
  redeemQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::withdraw_a`,
    arguments: [obj(tx, redeemQuote)],
  });
}

export function withdrawB(
  tx: Transaction,
  redeemQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::withdraw_b`,
    arguments: [obj(tx, redeemQuote)],
  });
}

export function redemptionFeeA(
  tx: Transaction,
  redeemQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::redemption_fee_a`,
    arguments: [obj(tx, redeemQuote)],
  });
}

export function redemptionFeeB(
  tx: Transaction,
  redeemQuote: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::quote::redemption_fee_b`,
    arguments: [obj(tx, redeemQuote)],
  });
}
