import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";
import { CpNewArgs, CpQuoteSwapArgs, CpSwapArgs } from "./constantProductArgs";
import { MigrateArgs } from "../../pool/poolArgs";
import { Quoter } from "../quoter";
import { PoolInfo } from "../../../types";
import { ConstantProductFunctions } from "../../..";

export * from "./constantProductArgs";

export class ConstantProductQuoter implements Quoter {
  public packageId: string;
  public poolInfo: PoolInfo;

  constructor(packageId: string, poolInfo: PoolInfo) {
    this.packageId = packageId;
    this.poolInfo = poolInfo;
  }

  public swap(
    args: CpSwapArgs,
    tx: Transaction = new Transaction()
  ): TransactionResult {
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
      this.packageId
    );

    return swapResult;
  }

  public quoteSwap(
    args: CpQuoteSwapArgs,
    tx: Transaction = new Transaction()
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
      this.packageId
    );
    return quote;
  }

  public poolType(): [string] {
    return [
      `${this.packageId}::pool::Pool<${this.poolInfo.coinTypeA},
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
      tx.object(this.poolInfo.poolId)
    );
  }

  public viewK(tx: Transaction = new Transaction()): TransactionArgument {
    return ConstantProductFunctions.k(
      tx,
      this.quoterTypes(),
      tx.object(this.poolInfo.poolId)
    );
  }

  public migrateHook(
    args: MigrateArgs,
    tx: Transaction = new Transaction()
  ): [TransactionArgument, TransactionArgument] {
    const callArgs = {
      pool: tx.object(this.poolInfo.poolId),
      admin: args.adminCap,
    };

    const [coinA, coinB] = ConstantProductFunctions.migrate(
      tx,
      this.quoterTypes(),
      callArgs
    );

    return [coinA, coinB];
  }
}

// TODO
// export function newPool(args: CpNewArgs): Transaction {
//   const tx = new Transaction();

//   const callArgs: NewArgs = {
//     metaA: args.coinMetadataA,
//     metaB: args.coinMetadataB,
//     metaLp: args.coinMetadataLp,
//     lpTreasury: args.LpTreasury,
//     registry: args.registry,
//     swapFeeBps: args.swapFeeBps,
//     offset: args.offset,
//   };
//   const pool = ConstantProductFunctions.new_(tx, this.quoterTypes(), callArgs);

//   tx.shareObject(pool, this.poolType());

//   return tx;
// }
