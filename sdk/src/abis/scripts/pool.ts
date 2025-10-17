import {
  Transaction,
  TransactionArgument,
  TransactionObjectArgument,
  TransactionResult,
} from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

import { Codegen } from "../..";
import { BankInfo, PackageInfo, PoolInfo, SteammInfo } from "../../types";
import { BankAbi } from "../bank";
import {
  DepositLiquidityArgs,
  PoolAbi,
  QuoteDepositArgs,
  QuoteRedeemArgs,
  QuoteSwapFullArgs,
  RedeemLiquidityArgs,
  SwapFullArgs,
} from "../pool";

export class PoolScript {
  public scriptInfo: PackageInfo;
  public pool: PoolAbi;
  public bankA: BankAbi;
  public bankB: BankAbi;

  constructor(
    steammInfo: SteammInfo,
    scriptInfo: PackageInfo,
    poolInfo: PoolInfo,
    bankInfoA: BankInfo,
    bankInfoB: BankInfo,
  ) {
    this.pool = new PoolAbi(steammInfo, poolInfo);
    this.bankA = new BankAbi(steammInfo, bankInfoA);
    this.bankB = new BankAbi(steammInfo, bankInfoB);
    this.scriptInfo = scriptInfo;

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
        return Codegen.PoolScriptV2.cpmmSwap(
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
          this.scriptInfo.publishedAt,
        );
      case "Oracle":
        return Codegen.PoolScriptV2.ommSwap(
          tx,
          this.poolScriptTypesNoQuoter(),
          {
            pool: tx.object(this.pool.poolInfo.poolId),
            bankA: tx.object(this.bankA.bankInfo.bankId),
            bankB: tx.object(this.bankB.bankInfo.bankId),
            lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
            oraclePriceUpdateA: args.oraclePriceA as TransactionObjectArgument,
            oraclePriceUpdateB: args.oraclePriceB as TransactionObjectArgument,
            coinA: args.coinA,
            coinB: args.coinB,
            amountIn: args.amountIn,
            a2B: args.a2b,
            minAmountOut: args.minAmountOut,
            clock: tx.object(SUI_CLOCK_OBJECT_ID),
          },
          this.scriptInfo.publishedAt,
        );
      case "OracleV2":
        return Codegen.PoolScriptV2.ommV2Swap(
          tx,
          this.poolScriptTypesNoQuoter(),
          {
            pool: tx.object(this.pool.poolInfo.poolId),
            bankA: tx.object(this.bankA.bankInfo.bankId),
            bankB: tx.object(this.bankB.bankInfo.bankId),
            lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
            oraclePriceUpdateA: args.oraclePriceA as TransactionObjectArgument,
            oraclePriceUpdateB: args.oraclePriceB as TransactionObjectArgument,
            coinA: args.coinA,
            coinB: args.coinB,
            amountIn: args.amountIn,
            a2B: args.a2b,
            minAmountOut: args.minAmountOut,
            clock: tx.object(SUI_CLOCK_OBJECT_ID),
          },
          this.scriptInfo.publishedAt,
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
        return Codegen.PoolScriptV2.quoteCpmmSwap(
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
          this.scriptInfo.publishedAt,
        );
      case "Oracle":
        return Codegen.PoolScriptV2.quoteOmmSwap(
          tx,
          this.poolScriptTypesNoQuoter(),
          {
            pool: tx.object(this.pool.poolInfo.poolId),
            bankA: tx.object(this.bankA.bankInfo.bankId),
            bankB: tx.object(this.bankB.bankInfo.bankId),
            lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
            oraclePriceUpdateA: tx.object(
              args.oraclePriceA as TransactionObjectArgument,
            ),
            oraclePriceUpdateB: tx.object(
              args.oraclePriceB as TransactionObjectArgument,
            ),
            amountIn: args.amountIn,
            a2B: args.a2b,
            clock: tx.object(SUI_CLOCK_OBJECT_ID),
          },
          this.scriptInfo.publishedAt,
        );
      case "OracleV2":
        return Codegen.PoolScriptV2.quoteOmmV2Swap(
          tx,
          this.poolScriptTypesNoQuoter(),
          {
            pool: tx.object(this.pool.poolInfo.poolId),
            bankA: tx.object(this.bankA.bankInfo.bankId),
            bankB: tx.object(this.bankB.bankInfo.bankId),
            lendingMarket: tx.object(this.bankA.bankInfo.lendingMarketId),
            oraclePriceUpdateA: tx.object(
              args.oraclePriceA as TransactionObjectArgument,
            ),
            oraclePriceUpdateB: tx.object(
              args.oraclePriceB as TransactionObjectArgument,
            ),
            amountIn: args.amountIn,
            a2B: args.a2b,
            clock: tx.object(SUI_CLOCK_OBJECT_ID),
          },
          this.scriptInfo.publishedAt,
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
      coinA: args.coinA as TransactionObjectArgument,
      coinB: args.coinB as TransactionObjectArgument,
      maxA: args.maxA,
      maxB: args.maxB,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const [lpCoin, depositResult] = Codegen.PoolScriptV2.depositLiquidity(
      tx,
      this.poolScriptTypes(),
      callArgs,
      this.scriptInfo.publishedAt,
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

    const [coinA, coinB, redeemResult] = Codegen.PoolScriptV2.redeemLiquidity(
      tx,
      this.poolScriptTypes(),
      callArgs,
      this.scriptInfo.publishedAt,
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

    const [coinA, coinB, redeemResult] = Codegen.PoolScriptV1.redeemLiquidity(
      tx,
      this.poolScriptTypes(),
      callArgs,
      this.scriptInfo.publishedAt,
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

    const quote = Codegen.PoolScriptV2.quoteDeposit(
      tx,
      this.poolScriptTypes(),
      callArgs,
      this.scriptInfo.publishedAt,
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

    const quote = Codegen.PoolScriptV2.quoteRedeem(
      tx,
      this.poolScriptTypes(),
      callArgs,
      this.scriptInfo.publishedAt,
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
