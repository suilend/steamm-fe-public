import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";

import { OracleQuoter, PoolFunctions } from "../..";
import { PackageInfo, PoolInfo } from "../../types";
import { ConstantProductQuoter } from "../quoters/constantQuoter";
import { Quoter } from "../quoters/quoter";

import {
  BaseSwapArgs,
  CollectProtocolFeesArgs,
  MigrateArgs,
  PoolDepositLiquidityArgs,
  PoolQuoteDepositArgs,
  PoolQuoteRedeemArgs,
  PoolRedeemLiquidityArgs,
  QuoteSwapArgs,
  SwapArgs,
} from "./poolArgs";

export * from "./poolArgs";
export * from "./poolTypes";

export class Pool {
  public sourcePkgId: string;
  public publishedAt: string;
  public poolInfo: PoolInfo;
  public quoter: Quoter;

  constructor(pkgInfo: PackageInfo, poolInfo: PoolInfo) {
    this.sourcePkgId = pkgInfo.sourcePkgId;
    this.publishedAt = pkgInfo.publishedAt;
    this.poolInfo = poolInfo;

    this.quoter = this.createQuoter(pkgInfo, poolInfo);
  }

  private createQuoter(pkgInfo: PackageInfo, poolInfo: PoolInfo): Quoter {
    switch (poolInfo.quoterType) {
      case `${pkgInfo.sourcePkgId}::cpmm::CpQuoter`:
        return new ConstantProductQuoter(pkgInfo, poolInfo);
      default:
        return new OracleQuoter(pkgInfo, poolInfo);
    }
  }

  public swap(tx: Transaction, args: SwapArgs): TransactionResult {
    return this.quoter.swap(tx, args);
  }

  public quoteSwap(tx: Transaction, args: QuoteSwapArgs): TransactionArgument {
    return this.quoter.quoteSwap(tx, args);
  }

  public depositLiquidity(
    tx: Transaction,
    args: PoolDepositLiquidityArgs,
  ): [TransactionArgument, TransactionArgument] {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      coinA: args.coinA,
      coinB: args.coinB,
      maxA: args.maxA,
      maxB: args.maxB,
    };

