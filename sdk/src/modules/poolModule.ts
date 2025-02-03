import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";
import { SteammSDK } from "../sdk";
import { IModule } from "../interfaces/IModule";
import { DepositQuote, RedeemQuote } from "../base/pool/poolTypes";
import { SuiTypeName } from "../utils";
import { SuiAddressType } from "../utils";
import { BankInfo, PoolInfo } from "../types";
import { Bank, Pool } from "../base";

/**
 * Helper class to help interact with pools.
 */
export class PoolModule implements IModule {
  protected _sdk: SteammSDK;

  constructor(sdk: SteammSDK) {
    this._sdk = sdk;
  }

  get sdk() {
    return this._sdk;
  }

  public async depositLiquidityEntry(
    args: PoolDepositLiquidityArgs,
    tx: Transaction
  ) {
    const [bTokenA, bTokenB, lpToken, _depositResult] =
      await this.depositLiquidity(args, tx);

    tx.transferObjects([bTokenA, bTokenB, lpToken], this.sdk.senderAddress);
  }

  public async depositLiquidity(
    args: PoolDepositLiquidityArgs,
    tx: Transaction
  ): Promise<
    [
      TransactionArgument,
      TransactionArgument,
      TransactionArgument,
      TransactionArgument
    ]
  > {
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankInfoA = bankList[args.coinTypeA];
    const bankInfoB = bankList[args.coinTypeB];

    const pool = this.getPool(poolInfo);
    const bankA = this.getBank(bankInfoA);
    const bankB = this.getBank(bankInfoB);

    const bTokenA = bankA.mintBTokens(
      {
        coins: tx.object(args.coinObjA),
        coinAmount: args.maxA,
      },
      tx
    );

    const bTokenB = bankB.mintBTokens(
      {
        coins: tx.object(args.coinObjB),
        coinAmount: args.maxB,
      },
      tx
    );

    const maxbA = tx.moveCall({
      target: `0x2::coin::value`,
      typeArguments: [bankInfoA.btokenType],
      arguments: [tx.object(bTokenA)],
    });
    const maxbB = tx.moveCall({
      target: `0x2::coin::value`,
      typeArguments: [bankInfoB.btokenType],
      arguments: [tx.object(bTokenB)],
    });

    const [lpToken, depositResult] = pool.depositLiquidity(
      {
        coinA: bTokenA,
        coinB: bTokenB,
        maxA: maxbA,
        maxB: maxbB,
      },
      tx
    );

    return [bTokenA, bTokenB, lpToken, depositResult];
  }

  public async redeemLiquidityEntry(
    args: PoolRedeemLiquidityArgs,
    tx: Transaction
  ) {
    const [coinA, coinB, bTokenA, bTokenB, _redeemResult] =
      await this.redeemLiquidity(args, tx);

    // TODO: destroy or transfer btokens
    tx.transferObjects(
      [coinA, coinB, bTokenA, bTokenB],
      this.sdk.senderAddress
    );
  }

  public async redeemLiquidity(
    args: PoolRedeemLiquidityArgs,
    tx: Transaction
  ): Promise<
    [
      TransactionArgument,
      TransactionArgument,
      TransactionArgument,
      TransactionArgument,
      TransactionArgument
    ]
  > {
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankInfoA = bankList[args.coinTypeA];
    const bankInfoB = bankList[args.coinTypeB];

    const pool = this.getPool(poolInfo);
    const bankA = this.getBank(bankInfoA);
    const bankB = this.getBank(bankInfoB);

    const [bTokenA, bTokenB, redeemResult] = pool.redeemLiquidity(
      {
        lpCoinObj: tx.object(args.lpCoinObj),
        minA: args.minA,
        minB: args.minB,
      },
      tx
    );

    const bTokenAAmount = tx.moveCall({
      target: `0x2::coin::value`,
      typeArguments: [bankInfoA.btokenType],
      arguments: [bTokenA],
    });
    const bTokenBAmount = tx.moveCall({
      target: `0x2::coin::value`,
      typeArguments: [bankInfoB.btokenType],
      arguments: [bTokenB],
    });

    const coinA = bankA.burnBTokens(
      {
        btokens: bTokenA,
        btokenAmount: bTokenAAmount,
      },
      tx
    );

    const coinB = bankB.burnBTokens(
      {
        btokens: bTokenB,
        btokenAmount: bTokenBAmount,
      },
      tx
    );

    return [coinA, coinB, bTokenA, bTokenB, redeemResult];
  }

