import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import {
  SwapQuote,
  createConstantProductPool,
  createConstantProductPoolAndShare,
  createOraclePool,
  createOraclePoolAndShare,
  shareConstantProductPool,
  shareOraclePool,
} from "../base";
import {
  DepositQuote,
  RedeemQuote,
  castDepositQuote,
  castRedeemQuote,
  castSwapQuote,
} from "../base/pool/poolTypes";
import { OracleSwapExtraArgs } from "../base/quoters/oracleQuoter/args";
import { IManager } from "../interfaces/IManager";
import { SteammSDK } from "../sdk";
import { BankInfo, BankList, PoolInfo, getQuoterType } from "../types";
import { SuiTypeName } from "../utils";
import { SuiAddressType } from "../utils";

import { getOracleArgs } from "./oracle";

import {
  CreatePoolParams,
  DepositLiquidityParams,
  QuoteDepositParams,
  QuoteRedeemParams,
  QuoteSwapParams,
  RedeemLiquidityParams,
  SharePoolParams,
  SwapParams,
} from ".";

/**
 * Helper class to help interact with pools.
 */
export class PoolManager implements IManager {
  protected _sdk: SteammSDK;

  constructor(sdk: SteammSDK) {
    this._sdk = sdk;
  }

  get sdk() {
    return this._sdk;
  }

  public async depositLiquidityEntry(
    tx: Transaction,
    args: DepositLiquidityParams,
  ) {
    const [lpToken, _depositResult] = await this.depositLiquidity(tx, args);

    tx.transferObjects([lpToken], this.sdk.senderAddress);
  }

  public async depositLiquidity(
    tx: Transaction,
    args: DepositLiquidityParams,
  ): Promise<[TransactionArgument, TransactionArgument]> {
    const [poolInfo, bankInfoA, bankInfoB] =
      await this.getPoolAndBankInfos(args);

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
    args: RedeemLiquidityParams,
  ) {
    const [coinA, coinB, _redeemResult] = await this.redeemLiquidity(tx, args);

    tx.transferObjects([coinA, coinB], this.sdk.senderAddress);
  }

  public async redeemLiquidity(
    tx: Transaction,
    args: RedeemLiquidityParams,
  ): Promise<[TransactionArgument, TransactionArgument, TransactionArgument]> {
    const [poolInfo, bankInfoA, bankInfoB] =
      await this.getPoolAndBankInfos(args);

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
    args: RedeemLiquidityParams,
  ) {
    const [coinA, coinB, _redeemResult] =
      await this.redeemLiquidityWithProvision(tx, args);

    tx.transferObjects([coinA, coinB], this.sdk.senderAddress);
  }

  public async redeemLiquidityWithProvision(
    tx: Transaction,
    args: RedeemLiquidityParams,
  ): Promise<[TransactionArgument, TransactionArgument, TransactionArgument]> {
    const [poolInfo, bankInfoA, bankInfoB] =
      await this.getPoolAndBankInfos(args);

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
    args: SwapParams,
  ): Promise<TransactionArgument> {
    const [poolInfo, bankInfoA, bankInfoB] =
      await this.getPoolAndBankInfos(args);

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const quoterType = getQuoterType(poolInfo.quoterType);
    const extraArgs: OracleSwapExtraArgs | { type: "ConstantProduct" } =
      quoterType === "Oracle"
        ? await getOracleArgs(this.sdk, tx, poolInfo)
        : { type: "ConstantProduct" };

    const swapResult = poolScript.swap(tx, {
      ...args,
      ...extraArgs,
    });

    return swapResult;
  }

  public async quoteSwap(
    args: QuoteSwapParams,
    tx: Transaction = new Transaction(),
  ): Promise<SwapQuote> {
    const [poolInfo, bankInfoA, bankInfoB] =
      await this.getPoolAndBankInfosForQuote(args);

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    console.log("POOL INFO: ", poolInfo);
    const quoterType = getQuoterType(poolInfo.quoterType);
    const extraArgs: OracleSwapExtraArgs | { type: "ConstantProduct" } =
      quoterType === "Oracle"
        ? await getOracleArgs(this.sdk, tx, poolInfo)
        : { type: "ConstantProduct" };

    poolScript.quoteSwap(tx, { ...args, ...extraArgs });

    return castSwapQuote(await this.getQuoteResult<SwapQuote>(tx, "SwapQuote"));
  }

  public async quoteDeposit(
    args: QuoteDepositParams,
    tx: Transaction = new Transaction(),
  ): Promise<DepositQuote> {
    const [poolInfo, bankInfoA, bankInfoB] =
      await this.getPoolAndBankInfosForQuote(args);

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
    args: QuoteRedeemParams,
    tx: Transaction = new Transaction(),
  ): Promise<RedeemQuote> {
    const [poolInfo, bankInfoA, bankInfoB] =
      await this.getPoolAndBankInfosForQuote(args);

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
    tx: Transaction,
    args: CreatePoolParams,
  ): Promise<TransactionResult> {
    // wait until the sui rpc recognizes the treasuryCapId
    while (true) {
      const object = await this.sdk.fullClient.getObject({
        id: args.lpTreasuryId as any, // TODO: Fix this
      });
      if (object.error) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        break;
      }
    }

