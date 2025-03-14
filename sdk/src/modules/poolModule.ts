import {
  Transaction,
  TransactionArgument,
  TransactionResult,
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
  createPool,
  createPoolAndShare,
  sharePool,
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
import { BankInfo, BankList, PoolInfo } from "../types";
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
    let poolInfo: PoolInfo;
    let bankInfoA: BankInfo;
    let bankInfoB: BankInfo;
    if (args.poolInfo && args.bankInfoA && args.bankInfoB) {
      poolInfo = args.poolInfo;
      bankInfoA = args.bankInfoA;
      bankInfoB = args.bankInfoB;
    } else {
      const pools = await this.sdk.getPools();
      const bankList = await this.sdk.getBanks();

      poolInfo = pools.find((pool) => pool.poolId === args.pool!)!;
      bankInfoA = bankList[args.coinTypeA!];
      bankInfoB = bankList[args.coinTypeB!];
    }

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
    let poolInfo: PoolInfo;
    let bankInfoA: BankInfo;
    let bankInfoB: BankInfo;
    if (args.poolInfo && args.bankInfoA && args.bankInfoB) {
      poolInfo = args.poolInfo;
      bankInfoA = args.bankInfoA;
      bankInfoB = args.bankInfoB;
    } else {
      const pools = await this.sdk.getPools();
      const bankList = await this.sdk.getBanks();

      poolInfo = pools.find((pool) => pool.poolId === args.pool!)!;
      bankInfoA = bankList[args.coinTypeA!];
      bankInfoB = bankList[args.coinTypeB!];
    }

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const [coinA, coinB, redeemResult] = poolScript.redeemLiquidity(tx, {
      lpCoin: tx.object(args.lpCoin),
      minA: args.minA,
      minB: args.minB,
    });

    return [coinA, coinB, redeemResult];
  }

  public async redeemLiquidityWithProvisionEntry(
    tx: Transaction,
    args: RedeemLiquidityArgs,
  ) {
    const [coinA, coinB, _redeemResult] =
      await this.redeemLiquidityWithProvision(tx, args);

    tx.transferObjects([coinA, coinB], this.sdk.senderAddress);
  }

  public async redeemLiquidityWithProvision(
    tx: Transaction,
    args: RedeemLiquidityArgs,
  ): Promise<[TransactionArgument, TransactionArgument, TransactionArgument]> {
    let poolInfo: PoolInfo;
    let bankInfoA: BankInfo;
    let bankInfoB: BankInfo;
    if (args.poolInfo && args.bankInfoA && args.bankInfoB) {
      poolInfo = args.poolInfo;
      bankInfoA = args.bankInfoA;
      bankInfoB = args.bankInfoB;
    } else {
      const pools = await this.sdk.getPools();
      const bankList = await this.sdk.getBanks();

      poolInfo = pools.find((pool) => pool.poolId === args.pool!)!;
      bankInfoA = bankList[args.coinTypeA!];
      bankInfoB = bankList[args.coinTypeB!];
    }

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const [coinA, coinB, redeemResult] =
      poolScript.redeemLiquidityWithProvision(tx, {
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
    let poolInfo: PoolInfo;
    let bankInfoA: BankInfo;
    let bankInfoB: BankInfo;
    if (args.poolInfo && args.bankInfoA && args.bankInfoB) {
      poolInfo = args.poolInfo;
      bankInfoA = args.bankInfoA;
      bankInfoB = args.bankInfoB;
    } else {
      const pools = await this.sdk.getPools();
      const bankList = await this.sdk.getBanks();

      poolInfo = pools.find((pool) => pool.poolId === args.pool!)!;
      bankInfoA = bankList[args.coinTypeA!];
      bankInfoB = bankList[args.coinTypeB!];
    }

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
    let poolInfo: PoolInfo;
    let bankInfoA: BankInfo;
    let bankInfoB: BankInfo;
    if (args.poolInfo && args.bankInfoA && args.bankInfoB) {
      poolInfo = args.poolInfo;
      bankInfoA = args.bankInfoA;
      bankInfoB = args.bankInfoB;
    } else {
      const pools = await this.sdk.getPools();
      const bankList = await this.sdk.getBanks();

      poolInfo = pools.find((pool) => pool.poolId === args.pool!)!;
      bankInfoA = this.getBankInfoByBToken(bankList, poolInfo.coinTypeA);
      bankInfoB = this.getBankInfoByBToken(bankList, poolInfo.coinTypeB);
    }

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    poolScript.quoteSwap(tx, {
      a2b: args.a2b,
      amountIn: args.amountIn,
    });

    return castSwapQuote(await this.getQuoteResult<SwapQuote>(tx, "SwapQuote"));
  }

  public async quoteDeposit(
    args: QuoteDepositArgs,
    tx: Transaction = new Transaction(),
  ): Promise<DepositQuote> {
    let poolInfo: PoolInfo;
    let bankInfoA: BankInfo;
    let bankInfoB: BankInfo;
    if (args.poolInfo && args.bankInfoA && args.bankInfoB) {
      poolInfo = args.poolInfo;
      bankInfoA = args.bankInfoA;
      bankInfoB = args.bankInfoB;
    } else {
      const pools = await this.sdk.getPools();
      const bankList = await this.sdk.getBanks();

      poolInfo = pools.find((pool) => pool.poolId === args.pool!)!;
      bankInfoA = this.getBankInfoByBToken(bankList, poolInfo.coinTypeA);
      bankInfoB = this.getBankInfoByBToken(bankList, poolInfo.coinTypeB);
    }

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    poolScript.quoteDeposit(tx, {
      maxA: args.maxA,
      maxB: args.maxB,
    });

    return castDepositQuote(
      await this.getQuoteResult<DepositQuote>(tx, "DepositQuote"),
    );
  }

  public async quoteRedeem(
    args: QuoteRedeemArgs,
    tx: Transaction = new Transaction(),
  ): Promise<RedeemQuote> {
    let poolInfo: PoolInfo;
    let bankInfoA: BankInfo;
    let bankInfoB: BankInfo;
    if (args.poolInfo && args.bankInfoA && args.bankInfoB) {
      poolInfo = args.poolInfo;
      bankInfoA = args.bankInfoA;
      bankInfoB = args.bankInfoB;
    } else {
      const pools = await this.sdk.getPools();
      const bankList = await this.sdk.getBanks();

      poolInfo = pools.find((pool) => pool.poolId === args.pool)!;
      bankInfoA = this.getBankInfoByBToken(bankList, poolInfo.coinTypeA);
      bankInfoB = this.getBankInfoByBToken(bankList, poolInfo.coinTypeB);
    }

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

  public async createPool(
    args: CreatePoolArgs,
    tx: Transaction,
  ): Promise<TransactionResult> {
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

    const callArgs = {
      coinTypeA: args.btokenTypeA,
      coinMetaA: args.coinMetaA,
      coinTypeB: args.btokenTypeB,
      coinMetaB: args.coinMetaB,
      lpTreasury: args.lpTreasuryId,
      lpTokenType: args.lpTokenType,
      lpTokenMeta: args.lpMetadataId,
      swapFeeBps: args.swapFeeBps,
      offset: args.offset,
      registry: this.sdk.sdkOptions.steamm_config.config!.registryId,
    };

    return createPool(tx, callArgs, this.sdk.packageInfo());
  }

  public async sharePool(args: SharePoolArgs, tx: Transaction) {
    const callArgs = {
      pool: args.pool,
      lpTokenType: args.lpTokenType,
      coinTypeA: args.btokenTypeA,
      coinTypeB: args.btokenTypeB,
    };

    sharePool(tx, callArgs, this.sdk.packageInfo());
  }

  public async createPoolAndShare(args: CreatePoolArgs, tx: Transaction) {
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

    const callArgs = {
      coinTypeA: args.btokenTypeA,
      coinMetaA: args.coinMetaA,
      coinTypeB: args.btokenTypeB,
      coinMetaB: args.coinMetaB,
      lpTreasury: args.lpTreasuryId,
      lpTokenType: args.lpTokenType,
      lpTokenMeta: args.lpMetadataId,
      swapFeeBps: args.swapFeeBps,
      offset: args.offset,
      registry: this.sdk.sdkOptions.steamm_config.config!.registryId,
    };

    createPoolAndShare(tx, callArgs, this.sdk.packageInfo());
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
  pool?: SuiAddressType;
  coinTypeA?: SuiTypeName;
  coinTypeB?: SuiTypeName;
  poolInfo?: PoolInfo;
  bankInfoA?: BankInfo;
  bankInfoB?: BankInfo;
};

export type RedeemLiquidityArgs = PoolRedeemLiquidityArgs & {
  pool?: SuiAddressType;
  coinTypeA?: SuiTypeName;
  coinTypeB?: SuiTypeName;
  poolInfo?: PoolInfo;
  bankInfoA?: BankInfo;
  bankInfoB?: BankInfo;
};

export type SwapArgs = PoolSwapArgs & {
  pool?: SuiAddressType;
  coinTypeA?: SuiTypeName;
  coinTypeB?: SuiTypeName;
  poolInfo?: PoolInfo;
  bankInfoA?: BankInfo;
  bankInfoB?: BankInfo;
};

export type QuoteSwapArgs = PoolQuoteSwapArgs & {
  pool?: SuiAddressType;
  poolInfo?: PoolInfo;
  bankInfoA?: BankInfo;
  bankInfoB?: BankInfo;
};

export type QuoteDepositArgs = PoolQuoteDepositArgs & {
  pool?: SuiAddressType;
  poolInfo?: PoolInfo;
  bankInfoA?: BankInfo;
  bankInfoB?: BankInfo;
};

export type QuoteRedeemArgs = PoolQuoteRedeemArgs & {
  pool?: SuiAddressType;
  poolInfo?: PoolInfo;
  bankInfoA?: BankInfo;
  bankInfoB?: BankInfo;
};

export type CreatePoolArgs = {
  btokenTypeA: string;
  coinMetaA: string;
  btokenTypeB: string;
  coinMetaB: string;
  lpTreasuryId: string;
  lpTokenType: string;
  lpMetadataId: string;
  swapFeeBps: bigint;
  offset: bigint;
};

export type SharePoolArgs = {
  pool: TransactionResult;
  btokenTypeA: string;
  btokenTypeB: string;
  lpTokenType: string;
};
