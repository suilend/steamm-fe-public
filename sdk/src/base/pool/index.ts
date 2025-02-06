import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";

import { PoolFunctions } from "../..";
import { PoolInfo } from "../../types";
import { ConstantProductQuoter } from "../quoters/constantQuoter";
import { Quoter } from "../quoters/quoter";

import {
  CollectProtocolFeesArgs,
  MigrateArgs,
  PoolDepositLiquidityArgs,
  PoolQuoteRedeemArgs,
  PoolRedeemLiquidityArgs,
  PoolSwapArgs,
  QuoteDepositArgs,
} from "./poolArgs";

export * from "./poolArgs";
export * from "./poolTypes";

export class Pool {
  public packageId: string;
  public poolInfo: PoolInfo;
  public quoter: Quoter;

  constructor(packageId: string, poolInfo: PoolInfo) {
    this.poolInfo = poolInfo;
    this.packageId = packageId;

    this.quoter = this.createQuoter(packageId, poolInfo);
  }

  private createQuoter(packageId: string, poolInfo: PoolInfo): Quoter {
    switch (poolInfo.quoterType) {
      case `${packageId}::cpmm::CpQuoter`:
        return new ConstantProductQuoter(packageId, poolInfo);
      default:
        throw new Error(`Unsupported quoter type: ${poolInfo.quoterType}`);
    }
  }

  public swap(tx: Transaction, args: PoolSwapArgs): TransactionResult {
    return this.quoter.swap(tx, args);
  }

  public quoteSwap(tx: Transaction, args: PoolSwapArgs): TransactionArgument {
    return this.quoter.swap(tx, args);
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
      this.packageId,
    );
    return [lpCoin, depositResult];
  }

  public redeemLiquidity(
    tx: Transaction,
    args: PoolRedeemLiquidityArgs,
  ): [TransactionArgument, TransactionArgument, TransactionArgument] {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      lpTokens: args.lpCoinObj,
      minA: args.minA,
      minB: args.minB,
    };

    const [coinA, coinB, redeemResult] = PoolFunctions.redeemLiquidity(
      tx,
      this.poolTypes(),
      callArgs,
      this.packageId,
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

    const quote = PoolFunctions.quoteDeposit(
      tx,
      this.poolTypes(),
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
      pool: tx.object(this.poolInfo.poolId),
      lpTokens: args.lpTokens,
    };

    const quote = PoolFunctions.quoteRedeem(
      tx,
      this.poolTypes(),
      callArgs,
      this.packageId,
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
      this.packageId,
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
      this.packageId,
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

  public viewBalanceAmounts(
    tx: Transaction,
  ): TransactionArgument {
    return PoolFunctions.balanceAmounts(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.packageId,
    );
  }

  public viewBalanceAmountA(
    tx: Transaction,
  ): TransactionArgument {
    return PoolFunctions.balanceAmountA(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.packageId,
    );
  }

  public viewBalanceAmountB(
    tx: Transaction,
  ): TransactionArgument {
    return PoolFunctions.balanceAmountB(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.packageId,
    );
  }

  public viewProtocolFees(
    tx: Transaction,
  ): TransactionArgument {
    return PoolFunctions.protocolFees(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.packageId,
    );
  }

  public viewPoolFeeConfig(
    tx: Transaction,
  ): TransactionArgument {
    return PoolFunctions.poolFeeConfig(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.packageId,
    );
  }

  public viewLpSupplyVal(
    tx: Transaction,
  ): TransactionArgument {
    return PoolFunctions.lpSupplyVal(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.packageId,
    );
  }

  public viewTradingData(
    tx: Transaction,
  ): TransactionArgument {
    return PoolFunctions.tradingData(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.packageId,
    );
  }

  public viewQuoter(tx: Transaction): TransactionArgument {
    return PoolFunctions.quoter(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.packageId,
    );
  }

  public viewTotalSwapAInAmount(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.totalSwapAInAmount(tx, tradeData, this.packageId);
  }

  public viewTotalSwapBOutAmount(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.totalSwapBOutAmount(tx, tradeData, this.packageId);
  }

  public viewTotalSwapAOutAmount(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.totalSwapAOutAmount(tx, tradeData, this.packageId);
  }

  public viewTotalSwapBInAmount(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.totalSwapBInAmount(tx, tradeData, this.packageId);
  }

  public viewProtocolFeesA(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.protocolFeesA(tx, tradeData, this.packageId);
  }

  public viewProtocolFeesB(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.protocolFeesB(tx, tradeData, this.packageId);
  }

  public viewPoolFeesA(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.poolFeesA(tx, tradeData, this.packageId);
  }

  public viewPoolFeesB(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.poolFeesB(tx, tradeData, this.packageId);
  }

  public viewMinimumLiquidity(
    tx: Transaction,
  ): TransactionArgument {
    return PoolFunctions.minimumLiquidity(tx, this.packageId);
  }

  public viewSwapResultUser(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.swapResultUser(tx, swapResult, this.packageId);
  }

  public viewSwapResultPoolId(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.swapResultPoolId(tx, swapResult, this.packageId);
  }

  public viewSwapResultAmountIn(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.swapResultAmountIn(tx, swapResult, this.packageId);
  }

  public viewSwapResultAmountOut(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.swapResultAmountOut(tx, swapResult, this.packageId);
  }

  public viewSwapResultProtocolFees(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.swapResultProtocolFees(tx, swapResult, this.packageId);
  }

  public viewSwapResultPoolFees(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.swapResultPoolFees(tx, swapResult, this.packageId);
  }

  public viewSwapResultA2b(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.swapResultA2b(tx, swapResult, this.packageId);
  }

  public viewDepositResultUser(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.depositResultUser(tx, depositResult, this.packageId);
  }

  public viewDepositResultPoolId(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.depositResultPoolId(tx, depositResult, this.packageId);
  }

  public viewDepositResultDepositA(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.depositResultDepositA(
      tx,
      depositResult,
      this.packageId,
    );
  }

  public viewDepositResultDepositB(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.depositResultDepositB(
      tx,
      depositResult,
      this.packageId,
    );
  }

  public viewDepositResultMintLp(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.depositResultMintLp(tx, depositResult, this.packageId);
  }

  public viewRedeemResultUser(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.redeemResultUser(tx, redeemResult, this.packageId);
  }

  public viewRedeemResultPoolId(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.redeemResultPoolId(tx, redeemResult, this.packageId);
  }

  public viewRedeemResultWithdrawA(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.redeemResultWithdrawA(
      tx,
      redeemResult,
      this.packageId,
    );
  }

  public viewRedeemResultWithdrawB(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.redeemResultWithdrawB(
      tx,
      redeemResult,
      this.packageId,
    );
  }

  public viewRedeemResultBurnLp(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return PoolFunctions.redeemResultBurnLp(tx, redeemResult, this.packageId);
  }
}
