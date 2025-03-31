import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";

import { poolAbi } from "../..";
import { PoolInfo, SteammPackageInfo } from "../../types";
import { ConstantProductQuoter } from "../quoters/constantQuoter";
import { Quoter } from "../quoters/quoter";

import {
  CollectProtocolFeesArgs,
  DepositLiquidityArgs,
  MigrateArgs,
  QuoteDepositArgs,
  QuoteRedeemArgs,
  QuoteSwapFullArgs,
  RedeemLiquidityArgs,
  SwapFullArgs,
} from "./poolArgs";

export * from "./poolArgs";
export * from "./poolTypes";

export class Pool {
  public sourcePkgId: string;
  public publishedAt: string;
  public poolInfo: PoolInfo;
  public quoter: Quoter;

  constructor(pkgInfo: SteammPackageInfo, poolInfo: PoolInfo) {
    this.sourcePkgId = pkgInfo.sourcePkgId;
    this.publishedAt = pkgInfo.publishedAt;
    this.poolInfo = poolInfo;

    this.quoter = this.createQuoter(pkgInfo, poolInfo);
  }

  private createQuoter(pkgInfo: SteammPackageInfo, poolInfo: PoolInfo): Quoter {
    switch (poolInfo.quoterType) {
      case `${pkgInfo.quoterPkgs.cpmm}::cpmm::CpQuoter`:
        return new ConstantProductQuoter(pkgInfo, poolInfo);
      case `${pkgInfo.quoterPkgs.omm}::omm::OracleQuoter`:
        return new ConstantProductQuoter(pkgInfo, poolInfo);
      default:
        throw new Error(`Unsupported quoter type: ${poolInfo.quoterType}`);
    }
  }

  public swap(tx: Transaction, args: SwapFullArgs): TransactionResult {
    return this.quoter.swap(tx, args);
  }

  public quoteSwap(
    tx: Transaction,
    args: QuoteSwapFullArgs,
  ): TransactionArgument {
    return this.quoter.quoteSwap(tx, args);
  }

  public depositLiquidity(
    tx: Transaction,
    args: DepositLiquidityArgs,
  ): [TransactionArgument, TransactionArgument] {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      coinA: args.coinA,
      coinB: args.coinB,
      maxA: args.maxA,
      maxB: args.maxB,
    };

    const [lpCoin, depositResult] = poolAbi.depositLiquidity(
      tx,
      this.poolTypes(),
      callArgs,
      this.publishedAt,
    );
    return [lpCoin, depositResult];
  }

  public redeemLiquidity(
    tx: Transaction,
    args: RedeemLiquidityArgs,
  ): [TransactionArgument, TransactionArgument, TransactionArgument] {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      lpTokens: args.lpCoin,
      minA: args.minA,
      minB: args.minB,
    };

    const [coinA, coinB, redeemResult] = poolAbi.redeemLiquidity(
      tx,
      this.poolTypes(),
      callArgs,
      this.publishedAt,
    );
    return [coinA, coinB, redeemResult];
  }

  public quoteDeposit(
    tx: Transaction,
    args: QuoteDepositArgs,
  ): TransactionArgument {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      maxA: args.maxA,
      maxB: args.maxB,
    };

    const quote = poolAbi.quoteDeposit(
      tx,
      this.poolTypes(),
      callArgs,
      this.publishedAt,
    );
    return quote;
  }

  public quoteRedeem(
    tx: Transaction,
    args: QuoteRedeemArgs,
  ): TransactionArgument {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      lpTokens: args.lpTokens,
    };

    const quote = poolAbi.quoteRedeem(
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

    const [coinA, coinB] = poolAbi.collectProtocolFees(
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

    const [coinA, coinB] = poolAbi.migrate(
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
    return poolAbi.balanceAmounts(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewBalanceAmountA(tx: Transaction): TransactionArgument {
    return poolAbi.balanceAmountA(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewBalanceAmountB(tx: Transaction): TransactionArgument {
    return poolAbi.balanceAmountB(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewProtocolFees(tx: Transaction): TransactionArgument {
    return poolAbi.protocolFees(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewPoolFeeConfig(tx: Transaction): TransactionArgument {
    return poolAbi.poolFeeConfig(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewLpSupplyVal(tx: Transaction): TransactionArgument {
    return poolAbi.lpSupplyVal(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewTradingData(tx: Transaction): TransactionArgument {
    return poolAbi.tradingData(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewQuoter(tx: Transaction): TransactionArgument {
    return poolAbi.quoter(
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
    return poolAbi.totalSwapAInAmount(tx, tradeData, this.publishedAt);
  }

  public viewTotalSwapBOutAmount(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.totalSwapBOutAmount(tx, tradeData, this.publishedAt);
  }

  public viewTotalSwapAOutAmount(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.totalSwapAOutAmount(tx, tradeData, this.publishedAt);
  }

  public viewTotalSwapBInAmount(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.totalSwapBInAmount(tx, tradeData, this.publishedAt);
  }

  public viewProtocolFeesA(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.protocolFeesA(tx, tradeData, this.publishedAt);
  }

  public viewProtocolFeesB(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.protocolFeesB(tx, tradeData, this.publishedAt);
  }

  public viewPoolFeesA(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.poolFeesA(tx, tradeData, this.publishedAt);
  }

  public viewPoolFeesB(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.poolFeesB(tx, tradeData, this.publishedAt);
  }

  public viewMinimumLiquidity(tx: Transaction): TransactionArgument {
    return poolAbi.minimumLiquidity(tx, this.publishedAt);
  }

  public viewSwapResultUser(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.swapResultUser(tx, swapResult, this.publishedAt);
  }

  public viewSwapResultPoolId(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.swapResultPoolId(tx, swapResult, this.publishedAt);
  }

  public viewSwapResultAmountIn(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.swapResultAmountIn(tx, swapResult, this.publishedAt);
  }

  public viewSwapResultAmountOut(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.swapResultAmountOut(tx, swapResult, this.publishedAt);
  }

  public viewSwapResultProtocolFees(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.swapResultProtocolFees(tx, swapResult, this.publishedAt);
  }

  public viewSwapResultPoolFees(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.swapResultPoolFees(tx, swapResult, this.publishedAt);
  }

  public viewSwapResultA2b(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.swapResultA2b(tx, swapResult, this.publishedAt);
  }

  public viewDepositResultUser(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.depositResultUser(tx, depositResult, this.publishedAt);
  }

  public viewDepositResultPoolId(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.depositResultPoolId(tx, depositResult, this.publishedAt);
  }

  public viewDepositResultDepositA(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.depositResultDepositA(tx, depositResult, this.publishedAt);
  }

  public viewDepositResultDepositB(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.depositResultDepositB(tx, depositResult, this.publishedAt);
  }

  public viewDepositResultMintLp(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.depositResultMintLp(tx, depositResult, this.publishedAt);
  }

  public viewRedeemResultUser(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.redeemResultUser(tx, redeemResult, this.publishedAt);
  }

  public viewRedeemResultPoolId(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.redeemResultPoolId(tx, redeemResult, this.publishedAt);
  }

  public viewRedeemResultWithdrawA(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.redeemResultWithdrawA(tx, redeemResult, this.publishedAt);
  }

  public viewRedeemResultWithdrawB(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.redeemResultWithdrawB(tx, redeemResult, this.publishedAt);
  }

  public viewRedeemResultBurnLp(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return poolAbi.redeemResultBurnLp(tx, redeemResult, this.publishedAt);
  }
}
