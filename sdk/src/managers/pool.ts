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

import { OracleFunctions } from "../_codegen";
import { PriceInfoObject } from "../_codegen/_generated/_dependencies/source/0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e/price-info/structs";
import { getPythPrice } from "../_codegen/oracleFunctions";
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
  QuoteDepositParams,
  QuoteRedeemParams,
  QuoteSwapParams,
  RedeemLiquidityParams,
  SharePoolParams,
  SwapParams,
} from ".";

/**
 * PoolManager handles all pool-related operations in the STEAMM protocol including:
 * - Pool creation and initialization
 * - Liquidity provision and redemption
 * - Swapping tokens
 * - Price quotes for swaps and liquidity operations
 * - Oracle price feed management
 */
export class PoolManager implements IManager {
  protected _sdk: SteammSDK;

  constructor(sdk: SteammSDK) {
    this._sdk = sdk;
  }

  get sdk() {
    return this._sdk;
  }

  /**
   * Deposits liquidity into a pool and transfers the LP tokens to the sender
   * @param tx Transaction to add the operation to
   * @param args Parameters for the deposit including coin objects and amounts
   */
  public async depositLiquidityEntry(
    tx: Transaction,
    args: DepositLiquidityParams,
  ) {
    const [lpToken, _depositResult] = await this.depositLiquidity(tx, args);

    tx.transferObjects([lpToken], this.sdk.senderAddress);
  }

  /**
   * Deposits liquidity into a pool without transferring the LP tokens
   * @param tx Transaction to add the operation to
   * @param args Parameters for the deposit including coin objects and amounts
   * @returns Tuple of [lpToken, depositResult] transaction arguments
   */
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

  /**
   * Redeems liquidity from a pool and transfers the output tokens to the sender
   * @param tx Transaction to add the operation to
   * @param args Parameters for redemption including LP coin and minimum amounts
   */
  public async redeemLiquidityEntry(
    tx: Transaction,
    args: RedeemLiquidityParams,
  ) {
    const [coinA, coinB, _redeemResult] = await this.redeemLiquidity(tx, args);

    tx.transferObjects([coinA, coinB], this.sdk.senderAddress);
  }

  /**
   * Redeems liquidity from a pool without transferring the output tokens
   * @param tx Transaction to add the operation to
   * @param args Parameters for redemption including LP coin and minimum amounts
   * @returns Tuple of [coinA, coinB, redeemResult] transaction arguments
   */
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

  /**
   * Redeems liquidity from a pool with provision and transfers the output tokens to the sender.
   * This method includes any extra provision rewards in the redemption.
   * @param tx Transaction to add the operation to
   * @param args Parameters for redemption including LP coin and minimum amounts
   */
  public async redeemLiquidityWithProvisionEntry(
    tx: Transaction,
    args: RedeemLiquidityParams,
  ) {
    const [coinA, coinB, _redeemResult] =
      await this.redeemLiquidityWithProvision(tx, args);

    tx.transferObjects([coinA, coinB], this.sdk.senderAddress);
  }

  /**
   * Redeems liquidity from a pool with provision without transferring the output tokens.
   * This method includes any extra provision rewards in the redemption calculation.
   * @param tx Transaction to add the operation to
   * @param args Parameters for redemption including LP coin and minimum amounts
   * @returns Tuple of [coinA, coinB, redeemResult] transaction arguments representing the redeemed tokens and operation result
   */
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

  /**
   * Swaps tokens in a pool with oracle price verification if applicable
   * @param tx Transaction to add the operation to
   * @param args Parameters for the swap including input coin and amounts
   * @returns Transaction argument for the output coin
   */
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

