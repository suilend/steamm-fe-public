import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

import { SdkOptions, oracleQuoterAbi } from "../../..";
import { PackageInfo, PoolInfo } from "../../../types";
import { MigrateArgs, SharePoolArgs } from "../../pool/poolArgs";
import { Quoter } from "../quoter";

import {
  CreateOraclePoolArgs,
  OracleQuoteSwapArgs,
  OracleSwapArgs,
} from "./args";

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
      bankA: tx.object(args.bankA!),
      bankB: tx.object(args.bankB!),
      lendingMarket: tx.object(args.lendingMarket!),
      oraclePriceUpdateA: tx.object(args.oraclePriceA),
      oraclePriceUpdateB: tx.object(args.oraclePriceB),
      coinA: args.coinA,
      coinB: args.coinB,
      amountIn: args.amountIn,
      a2B: args.a2b,
      minAmountOut: args.minAmountOut,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const swapResult = oracleQuoterAbi.swap(
      tx,
      this.quoterTypes(),
      callArgs,
      this.publishedAt,
    );

    return swapResult;
  }

  public quoteSwap(
    tx: Transaction,
    args: OracleQuoteSwapArgs,
  ): TransactionArgument {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      bankA: tx.object(args.bankA!),
      bankB: tx.object(args.bankB!),
      lendingMarket: tx.object(args.lendingMarket!),
      oraclePriceUpdateA: tx.object(args.oraclePriceA),
      oraclePriceUpdateB: tx.object(args.oraclePriceB),
      amountIn: args.amountIn,
      a2B: args.a2b,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const quote = oracleQuoterAbi.quoteSwap(
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

    const [coinA, coinB] = oracleQuoterAbi.migrate(
      tx,
      this.quoterTypes(),
      callArgs,
      this.publishedAt,
    );

    return [coinA, coinB];
  }
}

export function createOraclePool(
  tx: Transaction,
  args: CreateOraclePoolArgs,
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
  } = args;

  return oracleQuoterAbi.new_(
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
    },
    pkgInfo.publishedAt,
  );
}

export function shareOraclePool(
  tx: Transaction,
  args: SharePoolArgs,
  pkgInfo: PackageInfo,
  sdkOptions: SdkOptions,
): TransactionResult {
  const quoterType = `${sdkOptions.steammConfig.config!.quoterSourcePkgs.omm}::omm::OracleQuoter`;

  return tx.moveCall({
    target: `0x2::transfer::public_share_object`,
    typeArguments: [
      `${pkgInfo.sourcePkgId}::pool::Pool<${args.bTokenTypeA}, ${args.bTokenTypeB}, ${quoterType}, ${args.lpTokenType}>`,
    ],
    arguments: [args.pool],
  });
}

export function createOraclePoolAndShare(
  tx: Transaction,
  args: CreateOraclePoolArgs,
  pkgInfo: PackageInfo,
  sdkOptions: SdkOptions,
) {
  const pool = createOraclePool(tx, args, pkgInfo);

  return shareOraclePool(
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