  public async swapEntry(args: PoolSwapArgs, tx: Transaction) {
    const [coinA, coinB, bTokenA, bTokenB, swapResult] = await this.swap(
      args,
      tx
    );

    // TODO: destroy or transfer btokens
    tx.transferObjects(
      [coinA, coinB, bTokenA, bTokenB],
      this.sdk.senderAddress
    );
  }

  public async swap(
    args: PoolSwapArgs,
    tx: Transaction
  ): Promise<
    [
      TransactionArgument,
      TransactionArgument,
      TransactionArgument,
      TransactionArgument,
      TransactionArgument
    ]
  > {
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankInfoA = bankList[args.coinTypeA];
    const bankInfoB = bankList[args.coinTypeB];

    const pool = this.getPool(poolInfo);
    const bankA = this.getBank(bankInfoA);
    const bankB = this.getBank(bankInfoB);

    const bTokenA = args.a2b
      ? bankA.mintBTokens(
          {
            coins: tx.object(args.coinAObj),
            coinAmount: args.amountIn,
          },
          tx
        )
      : tx.moveCall({
          target: `0x2::coin::zero`,
          typeArguments: [bankInfoA.btokenType],
        });

    const bTokenB = !args.a2b
      ? bankB.mintBTokens(
          {
            coins: tx.object(args.coinBObj),
            coinAmount: args.amountIn,
          },
          tx
        )
      : tx.moveCall({
          target: `0x2::coin::zero`,
          typeArguments: [bankInfoA.btokenType],
        });

    const swapResult = pool.swap(
      {
        coinA: tx.object(bTokenA),
        coinB: tx.object(bTokenB),
        a2b: args.a2b,
        amountIn: args.amountIn,
        // TODO: Min amount out should be translated from native coin T to bT
        minAmountOut: args.minAmountOut,
      },
      tx
    );

    const bTokenAAmount = tx.moveCall({
      target: `0x2::coin::value`,
      typeArguments: [bankInfoA.btokenType],
      arguments: [bTokenA],
    });
    const bTokenBAmount = tx.moveCall({
      target: `0x2::coin::value`,
      typeArguments: [bankInfoB.btokenType],
      arguments: [bTokenB],
    });

    const coinA = bankA.burnBTokens(
      {
        btokens: bTokenA,
        btokenAmount: bTokenAAmount,
      },
      tx
    );

    const coinB = bankB.burnBTokens(
      {
        btokens: bTokenB,
        btokenAmount: bTokenBAmount,
      },
      tx
    );

    return [coinA, coinB, bTokenA, bTokenB, swapResult];
  }

  public async quoteDeposit(args: QuoteDepositArgs): Promise<DepositQuote> {
    const tx = new Transaction();
    const pools = await this.sdk.getPools();
    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;

    const pool = this.getPool(poolInfo);
    const quote = pool.quoteDeposit(
      {
        maxA: args.maxA,
        maxB: args.maxB,
      },
      tx
    );

    return await this.getQuoteResult<DepositQuote>(tx, quote, "DepositQuote");
  }

  public async quoteRedeem(args: PoolQuoteRedeemArgs): Promise<RedeemQuote> {
    const tx = new Transaction();
    const pools = await this.sdk.getPools();
    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;

    const pool = this.getPool(poolInfo);
    const quote = pool.quoteRedeem(
      {
        lpTokens: args.lpTokens,
      },
      tx
    );

    return await this.getQuoteResult<RedeemQuote>(tx, quote, "RedeemQuote");
  }

  private async getQuoteResult<T>(
    tx: Transaction,
    quote: TransactionArgument,
    quoteType: string
  ): Promise<T> {
    const pkgAddy = this.sdk.sdkOptions.steamm_config.package_id;

    tx.moveCall({
      target: `0x2::event::emit`,
      typeArguments: [`${pkgAddy}::quote::${quoteType}`],
      arguments: [quote],
    });

    const inspectResults = await this.sdk.fullClient.devInspectTransactionBlock(
      {
        sender: this.sdk.senderAddress,
        transactionBlock: tx,
      }
    );

    if (inspectResults.error) {
      throw new Error("DevInspect Failed");
    }

    const quoteResult = inspectResults.events[0].parsedJson as T;
    return quoteResult;
  }