  /**
   * Gets a quote for a potential swap without executing it
   * @param args Parameters to quote including amounts and pool info
   * @param tx Optional transaction to add the quote operation to
   * @returns Quote information including expected output amount
   */
  public async quoteSwap(
    args: QuoteSwapParams,
    tx: Transaction = new Transaction(),
  ): Promise<SwapQuote> {
    const [poolInfo, bankInfoA, bankInfoB] =
      await this.getPoolAndBankInfosForQuote(args);

    const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

    const quoterType = getQuoterType(poolInfo.quoterType);
    const extraArgs: OracleSwapExtraArgs | { type: "ConstantProduct" } =
      quoterType === "Oracle"
        ? await getOracleArgs(this.sdk, tx, poolInfo)
        : { type: "ConstantProduct" };

    poolScript.quoteSwap(tx, { ...args, ...extraArgs });

    return castSwapQuote(await this.getQuoteResult<SwapQuote>(tx, "SwapQuote"));
  }

  /**
   * Gets a quote for potential liquidity deposit without executing it
   * @param args Parameters to quote including maximum input amounts
   * @param tx Optional transaction to add the quote operation to
   * @returns Quote information including expected LP tokens to receive
   */
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

  /**
   * Gets a quote for potential liquidity redemption without executing it
   * @param args Parameters to quote including LP tokens to redeem
   * @param tx Optional transaction to add the quote operation to
   * @returns Quote information including expected output amounts
   */
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

  /**
   * Creates a new LP token for a pool
   * @param bytecode Bytecode for the LP token module
   * @param sender Address that will receive the upgrade capability
   * @returns Transaction with the publish operation
   */
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

