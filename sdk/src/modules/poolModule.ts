import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";
import { SteammSDK } from "../sdk";
import { IModule } from "../interfaces/IModule";
import { castDepositQuote, castRedeemQuote, castSwapQuote, DepositQuote, RedeemQuote } from "../base/pool/poolTypes";
import { SuiTypeName } from "../utils";
import { SuiAddressType } from "../utils";
import { BankInfo, BankList, PoolInfo } from "../types";
import { Bank, Pool, PoolScript, SwapQuote } from "../base";

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
    tx: Transaction,
    args: PoolDepositLiquidityArgs,
  ) {
    const [lpToken, _depositResult] =
      await this.depositLiquidity(tx, args);

    tx.transferObjects([lpToken], this.sdk.senderAddress);
  }

  public async depositLiquidity(
    tx: Transaction,
    args: PoolDepositLiquidityArgs,
  ): Promise<
    [
      TransactionArgument,
      TransactionArgument
    ]
  > {
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankInfoA = bankList[args.coinTypeA];
    const bankInfoB = bankList[args.coinTypeB];

    const poolScript = this.getPoolScript(poolInfo, bankInfoA, bankInfoB);
    
    const [lpToken, depositResult] = poolScript.depositLiquidity(tx, {
      coinA: tx.object(args.coinObjA),
      coinB: tx.object(args.coinObjB),
      maxA: args.maxA,
      maxB: args.maxB,
    });

    return [lpToken, depositResult];
  }

  public async redeemLiquidityEntry(
    tx: Transaction,
    args: PoolRedeemLiquidityArgs,
  ) {
    const [coinA, coinB, _redeemResult] =
      await this.redeemLiquidity(tx, args);

    // TODO: destroy or transfer btokens
    tx.transferObjects(
      [coinA, coinB],
      this.sdk.senderAddress
    );
  }

  public async redeemLiquidity(
    tx: Transaction,
    args: PoolRedeemLiquidityArgs,
  ): Promise<
    [
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

    const poolScript = this.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const [coinA, coinB, redeemResult] = poolScript.redeemLiquidity(tx, {
      lpCoinObj: tx.object(args.lpCoinObj),
      minA: args.minA,
      minB: args.minB,
    });


    return [coinA, coinB, redeemResult];
  }

  public async swap(
    tx: Transaction,
    args: PoolSwapArgs,
  ): Promise<TransactionArgument> {
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankInfoA = bankList[args.coinTypeA];
    const bankInfoB = bankList[args.coinTypeB];

    const poolScript = this.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const swapResult = poolScript.swap(tx, {
      coinA: tx.object(args.coinAObj),
      coinB: tx.object(args.coinBObj),
      a2b: args.a2b,
      amountIn: args.amountIn,
      minAmountOut: args.minAmountOut,
    });

    return swapResult;
  }
  
  public async quoteSwap(
    args: QuoteSwapArgs,
  ): Promise<SwapQuote> {
    const tx = new Transaction();
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankInfoA = this.getBankInfoByBToken(bankList, poolInfo.coinTypeA);
    const bankInfoB = this.getBankInfoByBToken(bankList, poolInfo.coinTypeB);

    const poolScript = this.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const quote = poolScript.quoteSwap(tx, {
      a2b: args.a2b,
      amountIn: args.amountIn,
    });

    return castSwapQuote(await this.getQuoteResult<SwapQuote>(tx, quote, "SwapQuote"));
  }

  public async quoteDeposit(args: QuoteDepositArgs): Promise<DepositQuote> {
    const tx = new Transaction();
    const pools = await this.sdk.getPools();
    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    
    const bankList = await this.sdk.getBanks();
    const bankInfoA = this.getBankInfoByBToken(bankList, poolInfo.coinTypeA);
    const bankInfoB = this.getBankInfoByBToken(bankList, poolInfo.coinTypeB);

    const poolScript = this.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const quote = poolScript.quoteDeposit(tx, {
        maxA: args.maxA,
        maxB: args.maxB,
      },
    );

    return castDepositQuote(await this.getQuoteResult<DepositQuote>(tx, quote, "DepositQuote"));
  }

  public async quoteRedeem(args: PoolQuoteRedeemArgs): Promise<RedeemQuote> {
    const tx = new Transaction();
    const pools = await this.sdk.getPools();
    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankList = await this.sdk.getBanks();
    const bankInfoA = this.getBankInfoByBToken(bankList, poolInfo.coinTypeA);
    const bankInfoB = this.getBankInfoByBToken(bankList, poolInfo.coinTypeB);

    const poolScript = this.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const quote = poolScript.quoteRedeem(tx, {
        lpTokens: args.lpTokens,
      },
    );

    return castRedeemQuote(await this.getQuoteResult<RedeemQuote>(tx, quote, "RedeemQuote"));
  }

  private async getQuoteResult<T>(
    tx: Transaction,
    quote: TransactionArgument,
    quoteType: string,
  ): Promise<T> {
    const pkgAddy = this.sdk.sdkOptions.steamm_config.package_id;

    const inspectResults = await this.sdk.fullClient.devInspectTransactionBlock(
      {
        sender: this.sdk.senderAddress,
        transactionBlock: tx,
      },
    );

    // console.log(inspectResults)
    if (inspectResults.error) {
      throw new Error("DevInspect Failed");
    }

    const quoteResult = (inspectResults.events[0].parsedJson as any).event as T;
    return quoteResult;
  }

  private getPool(poolInfo: PoolInfo): Pool {
    return new Pool(this.sdk.sdkOptions.steamm_config.package_id, poolInfo);
  }
  
  private getPoolScript(poolInfo: PoolInfo, bankInfoA: BankInfo, bankInfoB: BankInfo): PoolScript {
    return new PoolScript(this.sdk.sdkOptions.steamm_config.package_id, poolInfo, bankInfoA, bankInfoB);
  }

  private getBank(bankInfo: BankInfo): Bank {
    return new Bank(this.sdk.sdkOptions.steamm_config.package_id, bankInfo);
  }

  private getBankInfoByBToken(bankList: BankList, btokenType: string) {
    const bankInfo = Object.values(bankList).find(bank => bank.btokenType === btokenType);
    
    if (!bankInfo) {
      throw new Error(`Bank info not found for btokenType: ${btokenType}`);
    }
  
    return bankInfo;
  }

  // TODO

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

export interface QuoteSwapArgs {
  pool: SuiAddressType;
  a2b: boolean;
  amountIn: bigint;
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
