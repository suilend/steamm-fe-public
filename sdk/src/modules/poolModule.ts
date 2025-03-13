import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import {
  PoolDepositLiquidityArgs,
  PoolQuoteDepositArgs,
  PoolQuoteRedeemArgs,
  PoolQuoteSwapArgs,
  PoolRedeemLiquidityArgs,
  PoolSwapArgs,
  SwapQuote,
  createConstantProductPool,
  createOraclePool,
} from "../base";
import {
  DepositQuote,
  RedeemQuote,
  castDepositQuote,
  castRedeemQuote,
  castSwapQuote,
} from "../base/pool/poolTypes";
import { IModule } from "../interfaces/IModule";
import { SteammSDK } from "../sdk";
import { BankList } from "../types";
import { SuiTypeName } from "../utils";
import { SuiAddressType } from "../utils";

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
    args: DepositLiquidityArgs,
  ) {
    const [lpToken, _depositResult] = await this.depositLiquidity(tx, args);

    tx.transferObjects([lpToken], this.sdk.senderAddress);
  }

  public async depositLiquidity(
    tx: Transaction,
    args: DepositLiquidityArgs,
  ): Promise<[TransactionArgument, TransactionArgument]> {
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankInfoA = bankList[args.coinTypeA];
    const bankInfoB = bankList[args.coinTypeB];

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const [lpToken, depositResult] = poolScript.depositLiquidity(tx, {
      coinA: tx.object(args.coinA),
      coinB: tx.object(args.coinB),
      maxA: args.maxA,
      maxB: args.maxB,
    });

    return [lpToken, depositResult];
  }

  public async redeemLiquidityEntry(
    tx: Transaction,
    args: RedeemLiquidityArgs,
  ) {
    const [coinA, coinB, _redeemResult] = await this.redeemLiquidity(tx, args);

    tx.transferObjects([coinA, coinB], this.sdk.senderAddress);
  }

  public async redeemLiquidity(
    tx: Transaction,
    args: RedeemLiquidityArgs,
  ): Promise<[TransactionArgument, TransactionArgument, TransactionArgument]> {
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankInfoA = bankList[args.coinTypeA];
    const bankInfoB = bankList[args.coinTypeB];

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const [coinA, coinB, redeemResult] = poolScript.redeemLiquidity(tx, {
      lpCoin: tx.object(args.lpCoin),
      minA: args.minA,
      minB: args.minB,
    });

    return [coinA, coinB, redeemResult];
  }

  public async swap(
    tx: Transaction,
    args: SwapArgs,
  ): Promise<TransactionArgument> {
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankInfoA = bankList[args.coinTypeA];
    const bankInfoB = bankList[args.coinTypeB];

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const swapResult = poolScript.swap(tx, {
      coinA: tx.object(args.coinA),
      coinB: tx.object(args.coinB),
      a2b: args.a2b,
      amountIn: args.amountIn,
      minAmountOut: args.minAmountOut,
    });

    return swapResult;
  }

  public async quoteSwap(
    args: QuoteSwapArgs,
    tx: Transaction = new Transaction(),
  ): Promise<SwapQuote> {
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankInfoA = this.getBankInfoByBToken(bankList, poolInfo.coinTypeA);
    const bankInfoB = this.getBankInfoByBToken(bankList, poolInfo.coinTypeB);

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    poolScript.quoteSwap(tx, {
      a2b: args.a2b,
      amountIn: args.amountIn,
    });

    return castSwapQuote(await this.getQuoteResult<SwapQuote>(tx, "SwapQuote"));
  }

  public async quoteDeposit(args: QuoteDepositArgs): Promise<DepositQuote> {
    const tx = new Transaction();
    const pools = await this.sdk.getPools();
    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;

    const bankList = await this.sdk.getBanks();
    const bankInfoA = this.getBankInfoByBToken(bankList, poolInfo.coinTypeA);
    const bankInfoB = this.getBankInfoByBToken(bankList, poolInfo.coinTypeB);

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    poolScript.quoteDeposit(tx, {
      maxA: args.maxA,
      maxB: args.maxB,
    });

    return castDepositQuote(
      await this.getQuoteResult<DepositQuote>(tx, "DepositQuote"),
    );
  }

  public async quoteRedeem(args: QuoteRedeemArgs): Promise<RedeemQuote> {
    const tx = new Transaction();
    const pools = await this.sdk.getPools();
    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankList = await this.sdk.getBanks();
    const bankInfoA = this.getBankInfoByBToken(bankList, poolInfo.coinTypeA);
    const bankInfoB = this.getBankInfoByBToken(bankList, poolInfo.coinTypeB);

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const bankA = this.sdk.getBank(bankInfoA);
    const bankB = this.sdk.getBank(bankInfoB);

    bankA.compoundInterestIfAny(tx);
    bankB.compoundInterestIfAny(tx);

    poolScript.quoteRedeem(tx, {
      lpTokens: args.lpTokens,
    });

    return castRedeemQuote(
      await this.getQuoteResult<RedeemQuote>(tx, "RedeemQuote"),
    );
  }

  public async createLpToken(
    bytecode: any,
    sender: SuiAddressType,
  ): Promise<Transaction> {
    // Step 1: Create the coin
    const tx = new Transaction();
    const [upgradeCap] = tx.publish({
      modules: [[...bytecode]],
      dependencies: [normalizeSuiAddress("0x1"), normalizeSuiAddress("0x2")],
    });

    tx.transferObjects([upgradeCap], tx.pure.address(sender));

    return tx;
  }

  public async createPool(tx: Transaction, args: CreatePoolArgs) {
    // wait until the sui rpc recognizes the treasuryCapId
    while (true) {
      const object = await this.sdk.fullClient.getObject({
        id: args.lpTreasuryId,
      });
      if (object.error) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        break;
      }
    }

    switch (args.type) {
      case "ConstantProduct":
        createConstantProductPool(
          tx,
          {
            ...args,
            registry: this.sdk.sdkOptions.steamm_config.config!.registryId,
          },
          this.sdk.packageInfo(),
        );
        break;
      case "Oracle":
        createOraclePool(
          tx,
          {
            ...args,
            registry: this.sdk.sdkOptions.steamm_config.config!.registryId,
          },
          this.sdk.packageInfo(),
        );
        break;
      default:
        throw new Error("Unknown pool type");
    }
  }

  private async getQuoteResult<T>(
    tx: Transaction,
    quoteType: string,
  ): Promise<T> {
    const inspectResults = await this.sdk.fullClient.devInspectTransactionBlock(
      {
        sender: this.sdk.senderAddress,
        transactionBlock: tx,
      },
    );

    if (inspectResults.error) {
      console.log(inspectResults);
      throw new Error("DevInspect Failed");
    }

    const quoteEvent = inspectResults.events.find((event) =>
      event.type.includes(`${this.sdk.sourcePkgId()}::quote::${quoteType}`),
    );
    if (!quoteEvent) {
      throw new Error("Quote event not found");
    }

    const quoteResult = (quoteEvent.parsedJson as any).event as T;
    return quoteResult;
  }

  private getBankInfoByBToken(bankList: BankList, btokenType: string) {
    const bankInfo = Object.values(bankList).find(
      (bank) => bank.btokenType === btokenType,
    );

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

export type DepositLiquidityArgs = PoolDepositLiquidityArgs & {
  pool: SuiAddressType;
  coinTypeA: SuiTypeName;
  coinTypeB: SuiTypeName;
};

export type RedeemLiquidityArgs = PoolRedeemLiquidityArgs & {
  pool: SuiAddressType;
  coinTypeA: SuiTypeName;
  coinTypeB: SuiTypeName;
};

export type SwapArgs = PoolSwapArgs & {
  pool: SuiAddressType;
  coinTypeA: SuiTypeName;
  coinTypeB: SuiTypeName;
};

export type QuoteSwapArgs = PoolQuoteSwapArgs & {
  pool: SuiAddressType;
};

export type QuoteDepositArgs = PoolQuoteDepositArgs & {
  pool: SuiAddressType;
};

export type QuoteRedeemArgs = PoolQuoteRedeemArgs & {
  pool: SuiAddressType;
};

export type CreateCpmmPoolArgs = {
  type: "ConstantProduct";
  lpTreasuryId: string;
  lpMetadataId: string;
  lpTokenType: string;
  coinTypeA: string; // btoken type
  coinTypeB: string; // btoken type
  swapFeeBps: bigint;
  offset: bigint;
  coinMetaA: string;
  coinMetaB: string;
};

export type CreateOraclePoolArgs = {
  type: "Oracle";

  lendingMarket: SuiAddressType;
  oracleRegistry: SuiAddressType;
  oracleIndexA: bigint;
  oracleIndexB: bigint;
  bTokenMetaA: string | TransactionObjectInput;
  bTokenMetaB: string | TransactionObjectInput;
  lendingMarketType: string;

  coinTypeA: string;
  coinTypeB: string;

  bTokenTypeA: string;
  bTokenTypeB: string;
  lpTreasuryId: string;
  lpMetadataId: string;
  lpTokenType: string;
  btokenTypeA: string;
  btokenTypeB: string;
  swapFeeBps: bigint;
  coinMetaA: string;
  coinMetaB: string;
};
export type CreatePoolArgs = CreateCpmmPoolArgs | CreateOraclePoolArgs;