  /**
   * Creates a new pool with the specified parameters
   * @param tx Transaction to add the creation operation to
   * @param args Parameters for pool creation including type and initial settings
   * @returns Transaction result from the creation
   */
  public async createPool(
    tx: Transaction,
    args: CreatePoolParams,
  ): Promise<TransactionResult> {
    // wait until the sui rpc recognizes the treasuryCapId
    while (true) {
      const object = await this.sdk.client.getObject({
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
        return createConstantProductPool(
          tx,
          {
            ...args,
            registry: this.sdk.sdkOptions.steamm_config.config!.registryId,
          },
          this.sdk.packageInfo(),
        );
      case "Oracle":
        return createOraclePool(
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
      default:
        throw new Error("Unknown pool type");
    }
  }

  /**
   * Shares an existing pool by making it publicly accessible
   * @param args Parameters for sharing the pool
   * @param tx Transaction to add the share operation to
   */
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

  /**
   * Creates a new pool and immediately shares it publicly
   * @param tx Transaction to add the creation and share operations to
   * @param args Parameters for pool creation including type and initial settings
   * @returns Transaction result from the creation
   */
  public async createPoolAndShare(
    tx: Transaction,
    args: CreatePoolParams,
  ): Promise<TransactionResult> {
    // wait until the sui rpc recognizes the treasuryCapId
    while (true) {
      const object = await this.sdk.client.getObject({
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
        return createConstantProductPoolAndShare(
          tx,
          {
            ...args,
            registry: this.sdk.sdkOptions.steamm_config.config!.registryId,
          },
          this.sdk.packageInfo(),
          this.sdk.sdkOptions,
        );
      case "Oracle":
        return createOraclePoolAndShare(
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
          this.sdk.sdkOptions,
        );
      default:
        throw new Error("Unknown pool type");
    }
  }

  /**
   * Retrieves the result of a quote operation from a transaction's inspect results
   * @param tx Transaction containing the quote operation
   * @param quoteType Type of quote to look for in events ('SwapQuote', 'DepositQuote', 'RedeemQuote')
   * @returns Quote result of type T from the transaction events
   * @throws Error if the inspect fails or quote event is not found
   * @private
   */
  private async getQuoteResult<T>(
    tx: Transaction,
    quoteType: string,
  ): Promise<T> {
    const inspectResults = await this.sdk.client.devInspectTransactionBlock({
      sender: this.sdk.senderAddress,
      transactionBlock: tx,
    });

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

  /**
   * Looks up bank info by its bToken type in the bank list
   * @param bankList Map of bank information
   * @param btokenType Type identifier for the bToken to look up
   * @returns Bank info for the matching bToken type
   * @throws Error if no matching bank info is found
   * @private
   */
  private getBankInfoByBToken(bankList: BankList, btokenType: string) {
    const bankInfo = Object.values(bankList).find(
      (bank) => bank.btokenType === btokenType,
    );

    if (!bankInfo) {
      throw new Error(`Bank info not found for btokenType: ${btokenType}`);
    }

    return bankInfo;
  }

  /**
   * Retrieves pool and bank information either from pool ID and coin types or from provided info objects
   * @param args Either an object containing pool ID and coin types, or an object containing pool and bank info objects
   * @param args.pool - (Optional) Pool ID to look up
   * @param args.coinTypeA - (Optional) Type of coin A when using pool ID
   * @param args.coinTypeB - (Optional) Type of coin B when using pool ID
   * @param args.poolInfo - (Optional) Pool info object when not using pool ID
   * @param args.bankInfoA - (Optional) Bank info object for coin A when not using pool ID
   * @param args.bankInfoB - (Optional) Bank info object for coin B when not using pool ID
   * @returns Promise resolving to tuple of [PoolInfo, BankInfo for coin A, BankInfo for coin B]
   */
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

  /**
   * Retrieves pool and bank information for quotes either from pool ID or from provided info objects
   * Similar to getPoolAndBankInfos but specifically for quote operations where bank info is derived from bToken types
   * @param args Either an object containing just pool ID or an object containing pool and bank info objects
   * @param args.pool - (Optional) Pool ID to look up
   * @param args.poolInfo - (Optional) Pool info object when not using pool ID
   * @param args.bankInfoA - (Optional) Bank info object for coin A when not using pool ID
   * @param args.bankInfoB - (Optional) Bank info object for coin B when not using pool ID
   * @returns Promise resolving to tuple of [PoolInfo, BankInfo for coin A, BankInfo for coin B]
   */
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

/**
 * Retrieves and verifies oracle price information for a swap operation
 * @param sdk - The STEAMM SDK instance
 * @param tx - The transaction to add oracle-related operations to
 * @param poolInfo - Information about the pool requiring oracle prices
 * @returns Promise resolving to oracle swap arguments containing price information for both tokens
 * @throws Error if oracle information cannot be found or prices are invalid
 */
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
      sdk.client,
      priceInfoObjectId,
    );

    const publishTime = priceInfoObject.priceInfo.priceFeed.price.timestamp;
    const stalenessSeconds = Date.now() / 1000 - Number(publishTime);

    // console.log("Date now: ", Date.now() / 1000);
    // console.log("Publish time: ", publishTime);
    // console.log("Staleness: ", stalenessSeconds);
    if (stalenessSeconds > 15) {
      stalePriceIdentifiers.push(feedIdentifiers[priceInfoObjectId]);
    }
  }

  if (stalePriceIdentifiers.length > 0) {
    // console.log("Price stale...");
    // console.log("Stale identifiers: ", stalePriceIdentifiers);
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
    sdk.sdkOptions.oracle_config.publishedAt,
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
    sdk.sdkOptions.oracle_config.publishedAt,
  );

  return {
    type: "Oracle",
    oraclePriceA,
    oraclePriceB,
  };
}

/**
 * Initializes a new oracle registry with configuration for both Pyth and Switchboard oracles
 * @param sdk - The STEAMM SDK instance
 * @param tx - The transaction to add registry initialization operations to
 * @param args - Configuration parameters for the oracle registry
 * @param args.pythMaxStalenessThresholdS - Maximum allowed staleness in seconds for Pyth oracle prices
 * @param args.pythMaxConfidenceIntervalPct - Maximum allowed confidence interval percentage for Pyth oracle prices
 * @param args.switchboardMaxStalenessThresholdS - Maximum allowed staleness in seconds for Switchboard oracle prices
 * @param args.switchboardMaxConfidenceIntervalPct - Maximum allowed confidence interval percentage for Switchboard oracle prices
 */
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
  const pubAt = sdk.sdkOptions.oracle_config.publishedAt;
  const pkgId = sdk.sdkOptions.oracle_config.packageId;

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
