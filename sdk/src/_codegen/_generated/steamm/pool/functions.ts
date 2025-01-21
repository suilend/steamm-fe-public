import { PUBLISHED_AT } from "..";
import { GenericArg, generic, obj, pure } from "../../_framework/util";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export interface NewArgs {
  registry: TransactionObjectInput;
  swapFeeBps: bigint | TransactionArgument;
  quoter: GenericArg;
  metaA: TransactionObjectInput;
  metaB: TransactionObjectInput;
  metaLp: TransactionObjectInput;
  lpTreasury: TransactionObjectInput;
}

export function new_(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: NewArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::new`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.registry),
      pure(tx, args.swapFeeBps, `u64`),
      generic(tx, `${typeArgs[2]}`, args.quoter),
      obj(tx, args.metaA),
      obj(tx, args.metaB),
      obj(tx, args.metaLp),
      obj(tx, args.lpTreasury),
    ],
  });
}

export interface SwapArgs {
  pool: TransactionObjectInput;
  coinA: TransactionObjectInput;
  coinB: TransactionObjectInput;
  quote: TransactionObjectInput;
  minAmountOut: bigint | TransactionArgument;
}

export function swap(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: SwapArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::swap`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      obj(tx, args.coinA),
      obj(tx, args.coinB),
      obj(tx, args.quote),
      pure(tx, args.minAmountOut, `u64`),
    ],
  });
}

export interface MigrateArgs {
  pool: TransactionObjectInput;
  admin: TransactionObjectInput;
}

export function migrate(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: MigrateArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::migrate`,
    typeArguments: typeArgs,
    arguments: [obj(tx, args.pool), obj(tx, args.admin)],
  });
}

export function protocolFees(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  pool: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::protocol_fees`,
    typeArguments: typeArgs,
    arguments: [obj(tx, pool)],
  });
}

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
    target: `${publishedAt}::pool::assert_lp_supply_reserve_ratio`,
    arguments: [
      pure(tx, args.initialReserveA, `u64`),
      pure(tx, args.initialLpSupply, `u64`),
      pure(tx, args.finalReserveA, `u64`),
      pure(tx, args.finalLpSupply, `u64`),
    ],
  });
}

export interface QuoteDepositArgs {
  pool: TransactionObjectInput;
  maxA: bigint | TransactionArgument;
  maxB: bigint | TransactionArgument;
}

export function quoteDeposit(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: QuoteDepositArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::quote_deposit`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      pure(tx, args.maxA, `u64`),
      pure(tx, args.maxB, `u64`),
    ],
  });
}

export interface QuoteRedeemArgs {
  pool: TransactionObjectInput;
  lpTokens: bigint | TransactionArgument;
}

export function quoteRedeem(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: QuoteRedeemArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::quote_redeem`,
    typeArguments: typeArgs,
    arguments: [obj(tx, args.pool), pure(tx, args.lpTokens, `u64`)],
  });
}

export interface AssertLiquidityArgs {
  reserveOut: bigint | TransactionArgument;
  amountOut: bigint | TransactionArgument;
}

export function assertLiquidity(
  tx: Transaction,
  args: AssertLiquidityArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::assert_liquidity`,
    arguments: [
      pure(tx, args.reserveOut, `u64`),
      pure(tx, args.amountOut, `u64`),
    ],
  });
}

export function balanceAmountA(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  pool: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::balance_amount_a`,
    typeArguments: typeArgs,
    arguments: [obj(tx, pool)],
  });
}

export function balanceAmountB(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  pool: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::balance_amount_b`,
    typeArguments: typeArgs,
    arguments: [obj(tx, pool)],
  });
}

export function balanceAmounts(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  pool: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::balance_amounts`,
    typeArguments: typeArgs,
    arguments: [obj(tx, pool)],
  });
}

export interface CollectProtocolFeesArgs {
  pool: TransactionObjectInput;
  globalAdmin: TransactionObjectInput;
}

export function collectProtocolFees(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: CollectProtocolFeesArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::collect_protocol_fees`,
    typeArguments: typeArgs,
    arguments: [obj(tx, args.pool), obj(tx, args.globalAdmin)],
  });
}

export interface CollectRedemptionFeesArgs {
  pool: TransactionObjectInput;
  cap: TransactionObjectInput;
}

export function collectRedemptionFees(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: CollectRedemptionFeesArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::collect_redemption_fees`,
    typeArguments: typeArgs,
    arguments: [obj(tx, args.pool), obj(tx, args.cap)],
  });
}

export interface ComputeRedemptionFees_Args {
  pool: TransactionObjectInput;
  amountA: bigint | TransactionArgument;
  amountB: bigint | TransactionArgument;
}

export function computeRedemptionFees_(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: ComputeRedemptionFees_Args,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::compute_redemption_fees_`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      pure(tx, args.amountA, `u64`),
      pure(tx, args.amountB, `u64`),
    ],
  });
}

export interface ComputeSwapFees_Args {
  pool: TransactionObjectInput;
  amount: bigint | TransactionArgument;
}

export function computeSwapFees_(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: ComputeSwapFees_Args,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::compute_swap_fees_`,
    typeArguments: typeArgs,
    arguments: [obj(tx, args.pool), pure(tx, args.amount, `u64`)],
  });
}

