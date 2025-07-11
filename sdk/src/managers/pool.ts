import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";
import {
  SUI_CLOCK_OBJECT_ID,
  normalizeSuiAddress,
  toHex,
} from "@mysten/sui/utils";

import { Codegen } from "..";
import { PriceInfoObject } from "../_codegen/_generated/_dependencies/source/0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e/price-info/structs";
import { SwapQuote } from "../abis";
import {
  DepositQuote,
  RedeemQuote,
  castDepositQuote,
  castRedeemQuote,
  castSwapQuote,
} from "../abis/pool/poolTypes";
import {
  createConstantProductPool,
  createConstantProductPoolAndShare,
  shareConstantProductPool,
} from "../abis/quoters/constantProduct";
import {
  createOraclePool,
  createOraclePoolAndShare,
  shareOraclePool,
} from "../abis/quoters/oracleV1";
import { OracleSwapExtraArgs } from "../abis/quoters/oracleV1/args";
import {
  createOracleV2Pool,
  createOracleV2PoolAndShare,
  shareOracleV2Pool,
} from "../abis/quoters/oracleV2";
import { OracleV2SwapExtraArgs } from "../abis/quoters/oracleV2/args";
import { SteammSDK } from "../sdk";
import {
  BankInfo,
  BankList,
  OracleInfo,
  PoolInfo,
  getQuoterType,
} from "../types";
import { SuiTypeName } from "../utils";
import { SuiAddressType } from "../utils";

import {
  CreatePoolParams,
  DepositLiquidityParams,
  IManager,
  QuoteDepositParams,
  QuoteRedeemParams,
  QuoteSwapParams,
  RedeemLiquidityParams,
  SharePoolParams,
  SwapParams,
} from ".";

