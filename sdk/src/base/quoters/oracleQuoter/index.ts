import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";

import { ConstantProductFunctions } from "../../..";
import { PackageInfo, PoolInfo } from "../../../types";
import { MigrateArgs } from "../../pool/poolArgs";
import { Quoter } from "../quoter";

import { OracleSwapArgs } from "./args";

// import {
//   CpQuoteSwapArgs,
//   CpSwapArgs,
//   CreateCpPoolArgs,
// } from "./constantProductArgs";

// export * from "./constantProductArgs";

export class OracleQuoter implements Quoter {
  public sourcePkgId: string;
  public publishedAt: string;
  public poolInfo: PoolInfo;

  constructor(pkgInfo: PackageInfo, poolInfo: PoolInfo) {
    this.sourcePkgId = pkgInfo.sourcePkgId;
    this.publishedAt = pkgInfo.publishedAt;
    this.poolInfo = poolInfo;
  }

  public swap(tx: Transaction, args: OracleSwapArgs): TransactionResult {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      coinA: args.coinA,
      coinB: args.coinB,
      amountIn: args.amountIn,
      a2B: args.a2b,
      minAmountOut: args.minAmountOut,
    };

    const swapResult = ConstantProductFunctions.swap(
      tx,
      this.quoterTypes(),
      callArgs,
      this.publishedAt,
    );

    return swapResult;
  }

  public quoteSwap(
    tx: Transaction,
    args: CpQuoteSwapArgs,
  ): TransactionArgument {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      amountIn: args.amountIn,
      a2B: args.a2b,
    };

    const quote = ConstantProductFunctions.quoteSwap(
      tx,
      this.quoterTypes(),
      callArgs,
      this.publishedAt,
    );
    return quote;
  }

  public poolType(): [string] {
    return [
      `${this.sourcePkgId}::pool::Pool<${this.poolInfo.coinTypeA},
      ${this.poolInfo.coinTypeB},
      ${this.poolInfo.quoterType},
      ${this.poolInfo.lpTokenType}>`,
    ];
  }

  public quoterTypes(): [string, string, string] {
    return [
      this.poolInfo.coinTypeA,
      this.poolInfo.coinTypeB,
      this.poolInfo.lpTokenType,
    ];
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

  public viewOffset(tx: Transaction = new Transaction()): TransactionArgument {
    return ConstantProductFunctions.offset(
      tx,
      this.quoterTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewK(tx: Transaction = new Transaction()): TransactionArgument {
    return ConstantProductFunctions.k(
      tx,
      this.quoterTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public migrateHook(
    args: MigrateArgs,
    tx: Transaction = new Transaction(),
  ): [TransactionArgument, TransactionArgument] {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      admin: args.adminCap,
    };

    const [coinA, coinB] = ConstantProductFunctions.migrate(
      tx,
      this.quoterTypes(),
      callArgs,
      this.publishedAt,
    );

    return [coinA, coinB];
  }
}

export function createPool(
  tx: Transaction,
  args: CreateCpPoolArgs,
  pkgInfo: PackageInfo,
) {
  const {
    coinTypeA,
    coinTypeB,
    lpTokenType,
    registry,
    swapFeeBps,
    offset,
    coinMetaA,
    coinMetaB,
    lpTokenMeta,
    lpTreasury,
  } = args;

  const pool = ConstantProductFunctions.new_(
    tx,
    [coinTypeA, coinTypeB, lpTokenType],
    {
      registry,
      swapFeeBps,
      offset,
      metaA: coinMetaA,
      metaB: coinMetaB,
      metaLp: lpTokenMeta,
      lpTreasury,
    },
    pkgInfo.publishedAt,
  );

  const quoterType = `${pkgInfo.sourcePkgId}::cpmm::CpQuoter`;

  return tx.moveCall({
    target: `0x2::transfer::public_share_object`,
    typeArguments: [
      `${pkgInfo.sourcePkgId}::pool::Pool<${coinTypeA}, ${coinTypeB}, ${quoterType}, ${lpTokenType}>`,
    ],
    arguments: [pool],
  });
}