export interface DepositLiquidityArgs {
  pool: TransactionObjectInput;
  coinA: TransactionObjectInput;
  coinB: TransactionObjectInput;
  maxA: bigint | TransactionArgument;
  maxB: bigint | TransactionArgument;
}

export function depositLiquidity(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: DepositLiquidityArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::deposit_liquidity`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      obj(tx, args.coinA),
      obj(tx, args.coinB),
      pure(tx, args.maxA, `u64`),
      pure(tx, args.maxB, `u64`),
    ],
  });
}

export function depositResultDepositA(
  tx: Transaction,
  depositResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::deposit_result_deposit_a`,
    arguments: [obj(tx, depositResult)],
  });
}

export function depositResultDepositB(
  tx: Transaction,
  depositResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::deposit_result_deposit_b`,
    arguments: [obj(tx, depositResult)],
  });
}

export function depositResultMintLp(
  tx: Transaction,
  depositResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::deposit_result_mint_lp`,
    arguments: [obj(tx, depositResult)],
  });
}

export function depositResultPoolId(
  tx: Transaction,
  depositResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::deposit_result_pool_id`,
    arguments: [obj(tx, depositResult)],
  });
}

export function depositResultUser(
  tx: Transaction,
  depositResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::deposit_result_user`,
    arguments: [obj(tx, depositResult)],
  });
}

export interface GetQuoteArgs {
  pool: TransactionObjectInput;
  amountIn: bigint | TransactionArgument;
  amountOut: bigint | TransactionArgument;
  a2B: boolean | TransactionArgument;
}

export function getQuote(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: GetQuoteArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::get_quote`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      pure(tx, args.amountIn, `u64`),
      pure(tx, args.amountOut, `u64`),
      pure(tx, args.a2B, `bool`),
    ],
  });
}

export function lpSupplyVal(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  pool: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::lp_supply_val`,
    typeArguments: typeArgs,
    arguments: [obj(tx, pool)],
  });
}

export function minimumLiquidity(
  tx: Transaction,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::minimum_liquidity`,
    arguments: [],
  });
}

export function quoter(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  pool: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::quoter`,
    typeArguments: typeArgs,
    arguments: [obj(tx, pool)],
  });
}

export function poolFeeConfig(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  pool: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::pool_fee_config`,
    typeArguments: typeArgs,
    arguments: [obj(tx, pool)],
  });
}

export function poolFeesA(
  tx: Transaction,
  tradingData: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::pool_fees_a`,
    arguments: [obj(tx, tradingData)],
  });
}

export function tradingData(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  pool: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::trading_data`,
    typeArguments: typeArgs,
    arguments: [obj(tx, pool)],
  });
}

export function poolFeesB(
  tx: Transaction,
  tradingData: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::pool_fees_b`,
    arguments: [obj(tx, tradingData)],
  });
}

export function protocolFeesA(
  tx: Transaction,
  tradingData: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::protocol_fees_a`,
    arguments: [obj(tx, tradingData)],
  });
}

export function protocolFeesB(
  tx: Transaction,
  tradingData: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::protocol_fees_b`,
    arguments: [obj(tx, tradingData)],
  });
}

export interface QuoteDeposit_Args {
  pool: TransactionObjectInput;
  maxA: bigint | TransactionArgument;
  maxB: bigint | TransactionArgument;
}

export function quoteDeposit_(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: QuoteDeposit_Args,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::quote_deposit_`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      pure(tx, args.maxA, `u64`),
      pure(tx, args.maxB, `u64`),
    ],
  });
}

export interface QuoteRedeem_Args {
  pool: TransactionObjectInput;
  lpTokens: bigint | TransactionArgument;
  minA: bigint | TransactionArgument;
  minB: bigint | TransactionArgument;
}

export function quoteRedeem_(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: QuoteRedeem_Args,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::quote_redeem_`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      pure(tx, args.lpTokens, `u64`),
      pure(tx, args.minA, `u64`),
      pure(tx, args.minB, `u64`),
    ],
  });
}

export function quoterMut(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  pool: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::quoter_mut`,
    typeArguments: typeArgs,
    arguments: [obj(tx, pool)],
  });
}

export interface RedeemLiquidityArgs {
  pool: TransactionObjectInput;
  lpTokens: TransactionObjectInput;
  minA: bigint | TransactionArgument;
  minB: bigint | TransactionArgument;
}

export function redeemLiquidity(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: RedeemLiquidityArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::redeem_liquidity`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      obj(tx, args.lpTokens),
      pure(tx, args.minA, `u64`),
      pure(tx, args.minB, `u64`),
    ],
  });
}

export function redeemResultBurnLp(
  tx: Transaction,
  redeemResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::redeem_result_burn_lp`,
    arguments: [obj(tx, redeemResult)],
  });
}

export function redeemResultPoolId(
  tx: Transaction,
  redeemResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::redeem_result_pool_id`,
    arguments: [obj(tx, redeemResult)],
  });
}

