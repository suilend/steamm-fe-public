import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

import { SdkOptions, StableQuoterFunctions } from "../../..";
import { PackageInfo, PoolInfo } from "../../../types";
import { MigrateArgs, SharePoolArgs } from "../../pool/poolArgs";
import { Quoter } from "../quoter";

import {
  CreateStablePoolArgs,
  StableQuoteSwapArgs,
  StableSwapArgs,
} from "./args";

export class StableQuoter implements Quoter {
  public sourcePkgId: string;
  public publishedAt: string;
  public poolInfo: PoolInfo;

  constructor(pkgInfo: PackageInfo, poolInfo: PoolInfo) {
    this.sourcePkgId = pkgInfo.sourcePkgId;
    this.publishedAt = pkgInfo.publishedAt;
    this.poolInfo = poolInfo;
  }

  public swap(tx: Transaction, args: StableSwapArgs): TransactionResult {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      bankA: tx.object(args.bankA as any), // TODO: Fix this
      bankB: tx.object(args.bankB as any), // TODO: Fix this
      lendingMarket: tx.object(args.lendingMarket as any), // TODO: Fix this
      oraclePriceUpdateA: tx.object(args.oraclePriceA),
      oraclePriceUpdateB: tx.object(args.oraclePriceB),
      coinA: args.coinA,
      coinB: args.coinB,
      amountIn: args.amountIn,
      a2B: args.a2b,
      minAmountOut: args.minAmountOut,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const swapResult = StableQuoterFunctions.swap(
      tx,
      this.quoterTypes(),
      callArgs,
      this.publishedAt,
    );

    return swapResult;
  }

  public quoteSwap(
    tx: Transaction,
    args: StableQuoteSwapArgs,
  ): TransactionArgument {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      bankA: tx.object(args.bankA as any), // TODO: Fix this
      bankB: tx.object(args.bankB as any), // TODO: Fix this
      lendingMarket: tx.object(args.lendingMarket as any), // TODO: Fix this
      oraclePriceUpdateA: tx.object(args.oraclePriceA),
      oraclePriceUpdateB: tx.object(args.oraclePriceB),
      amountIn: args.amountIn,
      a2B: args.a2b,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const quote = StableQuoterFunctions.quoteSwap(
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

  public migrateHook(
    args: MigrateArgs,
    tx: Transaction = new Transaction(),
  ): [TransactionArgument, TransactionArgument] {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      admin: args.adminCap,
    };

    const [coinA, coinB] = StableQuoterFunctions.migrate(
      tx,
      this.quoterTypes(),
      callArgs,
      this.publishedAt,
    );

    return [coinA, coinB];
  }
}

export function createStablePool(
  tx: Transaction,
  args: CreateStablePoolArgs,
  pkgInfo: PackageInfo,
): TransactionResult {
  const {
    coinTypeA,
    coinTypeB,
    lpTokenType,
    registry,
    swapFeeBps,
    lendingMarket,
    oracleRegistry,
    oracleIndexA,
    oracleIndexB,
    bTokenMetaA,
    bTokenMetaB,
    coinMetaA,
    coinMetaB,
    lpMetadataId,
    lpTreasuryId,
    lendingMarketType,
    bTokenTypeA,
    bTokenTypeB,
    amplifier,
  } = args;

  return StableQuoterFunctions.new_(
    tx,
    [
      lendingMarketType,
      coinTypeA,
      coinTypeB,
      bTokenTypeA,
      bTokenTypeB,
      lpTokenType,
    ],
    {
      registry: tx.object(registry),
      lendingMarket: tx.object(lendingMarket),
      oracleIndexA: oracleIndexA, // oracleIndexA,
      oracleIndexB: oracleIndexB, // oracleIndexB,
      oracleRegistry: tx.object(oracleRegistry),
      swapFeeBps: swapFeeBps,
      metaA: tx.object(coinMetaA),
      metaB: tx.object(coinMetaB),
      metaBA: tx.object(bTokenMetaA),
      metaBB: tx.object(bTokenMetaB),
      metaLp: tx.object(lpMetadataId),
      lpTreasury: tx.object(lpTreasuryId),
      amplifier,
    },
    pkgInfo.publishedAt,
  );
}

export function shareStablePool(
  tx: Transaction,
  args: SharePoolArgs,
  pkgInfo: PackageInfo,
  sdkOptions: SdkOptions,
): TransactionResult {
  const quoterType = `${sdkOptions.steamm_config.config!.quoterSourcePkgs.stable}::stable::StableQuoter`;

  return tx.moveCall({
    target: `0x2::transfer::public_share_object`,
    typeArguments: [
      `${pkgInfo.sourcePkgId}::pool::Pool<${args.bTokenTypeA}, ${args.bTokenTypeB}, ${quoterType}, ${args.lpTokenType}>`,
    ],
    arguments: [args.pool],
  });
}

export function createStablePoolAndShare(
  tx: Transaction,
  args: CreateStablePoolArgs,
  pkgInfo: PackageInfo,
  sdkOptions: SdkOptions,
) {
  const pool = createStablePool(tx, args, pkgInfo);

  return shareStablePool(
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
