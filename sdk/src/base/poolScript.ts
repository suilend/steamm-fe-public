import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

import { PoolScriptFunctions } from "../_codegen";
import { BankInfo, PoolInfo } from "../types";

import { Bank } from "./bank";
import {
  Pool,
  PoolDepositLiquidityArgs,
  PoolQuoteDepositArgs,
  PoolQuoteRedeemArgs,
  PoolQuoteSwapArgs,
  PoolRedeemLiquidityArgs,
  PoolSwapArgs,
} from "./pool";

export class PoolScript {
  public packageId: string;
  public pool: Pool;
  public bankA: Bank;
  public bankB: Bank;

  constructor(
    packageId: string,
    poolInfo: PoolInfo,
    bankInfoA: BankInfo,
    bankInfoB: BankInfo,
  ) {
    this.pool = new Pool(packageId, poolInfo);
    this.bankA = new Bank(packageId, bankInfoA);
    this.bankB = new Bank(packageId, bankInfoB);
    this.packageId = packageId;

    const [bTokenAType, bTokenBType, _quoterType, _lpTokenType] =
      this.pool.poolTypes();
    const [lendingMarketType, _coinTypeA, _bTokenAType] = this.bankA.typeArgs();
    const [_lendingMarketType, _coinTypeB, _bTokenBType] =
      this.bankB.typeArgs();

    if (lendingMarketType !== _lendingMarketType) {
      throw new Error(
        `Lending market mismatch: ${lendingMarketType} !== ${_lendingMarketType}`,
      );
    }

    if (bTokenAType !== _bTokenAType) {
      throw new Error(
        `BTokenType A mismatch: ${bTokenAType} !== ${_bTokenAType}`,
      );
    }

    if (bTokenBType !== _bTokenBType) {
      throw new Error(
        `BTokenType B mismatch: ${bTokenBType} !== ${_bTokenBType}`,
      );
    }
  }

  //   public swap(args: PoolSwapArgs, tx: Transaction): TransactionResult {
  //     return this.quoter.swap(args, tx);
  //   }

  public swap(tx: Transaction, args: PoolSwapArgs): TransactionResult {
    const callArgs = {
      pool: tx.object(this.pool.poolInfo.poolId),
      bankA: tx.object(this.bankA.bankInfo.bankId),
      bankB: tx.object(this.bankB.bankInfo.bankId),
      lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
      coinA: args.coinA,
      coinB: args.coinB,
      amountIn: args.amountIn,
      a2B: args.a2b,
      minAmountOut: args.minAmountOut,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const swapResult = PoolScriptFunctions.cpmmSwap(
      tx,
      this.poolScriptTypesNoQuoter(),
      callArgs,
      this.packageId,
    );

    return swapResult;
  }

  public quoteSwap(
    tx: Transaction,
    args: PoolQuoteSwapArgs,
  ): TransactionArgument {
    const callArgs = {
      pool: tx.object(this.pool.poolInfo.poolId),
      bankA: tx.object(this.bankA.bankInfo.bankId),
      bankB: tx.object(this.bankB.bankInfo.bankId),
      lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
      amountIn: args.amountIn,
      a2B: args.a2b,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const quote = PoolScriptFunctions.quoteCpmmSwap(
      tx,
      this.poolScriptTypesNoQuoter(),
      callArgs,
      this.packageId,
    );

    return quote;
  }

  public depositLiquidity(
    tx: Transaction,
    args: PoolDepositLiquidityArgs,
  ): [TransactionArgument, TransactionArgument] {
    const callArgs = {
      pool: tx.object(this.pool.poolInfo.poolId),
      bankA: tx.object(this.bankA.bankInfo.bankId),
      bankB: tx.object(this.bankB.bankInfo.bankId),
      lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
      coinA: args.coinA,
      coinB: args.coinB,
      maxA: args.maxA,
      maxB: args.maxB,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const [lpCoin, depositResult] = PoolScriptFunctions.depositLiquidity(
      tx,
      this.poolScriptTypes(),
      callArgs,
      this.packageId,
    );

    return [lpCoin, depositResult];
  }

  public redeemLiquidity(
    tx: Transaction,
    args: PoolRedeemLiquidityArgs,
  ): [TransactionArgument, TransactionArgument, TransactionArgument] {
    const callArgs = {
      pool: tx.object(this.pool.poolInfo.poolId),
      bankA: tx.object(this.bankA.bankInfo.bankId),
      bankB: tx.object(this.bankB.bankInfo.bankId),
      lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
      lpTokens: args.lpCoin,
      minA: args.minA,
      minB: args.minB,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const [coinA, coinB, redeemResult] = PoolScriptFunctions.redeemLiquidity(
      tx,
      this.poolScriptTypes(),
      callArgs,
      this.packageId,
    );
    return [coinA, coinB, redeemResult];
  }

  public quoteDeposit(
    tx: Transaction,
    args: PoolQuoteDepositArgs,
  ): TransactionArgument {
    const callArgs = {
      pool: tx.object(this.pool.poolInfo.poolId),
      bankA: tx.object(this.bankA.bankInfo.bankId),
      bankB: tx.object(this.bankB.bankInfo.bankId),
      lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
      maxA: args.maxA,
      maxB: args.maxB,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const quote = PoolScriptFunctions.quoteDeposit(
      tx,
      this.poolScriptTypes(),
      callArgs,
      this.packageId,
    );
    return quote;
  }

  public quoteRedeem(
    tx: Transaction,
    args: PoolQuoteRedeemArgs,
  ): TransactionArgument {
    const callArgs = {
      pool: tx.object(this.pool.poolInfo.poolId),
      bankA: tx.object(this.bankA.bankInfo.bankId),
      bankB: tx.object(this.bankB.bankInfo.bankId),
      lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
      lpTokens: args.lpTokens,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const quote = PoolScriptFunctions.quoteRedeem(
      tx,
      this.poolScriptTypes(),
      callArgs,
      this.packageId,
    );
    return quote;
  }

  public poolScriptTypes(): [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ] {
    const [bTokenAType, bTokenBType, quoterType, lpTokenType] =
      this.pool.poolTypes();
    const [lendingMarketType, coinTypeA, _bTokenAType] = this.bankA.typeArgs();
    const [_lendingMarketType, coinTypeB, _bTokenBType] = this.bankB.typeArgs();

    return [
      lendingMarketType,
      coinTypeA,
      coinTypeB,
      bTokenAType,
      bTokenBType,
      quoterType,
      lpTokenType,
    ];
  }

  public poolScriptTypesNoQuoter(): [
    string,
    string,
    string,
    string,
    string,
    string,
  ] {
    const [bTokenAType, bTokenBType, quoterType, lpTokenType] =
      this.pool.poolTypes();
    const [lendingMarketType, coinTypeA, _bTokenAType] = this.bankA.typeArgs();
    const [_lendingMarketType, coinTypeB, _bTokenBType] = this.bankB.typeArgs();

    return [
      lendingMarketType,
      coinTypeA,
      coinTypeB,
      bTokenAType,
      bTokenBType,
      lpTokenType,
    ];
  }
}