    const [lpCoin, depositResult] = PoolFunctions.depositLiquidity(
      tx,
      this.poolTypes(),
      callArgs,
      this.publishedAt,
    );
    return [lpCoin, depositResult];
  }

  public redeemLiquidity(
    tx: Transaction,
    args: PoolRedeemLiquidityArgs,
  ): [TransactionArgument, TransactionArgument, TransactionArgument] {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      lpTokens: args.lpCoin,
      minA: args.minA,
      minB: args.minB,
    };

    const [coinA, coinB, redeemResult] = PoolFunctions.redeemLiquidity(
      tx,
      this.poolTypes(),
      callArgs,
      this.publishedAt,
    );
    return [coinA, coinB, redeemResult];
  }

  public quoteDeposit(
    tx: Transaction,
    args: PoolQuoteDepositArgs,
  ): TransactionArgument {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      maxA: args.maxA,
      maxB: args.maxB,
    };

    const quote = PoolFunctions.quoteDeposit(
      tx,
      this.poolTypes(),
      callArgs,
      this.publishedAt,
    );
    return quote;
  }

  public quoteRedeem(
    tx: Transaction,
    args: PoolQuoteRedeemArgs,
  ): TransactionArgument {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      lpTokens: args.lpTokens,
    };

    const quote = PoolFunctions.quoteRedeem(
      tx,
      this.poolTypes(),
      callArgs,
      this.publishedAt,
    );
    return quote;
  }

  public collectProtocolFees(
    tx: Transaction,
    args: CollectProtocolFeesArgs,
  ): [TransactionArgument, TransactionArgument] {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      globalAdmin: args.globalAdmin,
    };

    const [coinA, coinB] = PoolFunctions.collectProtocolFees(
      tx,
      this.poolTypes(),
      callArgs,
      this.publishedAt,
    );

    return [coinA, coinB];
  }

  public migrate(
    tx: Transaction,
    args: MigrateArgs,
  ): [TransactionArgument, TransactionArgument] {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      admin: args.adminCap,
    };

    const [coinA, coinB] = PoolFunctions.migratePool(
      tx,
      this.poolTypes(),
      callArgs,
      this.publishedAt,
    );

    return [coinA, coinB];
  }

  public poolTypes(): [string, string, string, string] {
    return [
      this.poolInfo.coinTypeA,
      this.poolInfo.coinTypeB,
      this.poolInfo.quoterType,
      this.poolInfo.lpTokenType,
    ];
  }

  // Getter functions

  public viewBalanceAmounts(tx: Transaction): TransactionArgument {
    return PoolFunctions.balanceAmounts(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewBalanceAmountA(tx: Transaction): TransactionArgument {
    return PoolFunctions.balanceAmountA(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewBalanceAmountB(tx: Transaction): TransactionArgument {
    return PoolFunctions.balanceAmountB(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewProtocolFees(tx: Transaction): TransactionArgument {
    return PoolFunctions.protocolFees(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewPoolFeeConfig(tx: Transaction): TransactionArgument {
    return PoolFunctions.poolFeeConfig(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewLpSupplyVal(tx: Transaction): TransactionArgument {
    return PoolFunctions.lpSupplyVal(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewTradingData(tx: Transaction): TransactionArgument {
    return PoolFunctions.tradingData(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewQuoter(tx: Transaction): TransactionArgument {
    return PoolFunctions.quoter(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewTotalSwapAInAmount(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.totalSwapAInAmount(tx, tradeData, this.publishedAt);
  }

  public viewTotalSwapBOutAmount(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.totalSwapBOutAmount(tx, tradeData, this.publishedAt);
  }

  public viewTotalSwapAOutAmount(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.totalSwapAOutAmount(tx, tradeData, this.publishedAt);
  }

  public viewTotalSwapBInAmount(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.totalSwapBInAmount(tx, tradeData, this.publishedAt);
  }

  public viewProtocolFeesA(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.protocolFeesA(tx, tradeData, this.publishedAt);
  }

  public viewProtocolFeesB(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.protocolFeesB(tx, tradeData, this.publishedAt);
  }

  public viewPoolFeesA(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.poolFeesA(tx, tradeData, this.publishedAt);
  }

  public viewPoolFeesB(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.poolFeesB(tx, tradeData, this.publishedAt);
  }

  public viewMinimumLiquidity(tx: Transaction): TransactionArgument {
    return PoolFunctions.minimumLiquidity(tx, this.publishedAt);
  }

  public viewSwapResultUser(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.swapResultUser(tx, swapResult, this.publishedAt);
  }

  public viewSwapResultPoolId(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.swapResultPoolId(tx, swapResult, this.publishedAt);
  }

  public viewSwapResultAmountIn(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.swapResultAmountIn(tx, swapResult, this.publishedAt);
  }

  public viewSwapResultAmountOut(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.swapResultAmountOut(tx, swapResult, this.publishedAt);
  }

  public viewSwapResultProtocolFees(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.swapResultProtocolFees(
      tx,
      swapResult,
      this.publishedAt,
    );
  }

  public viewSwapResultPoolFees(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.swapResultPoolFees(tx, swapResult, this.publishedAt);
  }

  public viewSwapResultA2b(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.swapResultA2b(tx, swapResult, this.publishedAt);
  }

  public viewDepositResultUser(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.depositResultUser(tx, depositResult, this.publishedAt);
  }

  public viewDepositResultPoolId(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.depositResultPoolId(
      tx,
      depositResult,
      this.publishedAt,
    );
  }

  public viewDepositResultDepositA(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.depositResultDepositA(
      tx,
      depositResult,
      this.publishedAt,
    );
  }

  public viewDepositResultDepositB(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.depositResultDepositB(
      tx,
      depositResult,
      this.publishedAt,
    );
  }

  public viewDepositResultMintLp(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.depositResultMintLp(
      tx,
      depositResult,
      this.publishedAt,
    );
  }

  public viewRedeemResultUser(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.redeemResultUser(tx, redeemResult, this.publishedAt);
  }

  public viewRedeemResultPoolId(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.redeemResultPoolId(tx, redeemResult, this.publishedAt);
  }

  public viewRedeemResultWithdrawA(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.redeemResultWithdrawA(
      tx,
      redeemResult,
      this.publishedAt,
    );
  }

  public viewRedeemResultWithdrawB(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.redeemResultWithdrawB(
      tx,
      redeemResult,
      this.publishedAt,
    );
  }

  public viewRedeemResultBurnLp(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.redeemResultBurnLp(tx, redeemResult, this.publishedAt);
  }
}