    switch (args.type) {
      case "ConstantProduct":
        return createConstantProductPool(
          tx,
          {
            ...args,
            registry: this.sdk.sdkOptions.steammConfig.config!.registryId,
          },
          this.sdk.packageInfo(),
        );
      case "Oracle":
        return createOraclePool(
          tx,
          {
            ...args,
            registry: this.sdk.sdkOptions.steammConfig.config!.registryId,
            lendingMarket:
              this.sdk.sdkOptions.suilendConfig.config!.lendingMarketId,
            oracleRegistry:
              this.sdk.sdkOptions.oracleConfig.config!.oracleRegistryId,
            lendingMarketType:
              this.sdk.sdkOptions.suilendConfig.config!.lendingMarketType,
          },
          this.sdk.packageInfo(),
        );
      default:
        throw new Error("Unknown pool type");
    }
  }

  public async sharePool(args: SharePoolParams, tx: Transaction) {
    switch (args.type) {
      case "ConstantProduct":
        shareConstantProductPool(
          tx,
          args,
          this.sdk.packageInfo(),
          this.sdk.sdkOptions,
        );
        break;
      case "Oracle":
        shareOraclePool(tx, args, this.sdk.packageInfo(), this.sdk.sdkOptions);
        break;
      default:
        throw new Error("Unknown pool type");
    }
  }

  public async createPoolAndShare(
    tx: Transaction,
    args: CreatePoolParams,
  ): Promise<TransactionResult> {
    // wait until the sui rpc recognizes the treasuryCapId
    while (true) {
      const object = await this.sdk.fullClient.getObject({
        id: args.lpTreasuryId as any, // TODO: Fix this
      });
      if (object.error) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        break;
      }
    }

    switch (args.type) {
      case "ConstantProduct":
        return createConstantProductPoolAndShare(
          tx,
          {
            ...args,
            registry: this.sdk.sdkOptions.steammConfig.config!.registryId,
          },
          this.sdk.packageInfo(),
          this.sdk.sdkOptions,
        );
      case "Oracle":
        return createOraclePoolAndShare(
          tx,
          {
            ...args,
            registry: this.sdk.sdkOptions.steammConfig.config!.registryId,
            lendingMarket:
              this.sdk.sdkOptions.suilendConfig.config!.lendingMarketId,
            oracleRegistry:
              this.sdk.sdkOptions.oracleConfig.config!.oracleRegistryId,
            lendingMarketType:
              this.sdk.sdkOptions.suilendConfig.config!.lendingMarketType,
          },
          this.sdk.packageInfo(),
          this.sdk.sdkOptions,
        );
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
      console.log(tx.getData());
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
  async getPoolAndBankInfos(
    args:
      | {
          pool: SuiAddressType;
          coinTypeA: SuiTypeName;
          coinTypeB: SuiTypeName;
        }
      | {
          poolInfo: PoolInfo;
          bankInfoA: BankInfo;
          bankInfoB: BankInfo;
        },
  ): Promise<[PoolInfo, BankInfo, BankInfo]> {
    let poolInfo: PoolInfo;
    let bankInfoA: BankInfo;
    let bankInfoB: BankInfo;

    if ("pool" in args) {
      const pools = await this.sdk.getPools();
      const bankList = await this.sdk.getBanks();

      poolInfo = pools.find((pool) => pool.poolId === args.pool!)!;
      bankInfoA = bankList[args.coinTypeA!];
      bankInfoB = bankList[args.coinTypeB!];
    } else {
      poolInfo = args.poolInfo!;
      bankInfoA = args.bankInfoA!;
      bankInfoB = args.bankInfoB!;
    }

    return [poolInfo, bankInfoA, bankInfoB];
  }

  async getPoolAndBankInfosForQuote(
    args:
      | { pool: SuiAddressType }
      | {
          poolInfo: PoolInfo;
          bankInfoA: BankInfo;
          bankInfoB: BankInfo;
        },
  ): Promise<[PoolInfo, BankInfo, BankInfo]> {
    let poolInfo: PoolInfo;
    let bankInfoA: BankInfo;
    let bankInfoB: BankInfo;

    if ("pool" in args) {
      const pools = await this.sdk.getPools();
      const bankList = await this.sdk.getBanks();

      poolInfo = pools.find((pool) => pool.poolId === args.pool!)!;
      bankInfoA = this.getBankInfoByBToken(bankList, poolInfo.coinTypeA);
      bankInfoB = this.getBankInfoByBToken(bankList, poolInfo.coinTypeB);
    } else {
      poolInfo = args.poolInfo!;
      bankInfoA = args.bankInfoA!;
      bankInfoB = args.bankInfoB!;
    }

    return [poolInfo, bankInfoA, bankInfoB];
  }
}
