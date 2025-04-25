import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

import { PoolScriptFunctions } from "../_codegen";
import { BankInfo, PackageInfo, PoolInfo, SteammPackageInfo } from "../types";

import { Bank } from "./bank";
import {
  DepositLiquidityArgs,
  Pool,
  QuoteDepositArgs,
  QuoteRedeemArgs,
  QuoteSwapFullArgs,
  RedeemLiquidityArgs,
  SwapFullArgs,
} from "./pool";

export class PoolScript {
  public pkgInfo: PackageInfo;
  public pool: Pool;
  public bankA: Bank;
  public bankB: Bank;

  constructor(
    pkgInfo: SteammPackageInfo,
    scriptPkgInfo: PackageInfo,
    // steammPkgInfo: PackageInfo,
    // scriptPkgInfo: PackageInfo,
    poolInfo: PoolInfo,
    bankInfoA: BankInfo,
    bankInfoB: BankInfo,
  ) {
    this.pool = new Pool(pkgInfo, poolInfo);
    this.bankA = new Bank(pkgInfo, bankInfoA);
    this.bankB = new Bank(pkgInfo, bankInfoB);
    this.pkgInfo = scriptPkgInfo;

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

  public swap(tx: Transaction, args: SwapFullArgs): TransactionResult {
    switch (args.type) {
      case "ConstantProduct":
        return PoolScriptFunctions.cpmmSwap(
          tx,
          this.poolScriptTypesNoQuoter(),
          {
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
          },
          this.pkgInfo.publishedAt,
        );
      case "Oracle":
        return PoolScriptFunctions.ommSwap(
          tx,
          this.poolScriptTypesNoQuoter(),
          {
            pool: tx.object(this.pool.poolInfo.poolId),
            bankA: tx.object(this.bankA.bankInfo.bankId),
            bankB: tx.object(this.bankB.bankInfo.bankId),
            lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
            oraclePriceUpdateA: args.oraclePriceA,
            oraclePriceUpdateB: args.oraclePriceB,
            coinA: args.coinA,
            coinB: args.coinB,
            amountIn: args.amountIn,
            a2B: args.a2b,
            minAmountOut: args.minAmountOut,
            clock: tx.object(SUI_CLOCK_OBJECT_ID),
          },
          this.pkgInfo.publishedAt,
        );
      case "OracleV2":
        return PoolScriptFunctions.ommV2Swap(
          tx,
          this.poolScriptTypesNoQuoter(),
          {
            pool: tx.object(this.pool.poolInfo.poolId),
            bankA: tx.object(this.bankA.bankInfo.bankId),
            bankB: tx.object(this.bankB.bankInfo.bankId),
            lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
            oraclePriceUpdateA: args.oraclePriceA,
            oraclePriceUpdateB: args.oraclePriceB,
            coinA: args.coinA,
            coinB: args.coinB,
            amountIn: args.amountIn,
            a2B: args.a2b,
            minAmountOut: args.minAmountOut,
            clock: tx.object(SUI_CLOCK_OBJECT_ID),
          },
          this.pkgInfo.publishedAt,
        );
      default:
        console.log("Args:", args);
        throw new Error("Unknown pool type");
    }
  }

  public quoteSwap(
    tx: Transaction,
    args: QuoteSwapFullArgs,
  ): TransactionResult {
    switch (args.type) {
      case "ConstantProduct":
        return PoolScriptFunctions.quoteCpmmSwap(
          tx,
          this.poolScriptTypesNoQuoter(),
          {
            pool: tx.object(this.pool.poolInfo.poolId),
            bankA: tx.object(this.bankA.bankInfo.bankId),
            bankB: tx.object(this.bankB.bankInfo.bankId),
            lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
            amountIn: args.amountIn,
            a2B: args.a2b,
            clock: tx.object(SUI_CLOCK_OBJECT_ID),
          },
          this.pkgInfo.publishedAt,
        );
      case "Oracle":
        return PoolScriptFunctions.quoteOmmSwap(
          tx,
          this.poolScriptTypesNoQuoter(),
          {
            pool: tx.object(this.pool.poolInfo.poolId),
            bankA: tx.object(this.bankA.bankInfo.bankId),
            bankB: tx.object(this.bankB.bankInfo.bankId),
            lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
            oraclePriceUpdateA: tx.object(args.oraclePriceA),
            oraclePriceUpdateB: tx.object(args.oraclePriceB),
            amountIn: args.amountIn,
            a2B: args.a2b,
            clock: tx.object(SUI_CLOCK_OBJECT_ID),
          },
          this.pkgInfo.publishedAt,
        );
      case "OracleV2":
        return PoolScriptFunctions.quoteOmmV2Swap(
          tx,
          this.poolScriptTypesNoQuoter(),
          {
            pool: tx.object(this.pool.poolInfo.poolId),
            bankA: tx.object(this.bankA.bankInfo.bankId),
            bankB: tx.object(this.bankB.bankInfo.bankId),
            lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
            oraclePriceUpdateA: tx.object(args.oraclePriceA),
            oraclePriceUpdateB: tx.object(args.oraclePriceB),
            amountIn: args.amountIn,
            a2B: args.a2b,
            clock: tx.object(SUI_CLOCK_OBJECT_ID),
          },
          this.pkgInfo.publishedAt,
        );
      default:
        throw new Error("Unknown pool type");
    }
  }

  public depositLiquidity(
    tx: Transaction,
    args: DepositLiquidityArgs,
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
      this.pkgInfo.publishedAt,
    );

    return [lpCoin, depositResult];
  }

  public redeemLiquidity(
    tx: Transaction,
    args: RedeemLiquidityArgs,
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
      this.pkgInfo.publishedAt,
    );
    return [coinA, coinB, redeemResult];
  }

  public redeemLiquidityWithProvision(
    tx: Transaction,
    args: RedeemLiquidityArgs,
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

    const [coinA, coinB, redeemResult] =
      PoolScriptFunctions.redeemLiquidityWithProvision(
        tx,
        this.poolScriptTypes(),
        callArgs,
        this.pkgInfo.publishedAt,
      );
    return [coinA, coinB, redeemResult];
  }

  public quoteDeposit(
    tx: Transaction,
    args: QuoteDepositArgs,
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
      this.pkgInfo.publishedAt,
    );
    return quote;
  }

  public quoteRedeem(
    tx: Transaction,
    args: QuoteRedeemArgs,
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
      this.pkgInfo.publishedAt,
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