const STALENESS_THRESHOLD_SECONDS = 12;

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

    const poolScript = this.sdk.poolScript(poolInfo, bankInfoA, bankInfoB);

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

    const poolScript = this.sdk.poolScript(poolInfo, bankInfoA, bankInfoB);

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

    const poolScript = this.sdk.poolScript(poolInfo, bankInfoA, bankInfoB);

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

    const poolScript = this.sdk.poolScript(poolInfo, bankInfoA, bankInfoB);

    const quoterType = getQuoterType(poolInfo.quoterType);
    const extraArgs:
      | OracleSwapExtraArgs
      | OracleV2SwapExtraArgs
      | { type: "ConstantProduct" } =
      quoterType === "Oracle"
        ? await getOracleArgs(this.sdk, tx, poolInfo)
        : quoterType === "OracleV2"
          ? await getOracleV2Args(this.sdk, tx, poolInfo)
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

    const poolScript = this.sdk.poolScript(poolInfo, bankInfoA, bankInfoB);

    console.log("POOL INFO: ", poolInfo);
    const quoterType = getQuoterType(poolInfo.quoterType);
    const extraArgs:
      | OracleSwapExtraArgs
      | OracleV2SwapExtraArgs
      | { type: "ConstantProduct" } =
      quoterType === "Oracle"
        ? await getOracleArgs(this.sdk, tx, poolInfo)
        : quoterType === "OracleV2"
          ? await getOracleV2Args(this.sdk, tx, poolInfo)
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

    const poolScript = this.sdk.poolScript(poolInfo, bankInfoA, bankInfoB);

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

    const poolScript = this.sdk.poolScript(poolInfo, bankInfoA, bankInfoB);

    const bankA = this.sdk.bankAbi(bankInfoA);
    const bankB = this.sdk.bankAbi(bankInfoB);

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
            registry: this.sdk.sdkOptions.packages.steamm.config!.registryId,
          },
          this.sdk.steammInfo,
        );
      case "Oracle":
        return createOraclePool(
          tx,
          {
            ...args,
            registry: this.sdk.sdkOptions.packages.steamm.config!.registryId,
            lendingMarket:
              this.sdk.sdkOptions.packages.suilend.config!.lendingMarketId,
            oracleRegistry:
              this.sdk.sdkOptions.packages.oracle.config!.oracleRegistryId,
            lendingMarketType:
              this.sdk.sdkOptions.packages.suilend.config!.lendingMarketType,
          },
          this.sdk.steammInfo,
        );
      case "OracleV2":
        return createOracleV2Pool(
          tx,
          {
            ...args,
            registry: this.sdk.sdkOptions.packages.steamm.config!.registryId,
            lendingMarket:
              this.sdk.sdkOptions.packages.suilend.config!.lendingMarketId,
            oracleRegistry:
              this.sdk.sdkOptions.packages.oracle.config!.oracleRegistryId,
            lendingMarketType:
              this.sdk.sdkOptions.packages.suilend.config!.lendingMarketType,
          },
          this.sdk.steammInfo,
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
          this.sdk.steammInfo,
          this.sdk.sdkOptions,
        );
        break;
      case "Oracle":
        shareOraclePool(tx, args, this.sdk.steammInfo, this.sdk.sdkOptions);
        break;
      case "OracleV2":
        shareOracleV2Pool(tx, args, this.sdk.steammInfo, this.sdk.sdkOptions);
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
            registry: this.sdk.sdkOptions.packages.steamm.config!.registryId,
          },
          this.sdk.steammInfo,
          this.sdk.sdkOptions,
        );
      case "Oracle":
        return createOraclePoolAndShare(
          tx,
          {
            ...args,
            registry: this.sdk.sdkOptions.packages.steamm.config!.registryId,
            lendingMarket:
              this.sdk.sdkOptions.packages.suilend.config!.lendingMarketId,
            oracleRegistry:
              this.sdk.sdkOptions.packages.oracle.config!.oracleRegistryId,
            lendingMarketType:
              this.sdk.sdkOptions.packages.suilend.config!.lendingMarketType,
          },
          this.sdk.steammInfo,
          this.sdk.sdkOptions,
        );
      case "OracleV2":
        return createOracleV2PoolAndShare(
          tx,
          {
            ...args,
            registry: this.sdk.sdkOptions.packages.steamm.config!.registryId,
            lendingMarket:
              this.sdk.sdkOptions.packages.suilend.config!.lendingMarketId,
            oracleRegistry:
              this.sdk.sdkOptions.packages.oracle.config!.oracleRegistryId,
            lendingMarketType:
              this.sdk.sdkOptions.packages.suilend.config!.lendingMarketType,
          },
          this.sdk.steammInfo,
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
      event.type.includes(`${this.sdk.originalId}::quote::${quoteType}`),
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

  public collectProtocolFees(
    poolInfo: PoolInfo,
    tx: Transaction,
  ): [TransactionArgument, TransactionArgument] {
    const pool = this.sdk.poolAbi(poolInfo);

    const [coinA, coinB] = pool.collectProtocolFees(tx, {
      globalAdmin: this.sdk.sdkOptions.packages.steamm.config!.globalAdmin,
    });

    return [coinA, coinB];
  }

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
      const pools = await this.sdk.fetchPoolData();
      const bankList = await this.sdk.fetchBankData();

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
      const pools = await this.sdk.fetchPoolData();
      const bankList = await this.sdk.fetchBankData();

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

export async function getOracleArgs(
  sdk: SteammSDK,
  tx: Transaction,
  poolInfo: PoolInfo,
): Promise<OracleSwapExtraArgs> {
  const oracleData: OracleInfo[] = await sdk.fetchOracleData();

  const oracleInfoA = oracleData.find(
    (oracle) => oracle.oracleIndex === poolInfo.quoterData?.oracleIndexA,
  );

  if (!oracleInfoA) {
    throw new Error("Oracle info A not found");
  }

  const oracleInfoB = oracleData.find(
    (oracle) => oracle.oracleIndex === poolInfo.quoterData?.oracleIndexB,
  ) as OracleInfo;

  if (!oracleInfoB) {
    throw new Error("Oracle info B not found");
  }

  // assuming oracles are of type pyth
  if (oracleInfoA.oracleType !== "pyth" || oracleInfoB.oracleType !== "pyth") {
    throw new Error("unimplemented: switchboard");
  }

  console.log("oracleInfoA: ", oracleInfoA);
  console.log("oracleInfoB: ", oracleInfoB);

  let priceInfoObjectIdA;
  let priceInfoObjectIdB;
  if (sdk.sdkOptions.enableTestMode) {
    priceInfoObjectIdA = sdk.getMockOraclePriceObject(
      toHex(new Uint8Array(oracleInfoA.oracleIdentifier as number[])),
    );
    priceInfoObjectIdB = sdk.getMockOraclePriceObject(
      toHex(new Uint8Array(oracleInfoB.oracleIdentifier as number[])),
    );
  } else {
    priceInfoObjectIdA = (await sdk.pythClient.getPriceFeedObjectId(
      toHex(new Uint8Array(oracleInfoA.oracleIdentifier as number[])),
    )) as string;
    priceInfoObjectIdB = (await sdk.pythClient.getPriceFeedObjectId(
      toHex(new Uint8Array(oracleInfoB.oracleIdentifier as number[])),
    )) as string;

    console.log("price id from feedA: ", priceInfoObjectIdA);
    console.log("price id from feedB: ", priceInfoObjectIdB);
  }

  const feedIdentifiers: Record<string, string> = {};
  const priceInfoObjectIds: string[] = [];
  const stalePriceIdentifiers: string[] = [];
  priceInfoObjectIds.push(priceInfoObjectIdA);
  priceInfoObjectIds.push(priceInfoObjectIdB);
  feedIdentifiers[priceInfoObjectIdA] = toHex(
    new Uint8Array(oracleInfoA.oracleIdentifier as number[]),
  );
  feedIdentifiers[priceInfoObjectIdB] = toHex(
    new Uint8Array(oracleInfoB.oracleIdentifier as number[]),
  );

  for (const priceInfoObjectId of priceInfoObjectIds) {
    const priceInfoObject = await PriceInfoObject.fetch(
      sdk.fullClient,
      priceInfoObjectId,
    );

    const publishTime = priceInfoObject.priceInfo.priceFeed.price.timestamp;
    const stalenessSeconds = Date.now() / 1000 - Number(publishTime);

    console.log("Date now: ", Date.now() / 1000);
    console.log("Publish time: ", publishTime);
    console.log("Staleness: ", stalenessSeconds);
    if (stalenessSeconds > STALENESS_THRESHOLD_SECONDS) {
      stalePriceIdentifiers.push(feedIdentifiers[priceInfoObjectId]);
    }
  }

  if (stalePriceIdentifiers.length > 0) {
    console.log("PRICE STALE...");
    console.log("identifiers: ", stalePriceIdentifiers);
    const stalePriceUpdateData =
      await sdk.pythConnection.getPriceFeedsUpdateData(stalePriceIdentifiers);
    await sdk.pythClient.updatePriceFeeds(
      tx,
      stalePriceUpdateData,
      stalePriceIdentifiers,
    );
  }

  const oraclePriceA = Codegen.Oracle.getPythPrice(
    tx,
    {
      registry: tx.object(
        sdk.sdkOptions.packages.oracle.config?.oracleRegistryId as string,
      ),
      priceInfoObj: tx.object(priceInfoObjectIdA),
      oracleIndex: tx.pure.u64(oracleInfoA.oracleIndex),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    },
    sdk.sdkOptions.packages.oracle.publishedAt,
  );

  const oraclePriceB = Codegen.Oracle.getPythPrice(
    tx,
    {
      registry: tx.object(
        sdk.sdkOptions.packages.oracle.config?.oracleRegistryId as string,
      ),
      priceInfoObj: tx.object(priceInfoObjectIdB),
      oracleIndex: tx.pure.u64(oracleInfoB.oracleIndex),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    },
    sdk.sdkOptions.packages.oracle.publishedAt,
  );

  return {
    type: "Oracle",
    oraclePriceA,
    oraclePriceB,
  };
}

export async function getOracleV2Args(
  sdk: SteammSDK,
  tx: Transaction,
  poolInfo: PoolInfo,
): Promise<OracleV2SwapExtraArgs> {
  const oracleData: OracleInfo[] = await sdk.fetchOracleData();

  const oracleInfoA = oracleData.find(
    (oracle) => oracle.oracleIndex === poolInfo.quoterData?.oracleIndexA,
  );

  if (!oracleInfoA) {
    throw new Error("Oracle info A not found");
  }

  const oracleInfoB = oracleData.find(
    (oracle) => oracle.oracleIndex === poolInfo.quoterData?.oracleIndexB,
  ) as OracleInfo;

  if (!oracleInfoB) {
    throw new Error("Oracle info B not found");
  }

  // assuming oracles are of type pyth
  if (oracleInfoA.oracleType !== "pyth" || oracleInfoB.oracleType !== "pyth") {
    throw new Error("unimplemented: switchboard");
  }

  let priceInfoObjectIdA;
  let priceInfoObjectIdB;
  if (sdk.sdkOptions.enableTestMode) {
    priceInfoObjectIdA = sdk.getMockOraclePriceObject(
      toHex(new Uint8Array(oracleInfoA.oracleIdentifier as number[])),
    );
    priceInfoObjectIdB = sdk.getMockOraclePriceObject(
      toHex(new Uint8Array(oracleInfoB.oracleIdentifier as number[])),
    );
  } else {
    priceInfoObjectIdA = (await sdk.pythClient.getPriceFeedObjectId(
      toHex(new Uint8Array(oracleInfoA.oracleIdentifier as number[])),
    )) as string;
    priceInfoObjectIdB = (await sdk.pythClient.getPriceFeedObjectId(
      toHex(new Uint8Array(oracleInfoB.oracleIdentifier as number[])),
    )) as string;

    console.log("price id from feedA: ", priceInfoObjectIdA);
    console.log("price id from feedB: ", priceInfoObjectIdB);
  }

  const feedIdentifiers: Record<string, string> = {};
  const priceInfoObjectIds: string[] = [];
  const stalePriceIdentifiers: string[] = [];
  priceInfoObjectIds.push(priceInfoObjectIdA);
  priceInfoObjectIds.push(priceInfoObjectIdB);
  feedIdentifiers[priceInfoObjectIdA] = toHex(
    new Uint8Array(oracleInfoA.oracleIdentifier as number[]),
  );
  feedIdentifiers[priceInfoObjectIdB] = toHex(
    new Uint8Array(oracleInfoB.oracleIdentifier as number[]),
  );

  for (const priceInfoObjectId of priceInfoObjectIds) {
    const priceInfoObject = await PriceInfoObject.fetch(
      sdk.fullClient,
      priceInfoObjectId,
    );

    const publishTime = priceInfoObject.priceInfo.priceFeed.price.timestamp;
    const stalenessSeconds = Date.now() / 1000 - Number(publishTime);

    console.log("Date now: ", Date.now() / 1000);
    console.log("Publish time: ", publishTime);
    console.log("Staleness: ", stalenessSeconds);
    if (stalenessSeconds > STALENESS_THRESHOLD_SECONDS) {
      stalePriceIdentifiers.push(feedIdentifiers[priceInfoObjectId]);
    }
  }

  if (stalePriceIdentifiers.length > 0) {
    console.log("PRICE STALE...");
    console.log("identifiers: ", stalePriceIdentifiers);
    const stalePriceUpdateData =
      await sdk.pythConnection.getPriceFeedsUpdateData(stalePriceIdentifiers);
    await sdk.pythClient.updatePriceFeeds(
      tx,
      stalePriceUpdateData,
      stalePriceIdentifiers,
    );
  }

  const oraclePriceA = Codegen.Oracle.getPythPrice(
    tx,
    {
      registry: tx.object(
        sdk.sdkOptions.packages.oracle.config?.oracleRegistryId as string,
      ),
      priceInfoObj: tx.object(priceInfoObjectIdA),
      oracleIndex: tx.pure.u64(oracleInfoA.oracleIndex),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    },
    sdk.sdkOptions.packages.oracle.publishedAt,
  );

  const oraclePriceB = Codegen.Oracle.getPythPrice(
    tx,
    {
      registry: tx.object(
        sdk.sdkOptions.packages.oracle.config?.oracleRegistryId as string,
      ),
      priceInfoObj: tx.object(priceInfoObjectIdB),
      oracleIndex: tx.pure.u64(oracleInfoB.oracleIndex),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    },
    sdk.sdkOptions.packages.oracle.publishedAt,
  );

  return {
    type: "OracleV2",
    oraclePriceA,
    oraclePriceB,
  };
}

export async function initOracleRegistry(
  sdk: SteammSDK,
  tx: Transaction,
  args: {
    pythMaxStalenessThresholdS: number;
    pythMaxConfidenceIntervalPct: number;
    switchboardMaxStalenessThresholdS: number;
    switchboardMaxConfidenceIntervalPct: number;
  },
) {
  const pubAt = sdk.sdkOptions.packages.oracle.publishedAt;
  const pkgId = sdk.sdkOptions.packages.oracle.packageId;

  const config = Codegen.Oracle.newOracleRegistryConfig(
    tx,
    {
      pythMaxStalenessThresholdS: BigInt(args.pythMaxStalenessThresholdS),
      pythMaxConfidenceIntervalPct: BigInt(args.pythMaxConfidenceIntervalPct),
      switchboardMaxStalenessThresholdS: BigInt(
        args.switchboardMaxStalenessThresholdS,
      ),
      switchboardMaxConfidenceIntervalPct: BigInt(
        args.switchboardMaxConfidenceIntervalPct,
      ),
    },
    pubAt,
  );

  const [oracleRegistry, adminCap] = Codegen.Oracle.newRegistry(
    tx,
    config,
    pubAt,
  );

  tx.transferObjects([adminCap], sdk.senderAddress);

  tx.moveCall({
    target: `0x2::transfer::public_share_object`,
    typeArguments: [`${pkgId}::oracles::OracleRegistry`],
    arguments: [oracleRegistry],
  });
}

export async function addOracleToRegistry(
  sdk: SteammSDK,
  tx: Transaction,
  args:
    | {
        type: "pyth";
        adminCap: SuiAddressType;
        priceInfoObj: SuiAddressType;
      }
    | {
        type: "switchboard";
        adminCap: SuiAddressType;
        aggregator: SuiAddressType;
      },
) {
  const pubAt = sdk.sdkOptions.packages.oracle.publishedAt;

  switch (args.type) {
    case "pyth":
      Codegen.Oracle.addPythOracle(
        tx,
        {
          registry: tx.object(
            sdk.sdkOptions.packages.oracle.config!.oracleRegistryId,
          ),
          adminCap: tx.object(args.adminCap),
          priceInfoObj: tx.object(args.priceInfoObj),
        },
        pubAt,
      );
      break;
    case "switchboard":
      throw new Error("Switchboard oracle type not implemented");
    default:
      throw new Error("Unknown oracle type");
  }
}
