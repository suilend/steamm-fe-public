import {
  SuiObjectChange,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import { Transaction, TransactionArgument } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import {
  Bank,
  Pool,
  PoolDepositLiquidityArgs,
  PoolQuoteDepositArgs,
  PoolQuoteRedeemArgs,
  PoolQuoteSwapArgs,
  PoolRedeemLiquidityArgs,
  PoolScript,
  PoolSwapArgs,
  SwapQuote,
  createPool,
} from "../base";
import {
  DepositQuote,
  RedeemQuote,
  castDepositQuote,
  castRedeemQuote,
  castSwapQuote,
} from "../base/pool/poolTypes";
import { createCoinBytecode, getTreasuryAndCoinMeta } from "../coinGen";
import { IModule } from "../interfaces/IModule";
import { SteammSDK } from "../sdk";
import { BankInfo, BankList, PoolInfo } from "../types";
import { SuiTypeName } from "../utils";
import { SuiAddressType } from "../utils";

const LP_TOKEN_URI = "TODO";

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

  public async quoteSwap(args: QuoteSwapArgs): Promise<SwapQuote> {
    const tx = new Transaction();
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankInfoA = this.getBankInfoByBToken(bankList, poolInfo.coinTypeA);
    const bankInfoB = this.getBankInfoByBToken(bankList, poolInfo.coinTypeB);

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const quote = poolScript.quoteSwap(tx, {
      a2b: args.a2b,
      amountIn: args.amountIn,
    });

    return castSwapQuote(
      await this.getQuoteResult<SwapQuote>(tx, quote, "SwapQuote"),
    );
  }

  public async quoteDeposit(args: QuoteDepositArgs): Promise<DepositQuote> {
    const tx = new Transaction();
    const pools = await this.sdk.getPools();
    const poolInfo = pools.find((pool) => pool.poolId === args.pool)!;

    const bankList = await this.sdk.getBanks();
    const bankInfoA = this.getBankInfoByBToken(bankList, poolInfo.coinTypeA);
    const bankInfoB = this.getBankInfoByBToken(bankList, poolInfo.coinTypeB);

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const quote = poolScript.quoteDeposit(tx, {
      maxA: args.maxA,
      maxB: args.maxB,
    });

    return castDepositQuote(
      await this.getQuoteResult<DepositQuote>(tx, quote, "DepositQuote"),
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

    const quote = poolScript.quoteRedeem(tx, {
      lpTokens: args.lpTokens,
    });

    return castRedeemQuote(
      await this.getQuoteResult<RedeemQuote>(tx, quote, "RedeemQuote"),
    );
  }

  public async createLpToken(
    coinASymbol: string,
    coinBSymbol: string,
    sender: SuiAddressType,
  ): Promise<Transaction> {
    // Construct LP token name
    const lpName = `STEAMM_LP ${coinASymbol}-${coinBSymbol}`;

    // Construct LP token symbol
    const lpSymbol = `STEAMM LP ${coinASymbol}-${coinBSymbol}`;

    // LP token description
    const lpDescription = "STEAMM LP Token";

    const structName = `STEAMM_LP_${coinASymbol}_${coinBSymbol}`;
    const moduleName = `steamm_lp_${coinASymbol}_${coinBSymbol}`;

    const bytecode = await createCoinBytecode(
      structName.toUpperCase().replace(/\s+/g, "_"),
      moduleName.toLowerCase().replace(/\s+/g, "_"),
      lpSymbol,
      lpName,
      lpDescription,
      LP_TOKEN_URI,
    );

    // Step 1: Create the coin
    const tx = new Transaction();
    const [upgradeCap] = tx.publish({
      modules: [[...bytecode]],
      dependencies: [normalizeSuiAddress("0x1"), normalizeSuiAddress("0x2")],
    });

    tx.transferObjects([upgradeCap], tx.pure.address(sender));

    return tx;
  }

  public async createPool(
    tx: Transaction,
    publishTxResponse: SuiTransactionBlockResponse,
    args: {
      btokenTypeA: string;
      btokenTypeB: string;
      swapFeeBps: bigint;
      offset: bigint;
      coinMetaA: string;
      coinMetaB: string;
    },
  ) {
    // Step 2: Get the treasury Cap id from the transaction
    const [lpTreasuryId, lpMetadataId, lpTokenType] =
      getTreasuryAndCoinMeta(publishTxResponse);

    // wait until the sui rpc recognizes the treasuryCapId
    while (true) {
      const object = await this.sdk.fullClient.getObject({ id: lpTreasuryId });
      if (object.error) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        break;
      }
    }

    const callArgs = {
      coinTypeA: args.btokenTypeA,
      coinTypeB: args.btokenTypeB,
      lpTokenType: lpTokenType,
      registry: this.sdk.sdkOptions.steamm_config.config!.registryId,
      swapFeeBps: args.swapFeeBps,
      offset: args.offset,
      coinMetaA: args.coinMetaA,
      coinMetaB: args.coinMetaB,
      lpTokenMeta: lpMetadataId,
      lpTreasury: lpTreasuryId,
    };

    createPool(tx, callArgs, this.sdk.packageInfo());
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
