import { Transaction, TransactionArgument } from "@mysten/sui/transactions";
import {
  SUI_CLOCK_OBJECT_ID,
  normalizeSuiAddress,
  toHex,
} from "@mysten/sui/utils";

import { OracleFunctions } from "../_codegen";
import { PriceInfoObject } from "../_codegen/_generated/_dependencies/source/0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e/price-info/structs";
import { getPythPrice } from "../_codegen/oracleFunctions";
import {
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
import { OracleSwapExtraArgs } from "../base/quoters/oracleQuoter/args";
import { IModule } from "../interfaces/IModule";
import { SteammSDK } from "../sdk";
import { BankList, OracleInfo, PoolInfo, getQuoterType } from "../types";
import { SuiAddressType } from "../utils";

import {
  CreatePoolParams,
  DepositLiquidityParams,
  QuoteDepositParams,
  QuoteRedeemParams,
  QuoteSwapParams,
  RedeemLiquidityParams,
  SwapParams,
} from ".";

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
    args: DepositLiquidityParams,
  ) {
    const [lpToken, _depositResult] = await this.depositLiquidity(tx, args);

    tx.transferObjects([lpToken], this.sdk.senderAddress);
  }

  public async depositLiquidity(
    tx: Transaction,
    args: DepositLiquidityParams,
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
    args: RedeemLiquidityParams,
  ) {
    const [coinA, coinB, _redeemResult] = await this.redeemLiquidity(tx, args);

    tx.transferObjects([coinA, coinB], this.sdk.senderAddress);
  }

  public async redeemLiquidity(
    tx: Transaction,
    args: RedeemLiquidityParams,
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
    args: SwapParams,
  ): Promise<TransactionArgument> {
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const poolInfo: PoolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankInfoA = bankList[args.coinTypeA];
    const bankInfoB = bankList[args.coinTypeB];

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
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const poolInfo: PoolInfo = pools.find((pool) => pool.poolId === args.pool)!;
    const bankInfoA = this.getBankInfoByBToken(bankList, poolInfo.coinTypeA);
    const bankInfoB = this.getBankInfoByBToken(bankList, poolInfo.coinTypeB);

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const quoterType = getQuoterType(poolInfo.quoterType);
    const extraArgs: OracleSwapExtraArgs | { type: "ConstantProduct" } =
      quoterType === "Oracle"
        ? await getOracleArgs(this.sdk, tx, poolInfo)
        : { type: "ConstantProduct" };

    poolScript.quoteSwap(tx, { ...args, ...extraArgs });

    return castSwapQuote(await this.getQuoteResult<SwapQuote>(tx, "SwapQuote"));
  }

  public async quoteDeposit(args: QuoteDepositParams): Promise<DepositQuote> {
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

  public async quoteRedeem(args: QuoteRedeemParams): Promise<RedeemQuote> {
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

  public async createPool(tx: Transaction, args: CreatePoolParams) {
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
            lendingMarket:
              this.sdk.sdkOptions.suilend_config.config!.lendingMarketId,
            oracleRegistry:
              this.sdk.sdkOptions.oracle_config.config!.oracleRegistryId,
            lendingMarketType:
              this.sdk.sdkOptions.suilend_config.config!.lendingMarketType,
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

export async function getOracleArgs(
  sdk: SteammSDK,
  tx: Transaction,
  poolInfo: PoolInfo,
): Promise<OracleSwapExtraArgs> {
  const oracleData: OracleInfo[] = await sdk.getOracles();

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
  }

  const priceInfoObjectIds: string[] = [];
  const stalePriceIdentifiers: string[] = [];
  priceInfoObjectIds.push(priceInfoObjectIdA);
  priceInfoObjectIds.push(priceInfoObjectIdB);

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
    if (stalenessSeconds > 20) {
      stalePriceIdentifiers.push(priceInfoObjectId);
    }
  }

  if (stalePriceIdentifiers.length > 0) {
    console.log("PRICE STALE...");
    const stalePriceUpdateData =
      await sdk.pythConnection.getPriceFeedsUpdateData(stalePriceIdentifiers);
    await sdk.pythClient.updatePriceFeeds(
      tx,
      stalePriceUpdateData,
      stalePriceIdentifiers,
    );
  }

  const oraclePriceA = getPythPrice(
    tx,
    {
      registry: tx.object(
        sdk.sdkOptions.oracle_config.config?.oracleRegistryId as string,
      ),
      priceInfoObj: tx.object(priceInfoObjectIdA),
      oracleIndex: tx.pure.u64(oracleInfoA.oracleIndex),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    },
    sdk.sdkOptions.oracle_config.published_at,
  );

  const oraclePriceB = getPythPrice(
    tx,
    {
      registry: tx.object(
        sdk.sdkOptions.oracle_config.config?.oracleRegistryId as string,
      ),
      priceInfoObj: tx.object(priceInfoObjectIdB),
      oracleIndex: tx.pure.u64(oracleInfoB.oracleIndex),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    },
    sdk.sdkOptions.oracle_config.published_at,
  );

  return {
    type: "Oracle",
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
  const pubAt = sdk.sdkOptions.oracle_config.published_at;
  const pkgId = sdk.sdkOptions.oracle_config.package_id;

  const config = OracleFunctions.newOracleRegistryConfig(
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

  const [oracleRegistry, adminCap] = OracleFunctions.newRegistry(
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
