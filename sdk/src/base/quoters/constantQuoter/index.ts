import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";

import { SdkOptions, cpQuoterAbi } from "../../..";
import { PackageInfo, PoolInfo } from "../../../types";
import { MigrateArgs, SharePoolArgs } from "../../pool/poolArgs";
import { Quoter } from "../quoter";

import { CpQuoteSwapArgs, CpSwapArgs, CreateCpPoolArgs } from "./args";

export class ConstantProductQuoter implements Quoter {
  public sourcePkgId: string;
  public publishedAt: string;
  public poolInfo: PoolInfo;

  constructor(pkgInfo: PackageInfo, poolInfo: PoolInfo) {
    this.sourcePkgId = pkgInfo.sourcePkgId;
    this.publishedAt = pkgInfo.publishedAt;
    this.poolInfo = poolInfo;
  }

  public swap(tx: Transaction, args: CpSwapArgs): TransactionResult {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      coinA: args.coinA,
      coinB: args.coinB,
      amountIn: args.amountIn,
      a2B: args.a2b,
      minAmountOut: args.minAmountOut,
    };

    const swapResult = cpQuoterAbi.swap(
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

    const quote = cpQuoterAbi.quoteSwap(
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
    return cpQuoterAbi.offset(
      tx,
      this.quoterTypes(),
      tx.object(this.poolInfo.poolId),
      this.publishedAt,
    );
  }

  public viewK(tx: Transaction = new Transaction()): TransactionArgument {
    return cpQuoterAbi.k(
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

    const [coinA, coinB] = cpQuoterAbi.migrate(
      tx,
      this.quoterTypes(),
      callArgs,
      this.publishedAt,
    );

    return [coinA, coinB];
  }
}

export function createConstantProductPool(
  tx: Transaction,
  args: CreateCpPoolArgs,
  pkgInfo: PackageInfo,
): TransactionResult {
  const {
    bTokenTypeA,
    bTokenMetaA,
    bTokenTypeB,
    bTokenMetaB,
    lpTokenType,
    swapFeeBps,
    offset,
    lpMetadataId,
    lpTreasuryId,
    registry,
  } = args;

  const pool = cpQuoterAbi.new_(
    tx,
    [bTokenTypeA, bTokenTypeB, lpTokenType],
    {
      registry,
      swapFeeBps,
      offset,
      metaA: bTokenMetaA,
      metaB: bTokenMetaB,
      metaLp: lpMetadataId,
      lpTreasury: lpTreasuryId,
    },
    pkgInfo.publishedAt,
  );

  return pool;
}

export function shareConstantProductPool(
  tx: Transaction,
  args: SharePoolArgs,
  pkgInfo: PackageInfo,
  sdkOptions: SdkOptions,
): TransactionResult {
  const quoterType = `${sdkOptions.steammConfig.config!.quoterSourcePkgs.omm}::cpmm::CpQuoter`;

  return tx.moveCall({
    target: `0x2::transfer::public_share_object`,
    typeArguments: [
      `${pkgInfo.sourcePkgId}::pool::Pool<${args.bTokenTypeA}, ${args.bTokenTypeB}, ${quoterType}, ${args.lpTokenType}>`,
    ],
    arguments: [args.pool],
  });
}

export function createConstantProductPoolAndShare(
  tx: Transaction,
  args: CreateCpPoolArgs,
  pkgInfo: PackageInfo,
  sdkOptions: SdkOptions,
) {
  const pool = createConstantProductPool(tx, args, pkgInfo);

  return shareConstantProductPool(
    tx,
    {
      pool,
      bTokenTypeA: args.bTokenTypeA,
      bTokenTypeB: args.bTokenTypeB,
      lpTokenType: args.lpTokenType,
    },
    pkgInfo,
    sdkOptions,
  );
}
