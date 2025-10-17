import {
  Transaction,
  TransactionArgument,
  TransactionObjectArgument,
  TransactionResult,
} from "@mysten/sui/transactions";

import { Codegen, OracleQuoter, QuoterAbi } from "../..";
import { PoolInfo, SteammInfo } from "../../types";
import { ConstantProductQuoter } from "../quoters/constantProduct";
import { OracleV2Quoter } from "../quoters/oracleV2";

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

export class PoolAbi {
  public originalId: string;
  public publishedAt: string;
  public poolInfo: PoolInfo;
  public quoter: QuoterAbi;

  constructor(pkgInfo: SteammInfo, poolInfo: PoolInfo) {
    this.originalId = pkgInfo.originalId;
    this.publishedAt = pkgInfo.publishedAt;
    this.poolInfo = poolInfo;

    this.quoter = this.createQuoter(pkgInfo, poolInfo);
  }

  private createQuoter(pkgInfo: SteammInfo, poolInfo: PoolInfo): QuoterAbi {
    switch (poolInfo.quoterType) {
      case `${pkgInfo.quoterIds.cpmm}::cpmm::CpQuoter`:
        return new ConstantProductQuoter(pkgInfo, poolInfo);
      case `${pkgInfo.quoterIds.omm}::omm::OracleQuoter`:
        return new OracleQuoter(pkgInfo, poolInfo);
      case `${pkgInfo.quoterIds.ommV2}::omm_v2::OracleQuoterV2`:
        return new OracleV2Quoter(pkgInfo, poolInfo);
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
      coinA: args.coinA as TransactionObjectArgument,
      coinB: args.coinB as TransactionObjectArgument,
      maxA: args.maxA,
      maxB: args.maxB,
    };

    const [lpCoin, depositResult] = Codegen.Pool.depositLiquidity(
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

    const [coinA, coinB, redeemResult] = Codegen.Pool.redeemLiquidity(
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

    const quote = Codegen.Pool.quoteDeposit(
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

    const quote = Codegen.Pool.quoteRedeem(
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

    const [coinA, coinB] = Codegen.Pool.collectProtocolFees(
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

    const [coinA, coinB] = Codegen.Pool.migrate(
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
    return Codegen.Pool.balanceAmounts(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewBalanceAmountA(tx: Transaction): TransactionArgument {
    return Codegen.Pool.balanceAmountA(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewBalanceAmountB(tx: Transaction): TransactionArgument {
    return Codegen.Pool.balanceAmountB(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewProtocolFees(tx: Transaction): TransactionArgument {
    return Codegen.Pool.protocolFees(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewPoolFeeConfig(tx: Transaction): TransactionArgument {
    return Codegen.Pool.poolFeeConfig(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewLpSupplyVal(tx: Transaction): TransactionArgument {
    return Codegen.Pool.lpSupplyVal(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewTradingData(tx: Transaction): TransactionArgument {
    return Codegen.Pool.tradingData(
      tx,
      this.poolTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewQuoter(tx: Transaction): TransactionArgument {
    return Codegen.Pool.quoter(
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
    return Codegen.Pool.totalSwapAInAmount(
      tx,
      tradeData as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewTotalSwapBOutAmount(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.totalSwapBOutAmount(
      tx,
      tradeData as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewTotalSwapAOutAmount(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.totalSwapAOutAmount(
      tx,
      tradeData as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewTotalSwapBInAmount(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.totalSwapBInAmount(
      tx,
      tradeData as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewProtocolFeesA(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.protocolFeesA(
      tx,
      tradeData as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewProtocolFeesB(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.protocolFeesB(
      tx,
      tradeData as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewPoolFeesA(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.poolFeesA(
      tx,
      tradeData as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewPoolFeesB(
    tx: Transaction,
    tradeData: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.poolFeesB(
      tx,
      tradeData as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewMinimumLiquidity(tx: Transaction): TransactionArgument {
    return Codegen.Pool.minimumLiquidity(tx, this.publishedAt);
  }

  public viewSwapResultUser(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.swapResultUser(
      tx,
      swapResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewSwapResultPoolId(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.swapResultPoolId(
      tx,
      swapResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewSwapResultAmountIn(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.swapResultAmountIn(
      tx,
      swapResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewSwapResultAmountOut(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.swapResultAmountOut(
      tx,
      swapResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewSwapResultProtocolFees(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.swapResultProtocolFees(
      tx,
      swapResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewSwapResultPoolFees(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.swapResultPoolFees(
      tx,
      swapResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewSwapResultA2b(
    tx: Transaction,
    swapResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.swapResultA2b(
      tx,
      swapResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewDepositResultUser(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.depositResultUser(
      tx,
      depositResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewDepositResultPoolId(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.depositResultPoolId(
      tx,
      depositResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewDepositResultDepositA(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.depositResultDepositA(
      tx,
      depositResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewDepositResultDepositB(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.depositResultDepositB(
      tx,
      depositResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewDepositResultMintLp(
    tx: Transaction,
    depositResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.depositResultMintLp(
      tx,
      depositResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewRedeemResultUser(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.redeemResultUser(
      tx,
      redeemResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewRedeemResultPoolId(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.redeemResultPoolId(
      tx,
      redeemResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewRedeemResultWithdrawA(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.redeemResultWithdrawA(
      tx,
      redeemResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewRedeemResultWithdrawB(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.redeemResultWithdrawB(
      tx,
      redeemResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }

  public viewRedeemResultBurnLp(
    tx: Transaction,
    redeemResult: TransactionArgument,
  ): TransactionArgument {
    return Codegen.Pool.redeemResultBurnLp(
      tx,
      redeemResult as TransactionObjectArgument,
      this.publishedAt,
    );
  }
}