export function redeemResultUser(
  tx: Transaction,
  redeemResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::redeem_result_user`,
    arguments: [obj(tx, redeemResult)],
  });
}

export function redeemResultWithdrawA(
  tx: Transaction,
  redeemResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::redeem_result_withdraw_a`,
    arguments: [obj(tx, redeemResult)],
  });
}

export function redeemResultWithdrawB(
  tx: Transaction,
  redeemResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::redeem_result_withdraw_b`,
    arguments: [obj(tx, redeemResult)],
  });
}

export interface SetPoolSwapFeesArgs {
  pool: TransactionObjectInput;
  poolCap: TransactionObjectInput;
  swapFeeBps: bigint | TransactionArgument;
}

export function setPoolSwapFees(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: SetPoolSwapFeesArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::set_pool_swap_fees`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      obj(tx, args.poolCap),
      pure(tx, args.swapFeeBps, `u64`),
    ],
  });
}

export interface SetRedemptionFeesArgs {
  pool: TransactionObjectInput;
  poolCap: TransactionObjectInput;
  redemptionFeeBps: bigint | TransactionArgument;
}

export function setRedemptionFees(
  tx: Transaction,
  typeArgs: [string, string, string, string],
  args: SetRedemptionFeesArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::set_redemption_fees`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.pool),
      obj(tx, args.poolCap),
      pure(tx, args.redemptionFeeBps, `u64`),
    ],
  });
}

export interface SwapInnerArgs {
  quote: TransactionObjectInput;
  reserveIn: TransactionObjectInput;
  coinIn: TransactionObjectInput;
  lifetimeInAmount: bigint | TransactionArgument;
  protocolFeeBalance: TransactionObjectInput;
  reserveOut: TransactionObjectInput;
  coinOut: TransactionObjectInput;
  lifetimeOutAmount: bigint | TransactionArgument;
  lifetimeProtocolFee: bigint | TransactionArgument;
  lifetimePoolFee: bigint | TransactionArgument;
}

export function swapInner(
  tx: Transaction,
  typeArgs: [string, string],
  args: SwapInnerArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::swap_inner`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.quote),
      obj(tx, args.reserveIn),
      obj(tx, args.coinIn),
      pure(tx, args.lifetimeInAmount, `u128`),
      obj(tx, args.protocolFeeBalance),
      obj(tx, args.reserveOut),
      obj(tx, args.coinOut),
      pure(tx, args.lifetimeOutAmount, `u128`),
      pure(tx, args.lifetimeProtocolFee, `u64`),
      pure(tx, args.lifetimePoolFee, `u64`),
    ],
  });
}

export function swapResultA2b(
  tx: Transaction,
  swapResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::swap_result_a2b`,
    arguments: [obj(tx, swapResult)],
  });
}

export function swapResultAmountIn(
  tx: Transaction,
  swapResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::swap_result_amount_in`,
    arguments: [obj(tx, swapResult)],
  });
}

export function swapResultAmountOut(
  tx: Transaction,
  swapResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::swap_result_amount_out`,
    arguments: [obj(tx, swapResult)],
  });
}

export function swapResultPoolFees(
  tx: Transaction,
  swapResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::swap_result_pool_fees`,
    arguments: [obj(tx, swapResult)],
  });
}

export function swapResultPoolId(
  tx: Transaction,
  swapResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::swap_result_pool_id`,
    arguments: [obj(tx, swapResult)],
  });
}

export function swapResultProtocolFees(
  tx: Transaction,
  swapResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::swap_result_protocol_fees`,
    arguments: [obj(tx, swapResult)],
  });
}

export function swapResultUser(
  tx: Transaction,
  swapResult: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::swap_result_user`,
    arguments: [obj(tx, swapResult)],
  });
}

export function totalSwapAInAmount(
  tx: Transaction,
  tradingData: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::total_swap_a_in_amount`,
    arguments: [obj(tx, tradingData)],
  });
}

export function totalSwapAOutAmount(
  tx: Transaction,
  tradingData: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::total_swap_a_out_amount`,
    arguments: [obj(tx, tradingData)],
  });
}

export function totalSwapBInAmount(
  tx: Transaction,
  tradingData: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::total_swap_b_in_amount`,
    arguments: [obj(tx, tradingData)],
  });
}

export function totalSwapBOutAmount(
  tx: Transaction,
  tradingData: TransactionObjectInput,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::total_swap_b_out_amount`,
    arguments: [obj(tx, tradingData)],
  });
}

export interface UpdateLpMetadataArgs {
  metaA: TransactionObjectInput;
  metaB: TransactionObjectInput;
  metaLp: TransactionObjectInput;
  treasuryLp: TransactionObjectInput;
}

export function updateLpMetadata(
  tx: Transaction,
  typeArgs: [string, string, string],
  args: UpdateLpMetadataArgs,
  publishedAt: string = PUBLISHED_AT
) {
  return tx.moveCall({
    target: `${publishedAt}::pool::update_lp_metadata`,
    typeArguments: typeArgs,
    arguments: [
      obj(tx, args.metaA),
      obj(tx, args.metaB),
      obj(tx, args.metaLp),
      obj(tx, args.treasuryLp),
    ],
  });
}