  private getPool(poolInfo: PoolInfo): Pool {
    return new Pool(this.sdk.sdkOptions.steamm_config.package_id, poolInfo);
  }

  private getBank(bankInfo: BankInfo): Bank {
    return new Bank(this.sdk.sdkOptions.steamm_config.package_id, bankInfo);
  }

  // TODO
  // public setPoolSwapFees(
  //   args: PoolSetPoolSwapFeesArgs,
  //   tx: Transaction = new Transaction()
  // ) {
  //   const callArgs = {
  //     pool: tx.object(this.pool.id),
  //     poolCap: args.poolCap,
  //     swapFeeBps: args.swapFeeBps,
  //   };

  //   PoolFunctions.setPoolSwapFees(tx, this.typeArgs(), callArgs);
  // }

  // public setRedemptionFees(
  //   args: PoolSetRedemptionFeesArgs,
  //   tx: Transaction = new Transaction()
  // ) {
  //   const callArgs = {
  //     pool: tx.object(this.pool.id),
  //     poolCap: args.poolCap,
  //     redemptionFeeBps: args.redemptionFeeBps,
  //   };

  //   PoolFunctions.setRedemptionFees(tx, this.typeArgs(), callArgs);
  // }

  // public collectRedemptionFees(
  //   args: CollectRedemptionFeesArgs,
  //   tx: Transaction = new Transaction()
  // ): [TransactionArgument, TransactionArgument] {
  //   const callArgs = {
  //     pool: tx.object(this.pool.id),
  //     cap: args.poolCap,
  //   };

  //   const [coinA, coinB] = PoolFunctions.collectRedemptionFees(
  //     tx,
  //     this.typeArgs(),
  //     callArgs
  //   );

  //   return [coinA, coinB];
  // }

  // public collectProtocolFees(
  //   args: CollectProtocolFeesArgs,
  //   tx: Transaction = new Transaction()
  // ): [TransactionArgument, TransactionArgument] {
  //   const callArgs = {
  //     pool: tx.object(this.pool.id),
  //     globalAdmin: args.globalAdmin,
  //   };

  //   const [coinA, coinB] = PoolFunctions.collectProtocolFees(
  //     tx,
  //     this.typeArgs(),
  //     callArgs
  //   );

  //   return [coinA, coinB];
  // }

  // public migrate(
  //   args: MigratePoolArgs,
  //   tx: Transaction = new Transaction()
  // ): [TransactionArgument, TransactionArgument] {
  //   const callArgs = {
  //     pool: tx.object(this.pool.id),
  //     cap: args.poolCap,
  //   };

  //   const [coinA, coinB] = PoolFunctions.migrate(tx, this.typeArgs(), callArgs);

  //   return [coinA, coinB];
  // }
}

export interface PoolDepositLiquidityArgs {
  pool: SuiAddressType;
  coinTypeA: SuiTypeName;
  coinTypeB: SuiTypeName;
  coinObjA: TransactionArgument;
  coinObjB: TransactionArgument;
  maxA: bigint;
  maxB: bigint;
}

export interface PoolRedeemLiquidityArgs {
  pool: SuiAddressType;
  coinTypeA: SuiTypeName;
  coinTypeB: SuiTypeName;
  lpCoinObj: TransactionObjectInput;
  minA: bigint;
  minB: bigint;
}

export interface PoolSwapArgs {
  pool: SuiAddressType;
  coinTypeA: SuiTypeName;
  coinTypeB: SuiTypeName;
  coinAObj: TransactionObjectInput;
  coinBObj: TransactionObjectInput;
  a2b: boolean;
  amountIn: bigint;
  minAmountOut: bigint;
}

export interface QuoteDepositArgs {
  pool: SuiAddressType;
  maxA: bigint;
  maxB: bigint;
}

export interface PoolQuoteRedeemArgs {
  pool: SuiAddressType;
  lpTokens: bigint;
}
