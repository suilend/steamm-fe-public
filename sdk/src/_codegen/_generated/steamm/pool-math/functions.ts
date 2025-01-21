import { PUBLISHED_AT } from "..";
import { pure } from "../../_framework/util";
import { Transaction, TransactionArgument } from "@mysten/sui/transactions";

export interface AssertLpSupplyReserveRatioArgs {
  initialReserveA: bigint | TransactionArgument;
  initialLpSupply: bigint | TransactionArgument;
  finalReserveA: bigint | TransactionArgument;
  finalLpSupply: bigint | TransactionArgument;
}

export function assertLpSupplyReserveRatio(
  tx: Transaction,
  args: AssertLpSupplyReserveRatioArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool_math::assert_lp_supply_reserve_ratio`,
    arguments: [
      pure(tx, args.initialReserveA, `u64`),
      pure(tx, args.initialLpSupply, `u64`),
      pure(tx, args.finalReserveA, `u64`),
      pure(tx, args.finalLpSupply, `u64`),
    ],
  });
}

export interface LpTokensToMintArgs {
  reserveA: bigint | TransactionArgument;
  reserveB: bigint | TransactionArgument;
  lpSupply: bigint | TransactionArgument;
  amountA: bigint | TransactionArgument;
  amountB: bigint | TransactionArgument;
}

export function lpTokensToMint(
  tx: Transaction,
  args: LpTokensToMintArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool_math::lp_tokens_to_mint`,
    arguments: [
      pure(tx, args.reserveA, `u64`),
      pure(tx, args.reserveB, `u64`),
      pure(tx, args.lpSupply, `u64`),
      pure(tx, args.amountA, `u64`),
      pure(tx, args.amountB, `u64`),
    ],
  });
}

export interface QuoteDepositArgs {
  reserveA: bigint | TransactionArgument;
  reserveB: bigint | TransactionArgument;
  lpSupply: bigint | TransactionArgument;
  maxA: bigint | TransactionArgument;
  maxB: bigint | TransactionArgument;
}

export function quoteDeposit(
  tx: Transaction,
  args: QuoteDepositArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool_math::quote_deposit`,
    arguments: [
      pure(tx, args.reserveA, `u64`),
      pure(tx, args.reserveB, `u64`),
      pure(tx, args.lpSupply, `u64`),
      pure(tx, args.maxA, `u64`),
      pure(tx, args.maxB, `u64`),
    ],
  });
}

export interface QuoteRedeemArgs {
  reserveA: bigint | TransactionArgument;
  reserveB: bigint | TransactionArgument;
  lpSupply: bigint | TransactionArgument;
  lpTokens: bigint | TransactionArgument;
  minA: bigint | TransactionArgument;
  minB: bigint | TransactionArgument;
}

export function quoteRedeem(
  tx: Transaction,
  args: QuoteRedeemArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool_math::quote_redeem`,
    arguments: [
      pure(tx, args.reserveA, `u64`),
      pure(tx, args.reserveB, `u64`),
      pure(tx, args.lpSupply, `u64`),
      pure(tx, args.lpTokens, `u64`),
      pure(tx, args.minA, `u64`),
      pure(tx, args.minB, `u64`),
    ],
  });
}

export interface TokensToDepositArgs {
  reserveA: bigint | TransactionArgument;
  reserveB: bigint | TransactionArgument;
  maxA: bigint | TransactionArgument;
  maxB: bigint | TransactionArgument;
}

export function tokensToDeposit(
  tx: Transaction,
  args: TokensToDepositArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool_math::tokens_to_deposit`,
    arguments: [
      pure(tx, args.reserveA, `u64`),
      pure(tx, args.reserveB, `u64`),
      pure(tx, args.maxA, `u64`),
      pure(tx, args.maxB, `u64`),
    ],
  });
}
