import { Signer } from "@mysten/sui/cryptography";
import { normalizeStructTag } from "@mysten/sui/utils";
import {
  PriceFeed,
  SuiPriceServiceConnection,
  SuiPythClient,
} from "@pythnetwork/pyth-sui-js";
import BigNumber from "bignumber.js";

import {
  ParsedObligation,
  Side,
  SuilendClient,
  formatRewards,
  initializeObligations,
  initializeSuilend,
  toHexString,
} from "@suilend/sdk";
import {
  API_URL,
  NORMALIZED_STEAMM_POINTS_COINTYPE,
  getCoinMetadataMap,
  isSteammPoints,
} from "@suilend/sui-fe";

import { BankAbi, BankScript, PoolAbi, PoolScript } from "./abis";
import { PYTH_STATE_ID, WORMHOLE_STATE_ID } from "./config";
import { ASSETS_URL } from "./lib/constants";
import {
  BankObj,
  OracleObj,
  OracleType,
  ParsedBank,
  ParsedPool,
  PoolObj,
  getParsedBank,
  getParsedPool,
} from "./lib/parse";
import { BankManager } from "./managers/bank";
import { FullClient } from "./managers/client";
import { PoolManager } from "./managers/pool";
import { Router } from "./managers/router";
import {
  ApiBankCache,
  ApiOracleCache,
  ApiPoolCache,
  BankCache,
  BankInfo,
  BankList,
  DataPage,
  EventData,
  NewBankEvent,
  NewOracleQuoterEvent,
  NewOracleV2QuoterEvent,
  NewPoolEvent,
  OracleCache,
  OracleInfo,
  PackageInfo,
  PoolCache,
  PoolInfo,
  SdkOptions,
  SteammInfo,
  TestConfig,
  extractBankList,
  extractOracleQuoterInfo,
  extractOracleV2QuoterInfo,
  extractPoolInfo,
} from "./types";
import { SuiAddressType, patchFixSuiObjectId } from "./utils";

/**
 * The primary SDK class for interacting with the STEAMM protocol on Sui blockchain.
 *
 * SteammSDK provides comprehensive functionality for working with STEAMM pools, banks,
 * oracles and router functionality. It handles caching, transaction building, and
 * data fetching operations required to interact with the protocol.
 *
 * Key capabilities include:
 * - Pool management: create, deposit LP, withdraw LP, swap, query and interact with liquidity pools
 * - Bank operations: mint and burn btokens, rebalancing ops
 * - Routing: find optimal paths for token swaps
 * - Oracle integration: access price feed data via Pyth
 * - Position management: track and manage user LP positions
 * - Transaction construction: build, sign and execute protocol transactions
 *
 * The SDK uses a modular architecture with specialized managers for different
 * protocol components (Pool, Bank, Router) and maintains internal caches to
 * minimize redundant blockchain queries.
 *
 * @example
 * ```typescript
 * import {SteammSDK, MAINNET_CONFIG} from "@suilend/steamm-sdk";
 *
 * const sdk = new SteammSDK(MAINNET_CONFIG);
 *
 * // Connect a signer
 * sdk.signer = mySigner;
 *
 * // Fetch pool data
 * const pools = await sdk.fetchPoolData();
 * ```
 */
export class SteammSDK {
  protected _rpcClient: FullClient;
  protected _pool: PoolManager;
  protected _router: Router;
  protected _bank: BankManager;
  protected _sdkOptions: SdkOptions;
  protected _pools?: PoolCache;
  protected _banks?: BankCache;
  protected _oracleRegistry?: OracleCache;
  protected _pythClient: SuiPythClient;
  protected _pythConnection: SuiPriceServiceConnection;
  testConfig?: TestConfig;

  protected _apiOracles?: ApiOracleCache;
  protected _apiPools?: ApiPoolCache;
  protected _apiBanks?: ApiBankCache;

  protected _signer: Signer | undefined;
  protected _senderAddress = "";

  constructor(options: SdkOptions) {
    this._sdkOptions = {
      ...options,
      cache_refresh_ms: options.cache_refresh_ms ?? 5000,
    };
    this._rpcClient = new FullClient({
      url: options.fullRpcUrl,
    });

    this._pool = new PoolManager(this);
    this._bank = new BankManager(this);
    this._router = new Router(this);
    this._pythClient = new SuiPythClient(
      this._rpcClient,
      PYTH_STATE_ID,
      WORMHOLE_STATE_ID,
    );
    this._pythConnection = new SuiPriceServiceConnection(
      "https://hermes.pyth.network",
      { timeout: 30 * 1000 },
    );

    patchFixSuiObjectId(this.sdkOptions);
  }

  // **************** Getters and Setters **************** //

  /**
   * Getter for the fullClient property.
   * @returns {FullClient} The fullClient property value.
   */
  get fullClient(): FullClient {
    return this._rpcClient;
  }

  /**
   * Getter for the SuiPythClient instance.
   *
   * @returns {SuiPythClient} The current instance of SuiPythClient.
   */
  get pythClient(): SuiPythClient {
    return this._pythClient;
  }

  /**
   * Gets the Pyth price service connection instance used for fetching price data.
   * @returns {SuiPriceServiceConnection} The Pyth price service connection instance.
   */
  get pythConnection(): SuiPriceServiceConnection {
    return this._pythConnection;
  }

  /**
   * Gets the sender's Sui address. Throws an error if the address is not set.
   * @returns {SuiAddressType} The sender's Sui address.
   * @throws {Error} If the sender address has not been set.
   */
  get senderAddress(): SuiAddressType {
    if (this._senderAddress === "") {
      throw new Error("Sender address not set.");
    }
    return this._senderAddress;
  }

  /**
   * Gets the current signer instance used for transactions.
   * @returns {Signer | undefined} The current signer instance, or undefined if not set.
   */
  get signer(): Signer | undefined {
    return this._signer;
  }

  /**
   * Sets the sender's Sui address.
   * @param {string} value - The Sui address to set.
   */
  set senderAddress(value: string) {
    this._senderAddress = value;
  }

  /**
   * Sets the signer for transactions and automatically updates the sender address.
   * @param {Signer} signer - The signer instance to use for transactions.
   */
  set signer(signer: Signer) {
    this._signer = signer;
    this._senderAddress = signer.getPublicKey().toSuiAddress();
  }

  /**
   * Getter for the sdkOptions property.
   * @returns {SdkOptions} The sdkOptions property value.
   */
  get sdkOptions(): SdkOptions {
    return this._sdkOptions;
  }

  /**
   * Retrieves the package information for the Steamm protocol.
   * @returns {SteammInfo} Object containing the package ID, publishedAt, and quoter package information
   */
  get steammInfo(): SteammInfo {
    return {
      originalId: this.sdkOptions.packages.steamm.packageId,
      publishedAt: this.sdkOptions.packages.steamm.publishedAt,
      quoterIds: {
        cpmm: this.sdkOptions.packages.steamm.config!.quoterIds.cpmm,
        omm: this.sdkOptions.packages.steamm.config!.quoterIds.omm,
        ommV2: this.sdkOptions.packages.steamm.config!.quoterIds.ommV2,
      },
    };
  }

  /**
   * Retrieves the STEAMM Script package information.
   * @returns {PackageInfo} Object containing script original package ID and publishedAt
   */
  get scriptInfo(): PackageInfo {
    return {
      originalId: this.sdkOptions.packages.steammScript.packageId,
      publishedAt: this.sdkOptions.packages.steammScript.publishedAt,
    };
  }

  // TODO: Consider deprecating this in favor of steammInfo
  /**
   * Gets the STEAMM source package ID from the SDK configuration.
   * @returns {string} The source package ID
   */
  get originalId(): string {
    return this.sdkOptions.packages.steamm.packageId;
  }

  // TODO: Consider deprecating this in favor of steammInfo
  /**
   * Gets the STEAMM last package ID from the SDK configuration.
   * @returns {string} STEAMM last package ID.
   */
  get publishedAt(): string {
    return this.sdkOptions.packages.steamm.publishedAt;
  }

  /**
   * Getter for the Pool property.
   * @returns {PoolManager} The Pool Manager property.
   */
  get Pool(): PoolManager {
    return this._pool;
  }

  /**
   * Getter for the Bank Manager property.
   * @returns {BankManager} The Bank Manager.
   */
  get Bank(): BankManager {
    return this._bank;
  }

  /**
   * Getter for the Router property.
   * @returns {BankManager} The Router.
   */
  get Router(): Router {
    return this._router;
  }

  // **************** Abi Constructors **************** //

  /**
   * Creates a Pool ABI instance based on the provided pool information.
   * @param {PoolInfo} poolInfo - Information about the pool to be instantiated
   * @returns {Pool} A new Pool ABI instance.
   */
  poolAbi(poolInfo: PoolInfo): PoolAbi {
    return new PoolAbi(this.steammInfo, poolInfo);
  }

  /**
   * Creates a Bank ABI instance based on the provided bank information.
   * @param {BankInfo} bankInfo - Information about the bank to be instantiated
   * @returns {Bank} A new Bank ABI instance.
   */
  bankAbi(bankInfo: BankInfo): BankAbi {
    return new BankAbi(this.steammInfo, bankInfo);
  }

  /**
   * Creates a PoolScript ABI instance for operations involving a pool and two banks.
   * @param {PoolInfo} poolInfo - Information about the pool
   * @param {BankInfo} bankInfoA - Information about the first bank
   * @param {BankInfo} bankInfoB - Information about the second bank
   * @returns {PoolScript} A new PoolScript ABI instance
   */
  poolScript(
    poolInfo: PoolInfo,
    bankInfoA: BankInfo,
    bankInfoB: BankInfo,
  ): PoolScript {
    return new PoolScript(
      this.steammInfo,
      this.scriptInfo,
      poolInfo,
      bankInfoA,
      bankInfoB,
    );
  }

  /**
   * Creates a BankScript ABI instance for operations involving two banks.
   * @param {BankInfo} bankInfoX - Information about the first bank
   * @param {BankInfo} bankInfoY - Information about the second bank
   * @returns {BankScript} A new BankScript ABI instance.
   */
  bankScript(bankInfoX: BankInfo, bankInfoY: BankInfo): BankScript {
    return new BankScript(
      this.steammInfo,
      this.scriptInfo,
      bankInfoX,
      bankInfoY,
    );
  }

  // **************** Fetching Methods **************** //

  /**
   * Retrieves pools from the cache or fetches new data if the cache is expired.
   * The cache is considered expired if the time since the last update exceeds cache_refresh_ms.
   *
   * @param {[string, string]} [coinTypes] - Optional tuple of coin types to filter pools.
   *                                         If provided, returns only pools that match these coin types in either order.
   * @returns {Promise<PoolInfo[]>} A promise that resolves to an array of pool information
   * @throws {Error} If the pool cache fails to initialize
   */
  async fetchPoolData(coinTypes?: [string, string]): Promise<PoolInfo[]> {
    if (!this._pools) {
      await this.refreshPoolCache();
    } else if (
      this.sdkOptions.cache_refresh_ms &&
      Date.now() > this._pools.updatedAt + this.sdkOptions.cache_refresh_ms
    ) {
      await this.refreshPoolCache();
    }

    if (!this._pools) {
      throw new Error("Pool cache not initialized");
    }

    if (!coinTypes) {
      return this._pools.pools;
    } else {
      const banks = await this.fetchBankData();
      const bcoinTypes = {
        coinType1: banks[coinTypes[0]].btokenType,
        coinType2: banks[coinTypes[1]].btokenType,
      };

      return this._pools.pools.filter(
        (pool) =>
          (pool.coinTypeA === bcoinTypes.coinType1 &&
            pool.coinTypeB === bcoinTypes.coinType2) ||
          (pool.coinTypeA === bcoinTypes.coinType2 &&
            pool.coinTypeB === bcoinTypes.coinType1),
      );
    }
  }

  /**
   * Retrieves the list of banks from the cache or fetches new data if the cache is expired.
   * The cache is considered expired if the time since the last update exceeds cache_refresh_ms.
   *
   * @returns {Promise<BankList>} A promise that resolves to a map of bank information indexed by coin type
   * @throws {Error} If the bank cache fails to initialize
   */
  async fetchBankData(): Promise<BankList> {
    if (!this._banks) {
      await this.refreshBankCache();
    } else if (
      this.sdkOptions.cache_refresh_ms &&
      Date.now() > this._banks.updatedAt + this.sdkOptions.cache_refresh_ms
    ) {
      await this.refreshBankCache();
    }

    if (!this._banks) {
      throw new Error("Bank cache not initialized");
    }

    return this._banks.banks;
  }

  /**
   * Retrieves the list of oracles from the cache or fetches new data if the cache is expired.
   * The cache is considered expired if the time since the last update exceeds cache_refresh_ms.
   *
   * @returns {Promise<OracleInfo[]>} A promise that resolves to an array of oracle information objects.
   *                                  Each object contains the oracle identifier, index, and type.
   * @throws {Error} If the oracle registry cache fails to initialize
   */
  async fetchOracleData(): Promise<OracleInfo[]> {
    if (!this._oracleRegistry) {
      await this.refreshOracleCache();
    } else if (
      this.sdkOptions.cache_refresh_ms &&
      Date.now() >
        this._oracleRegistry.updatedAt + this.sdkOptions.cache_refresh_ms
    ) {
      await this.refreshOracleCache();
    }

    if (!this._oracleRegistry) {
      throw new Error("Bank cache not initialized");
    }

    return this._oracleRegistry.oracles;
  }

  async fetchLpTokenTypes(): Promise<Set<string>> {
    const poolData = await this.fetchPoolData();

    const lpTokenTypesArray: string[] = [];

    poolData.forEach((pool) => {
      lpTokenTypesArray.push(pool.lpTokenType);
    });

    return new Set(lpTokenTypesArray);
  }

  /**
   * Retrieves all liquidity positions for a specific user across all pools.
   *
   * This method fetches comprehensive information about a user's positions including:
   * - LP token balances (both in wallet and deposited in lending markets)
   * - Underlying asset balances (tokenA and tokenB) based on the user's share of the pool
   * - Claimable rewards across all relevant protocols
   *
   * The method aggregates data from multiple sources:
   * - Pool and bank information from STEAMM protocol
   * - LP token deposits from SuiLend protocol
   * - Reward information from both protocols
   * - Coin metadata for proper decimal handling
   *
   * @param {string} address - The Sui address of the user whose positions to fetch
   * @returns {Promise<Array<{
   *   poolId: string;              - Unique identifier of the liquidity pool
   *   coinTypeA: string;           - Coin type of the first token in the pool
   *   coinTypeB: string;           - Coin type of the second token in the pool
   *   lpTokenBalance: BigNumber;   - LP token balance in the user's wallet
   *   balanceA: BigNumber;         - User's share of token A in the pool (normalized by decimals)
   *   balanceB: BigNumber;         - User's share of token B in the pool (normalized by decimals)
   *   claimableRewards: Record<string, BigNumber>; - Map of claimable rewards by coin type
   * }>>} Array of user position objects for each pool where the user has a position
   * @throws Will throw an error if there's a problem fetching the underlying data
   */
  async getUserPositions(address: string): Promise<
    {
      poolId: string;
      coinTypeA: string;
      coinTypeB: string;
      lpTokenBalance: BigNumber;
      balanceA: BigNumber;
      balanceB: BigNumber;
      claimableRewards: Record<string, BigNumber>;
    }[]
  > {
    // Setup
    const TEST_BANK_COIN_TYPES: string[] = [];
    const TEST_POOL_IDS: string[] = [];

    // Data
    const [
      suilend,
      lstAprPercentMap,
      {
        oracleIndexOracleInfoPriceMap,
        COINTYPE_ORACLE_INDEX_MAP,
        coinTypeOracleInfoPriceMap,
      },
      bankObjs,
      poolObjs,
    ] = await Promise.all([
      // Suilend
      (async () => {
        // Suilend - Main market
        const mainMarket_depositAprPercentMap: Record<string, BigNumber> = {}; // Not needed for this use case

        // Suilend - LM market
        const lmMarket_suilendClient = await SuilendClient.initialize(
          process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
            ? "0xb1d89cf9082cedce09d3647f0ebda4a8b5db125aff5d312a8bfd7eefa715bd35" // Requires NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true
            : "0xc1888ec1b81a414e427a44829310508352aec38252ee0daa9f8b181b6947de9f",
          process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
            ? "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP"
            : "0x0a071f4976abae1a7f722199cf0bfcbe695ef9408a878e7d12a7ca87b7e582a6::lp_rewards::LP_REWARDS",
          this.fullClient,
        );

        const {
          refreshedRawReserves: lmMarket_refreshedRawReserves,
          reserveMap: lmMarket_reserveMap,

          rewardCoinMetadataMap: lmMarket_rewardCoinMetadataMap,
        } = await initializeSuilend(this.fullClient, lmMarket_suilendClient);

        return {
          mainMarket: {
            depositAprPercentMap: mainMarket_depositAprPercentMap,
          },
          lmMarket: {
            suilendClient: lmMarket_suilendClient,

            refreshedRawReserves: lmMarket_refreshedRawReserves,
            reserveMap: lmMarket_reserveMap,

            rewardCoinMetadataMap: lmMarket_rewardCoinMetadataMap,
          },
        };
      })(),

      // LSTs
      (async () => {
        const lstAprPercentMap: Record<string, BigNumber> = {}; // Not needed for this use case

        return lstAprPercentMap;
      })(),

      // Oracles
      (async () => {
        const [oracleIndexOracleInfoPriceMap, COINTYPE_ORACLE_INDEX_MAP] =
          await Promise.all([
            // OracleInfos
            // OracleInfos
            (async () => {
              let oracleObjs: OracleObj[] = [];

              if (
                this._apiOracles !== undefined &&
                Date.now() <= this._apiOracles.updatedAt + 5 * 60 * 1000 // 5 minutes
              ) {
                oracleObjs = this._apiOracles.oracleObjs;
              } else {
                const oraclesRes = await fetch(`${API_URL}/steamm/oracles/all`);
                const oraclesJson: OracleObj[] = await oraclesRes.json();
                if ((oraclesJson as any)?.statusCode === 500)
                  throw new Error("Failed to fetch oracles");

                oracleObjs = oraclesJson;
                this._apiOracles = { oracleObjs, updatedAt: Date.now() };
              }

              const pythOracleInfos = oracleObjs.filter(
                (oracleInfo) => oracleInfo.oracleType === OracleType.PYTH,
              );
              const switchboardOracleInfos = oracleObjs.filter(
                (oracleInfo) =>
                  oracleInfo.oracleType === OracleType.SWITCHBOARD,
              );

              const oracleIndexToPythPriceIdentifierMap: Record<
                number,
                string
              > = Object.fromEntries(
                pythOracleInfos.map((oracleInfo) => [
                  oracleInfo.oracleIndex,
                  typeof oracleInfo.oracleIdentifier === "string"
                    ? oracleInfo.oracleIdentifier
                    : toHexString(oracleInfo.oracleIdentifier),
                ]) as [number, string][],
              );
              const oracleIndexToSwitchboardPriceIdentifierMap: Record<
                number,
                string
              > = Object.fromEntries(
                switchboardOracleInfos.map(
                  (oracleInfo) => [oracleInfo.oracleIndex, ""], // TODO: Parse Switchboard price identifier
                ) as [number, string][],
              );

              const pythConnection = new SuiPriceServiceConnection(
                "https://hermes.pyth.network",
                { timeout: 30 * 1000 },
              );
              // TODO: Switchboard price connection

              const pythPriceFeeds =
                (await pythConnection.getLatestPriceFeeds(
                  Object.values(oracleIndexToPythPriceIdentifierMap),
                )) ?? [];
              const switchboardPriceFeeds: any[] = [];

              const oracleIndexToPythPriceFeedMap: Record<number, PriceFeed> =
                Object.keys(oracleIndexToPythPriceIdentifierMap).reduce(
                  (acc, oracleIndexStr, index) => {
                    const pythPriceFeed = pythPriceFeeds[index];
                    if (!pythPriceFeed) return acc;

                    return { ...acc, [+oracleIndexStr]: pythPriceFeed };
                  },
                  {} as Record<number, PriceFeed>,
                );
              const oracleIndexToSwitchboardPriceFeedMap: Record<number, any> =
                {};

              const oracleIndexOracleInfoPriceEntries: [
                number,
                { oracleInfo: OracleInfo; price: BigNumber },
              ][] = oracleObjs.map((oracleInfo) => {
                if (oracleInfo.oracleType === OracleType.PYTH) {
                  const pythPriceFeed =
                    oracleIndexToPythPriceFeedMap[oracleInfo.oracleIndex];

                  return [
                    +oracleInfo.oracleIndex,
                    {
                      oracleInfo,
                      price: new BigNumber(
                        pythPriceFeed
                          .getPriceUnchecked()
                          .getPriceAsNumberUnchecked(),
                      ),
                    },
                  ];
                } else if (oracleInfo.oracleType === OracleType.SWITCHBOARD) {
                  return [
                    +oracleInfo.oracleIndex,
                    {
                      oracleInfo,
                      price: new BigNumber(0.000001), // TODO: Fetch Switchboard price
                    },
                  ];
                } else {
                  throw new Error(
                    `Unknown oracle type: ${oracleInfo.oracleType}`,
                  );
                }
              });

              return Object.fromEntries(oracleIndexOracleInfoPriceEntries);
            })(),

            // COINTYPE_ORACLE_INDEX_MAP
            (async () => {
              const COINTYPE_ORACLE_INDEX_MAP: Record<string, number> = await (
                await fetch(
                  `${ASSETS_URL}/cointype-oracle-index-map.json?timestamp=${Date.now()}`,
                )
              ).json();

              return COINTYPE_ORACLE_INDEX_MAP;
            })(),
          ]);

        const coinTypeOracleInfoPriceMap: Record<
          string,
          { oracleInfo: OracleInfo; price: BigNumber }
        > = Object.entries(COINTYPE_ORACLE_INDEX_MAP).reduce(
          (acc, [coinType, oracleIndex]) => ({
            ...acc,
            [coinType]: oracleIndexOracleInfoPriceMap[oracleIndex],
          }),
          {} as Record<string, { oracleInfo: OracleInfo; price: BigNumber }>,
        );

        return {
          oracleIndexOracleInfoPriceMap,
          COINTYPE_ORACLE_INDEX_MAP,
          coinTypeOracleInfoPriceMap,
        };
      })(),

      // Banks
      (async () => {
        if (
          this._apiBanks !== undefined &&
          Date.now() <= this._apiBanks.updatedAt + 5 * 60 * 1000 // 5 minutes
        )
          return this._apiBanks.bankObjs;

        const bankObjs: BankObj[] = [];

        const banksRes = await fetch(`${API_URL}/steamm/banks/all`);
        const banksJson: (Omit<BankObj, "totalFundsRaw"> & {
          totalFunds: number;
        })[] = await banksRes.json();
        if ((banksJson as any)?.statusCode === 500)
          throw new Error("Failed to fetch banks");

        bankObjs.push(
          ...banksJson.filter(
            (bankObj) =>
              !TEST_BANK_COIN_TYPES.includes(bankObj.bankInfo.coinType), // Filter out test banks
          ),
        );

        this._apiBanks = { bankObjs, updatedAt: Date.now() };
        return bankObjs;
      })(),

      // Pools
      (async () => {
        if (
          this._apiPools !== undefined &&
          Date.now() <= this._apiPools.updatedAt + 5 * 60 * 1000 // 5 minutes
        )
          return this._apiPools.poolObjs;

        const poolObjs: PoolObj[] = [];

        const poolsRes = await fetch(`${API_URL}/steamm/pools/all`);
        const poolsJson: PoolObj[] = await poolsRes.json();
        if ((poolsJson as any)?.statusCode === 500)
          throw new Error("Failed to fetch pools");

        poolObjs.push(
          ...poolsJson.filter(
            (poolObj) => !TEST_POOL_IDS.includes(poolObj.poolInfo.poolId), // Filter out test pools
          ),
        );

        this._apiPools = { poolObjs, updatedAt: Date.now() };
        return poolObjs;
      })(),
    ]);

    // CoinMetadata
    // CoinMetadata - banks
    const bankCoinTypes: string[] = [];
    for (const bankObj of bankObjs) {
      bankCoinTypes.push(normalizeStructTag(bankObj.bankInfo.coinType));
    }
    const uniqueBankCoinTypes = Array.from(new Set(bankCoinTypes));

    // CoinMetadata - pools
    const poolCoinTypes: string[] = [];
    for (const poolObj of poolObjs) {
      const coinTypes = [
        poolObj.poolInfo.lpTokenType,
        // bTokenTypeCoinTypeMap[poolInfo.coinTypeA], // Already included in bankCoinTypes
        // bTokenTypeCoinTypeMap[poolInfo.coinTypeB], // Already included in bankCoinTypes
      ];
      poolCoinTypes.push(...coinTypes);
    }
    const uniquePoolCoinTypes = Array.from(new Set(poolCoinTypes));

    // CoinMetadata - all
    const uniqueCoinTypes = Array.from(
      new Set([
        NORMALIZED_STEAMM_POINTS_COINTYPE,
        ...uniqueBankCoinTypes,
        ...uniquePoolCoinTypes,
      ]),
    );

    const coinMetadataMap = await getCoinMetadataMap(uniqueCoinTypes);

    // Banks - parse
    const bTokenTypeCoinTypeMap: Record<string, string> = {};
    for (const bankObj of bankObjs) {
      bTokenTypeCoinTypeMap[bankObj.bankInfo.btokenType] = normalizeStructTag(
        bankObj.bankInfo.coinType,
      );
    }

    const banks: ParsedBank[] = bankObjs.map((bankObj) =>
      getParsedBank(
        { suilend, coinMetadataMap },
        bankObj.bankInfo,
        bankObj.bank,
        bankObj.totalFunds,
      ),
    );
    const bankMap = Object.fromEntries(
      banks.map((bank) => [bank.coinType, bank]),
    );

    // Pools - parse
    const pools: ParsedPool[] = poolObjs
      .map((poolObj) =>
        getParsedPool(
          {
            coinMetadataMap,
            oracleIndexOracleInfoPriceMap,
            bTokenTypeCoinTypeMap,
            bankMap,
          },
          poolObj,
        ),
      )
      .filter(Boolean) as ParsedPool[];

    // Obligations
    const getObligationDepositPosition = (
      obligation: ParsedObligation | undefined,
      coinType: string,
    ) => obligation?.deposits.find((d) => d.coinType === coinType);

    const getObligationDepositedAmount = (
      obligation: ParsedObligation | undefined,
      coinType: string,
    ) =>
      getObligationDepositPosition(obligation, coinType)?.depositedAmount ??
      new BigNumber(0);

    const getIndexesOfObligationsWithDeposit = (
      obligations: ParsedObligation[],
      coinType: string,
    ) =>
      obligations
        .map((obligation, index) =>
          !!getObligationDepositPosition(obligation, coinType)
            ? index
            : undefined,
        )
        .filter((index) => index !== undefined);

    const { obligationOwnerCaps, obligations } = await initializeObligations(
      this.fullClient,
      suilend.lmMarket.suilendClient,
      suilend.lmMarket.refreshedRawReserves,
      suilend.lmMarket.reserveMap,
      address,
    );

    // Rewards
    const rewardMap = formatRewards(
      suilend.lmMarket.reserveMap,
      suilend.lmMarket.rewardCoinMetadataMap,
      {}, // No need to pass the current USD prices for this use case (since we don't need to calculate the APR %)
      obligations,
    );

    // Balances
    const balanceMap: Record<string, BigNumber> = (
      await this.fullClient.getAllBalances({
        owner: address,
      })
    )
      .map((cb) => ({ ...cb, coinType: normalizeStructTag(cb.coinType) }))
      .filter((cb) => Object.keys(coinMetadataMap).includes(cb.coinType))
      .reduce(
        (acc, cb) => ({
          ...acc,
          [cb.coinType]: new BigNumber(cb.totalBalance).div(
            10 ** coinMetadataMap[cb.coinType].decimals,
          ),
        }),
        {} as Record<string, BigNumber>,
      );

    // From useFetchUserData
    const poolRewardMap = pools.reduce(
      (acc, pool) => ({
        ...acc,
        [pool.id]: (rewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? []).reduce(
          (acc2, r) => {
            for (let i = 0; i < obligations.length; i++) {
              const obligation = obligations[i];

              const minAmount = 10 ** (-1 * r.stats.mintDecimals);
              if (
                !r.obligationClaims[obligation.id] ||
                r.obligationClaims[obligation.id].claimableAmount.lt(minAmount) // This also covers the 0 case
              )
                continue;

              acc2[r.stats.rewardCoinType] = new BigNumber(
                acc2[r.stats.rewardCoinType] ?? 0,
              ).plus(r.obligationClaims[obligation.id].claimableAmount);
            }

            return acc2;
          },
          {} as Record<string, BigNumber>,
        ),
      }),
      {} as Record<string, Record<string, BigNumber>>,
    );

    // User positions
    const result: {
      poolId: string;
      coinTypeA: string;
      coinTypeB: string;
      lpTokenBalance: BigNumber;
      balanceA: BigNumber;
      balanceB: BigNumber;
      claimableRewards: Record<string, BigNumber>;
    }[] = [];

    for (const pool of pools) {
      // User
      const obligationIndexes = getIndexesOfObligationsWithDeposit(
        obligations,
        pool.lpTokenType,
      );

      const lpTokenBalance = balanceMap[pool.lpTokenType] ?? new BigNumber(0);
      const lpTokenDepositedAmount = obligationIndexes.reduce(
        (acc, obligationIndex) =>
          acc.plus(
            getObligationDepositedAmount(
              obligations[obligationIndex],
              pool.lpTokenType,
            ),
          ),
        new BigNumber(0),
      );

      const lpTokenTotalAmount = lpTokenBalance.plus(lpTokenDepositedAmount);
      if (lpTokenTotalAmount.eq(0)) continue;

      result.push({
        poolId: pool.id,
        coinTypeA: pool.coinTypes[0],
        coinTypeB: pool.coinTypes[1],
        lpTokenBalance: lpTokenTotalAmount,
        balanceA: new BigNumber(lpTokenTotalAmount.div(pool.lpSupply)).times(
          pool.balances[0],
        ),
        balanceB: new BigNumber(lpTokenTotalAmount.div(pool.lpSupply)).times(
          pool.balances[1],
        ),
        claimableRewards: Object.fromEntries(
          Object.entries(poolRewardMap[pool.id] ?? {}).filter(
            ([coinType, amount]) => !isSteammPoints(coinType),
          ),
        ),
      });
    }

    return result;
  }

  // **************** Cache Refresh Methods **************** //

  /**
   * Refreshes the pool cache by querying events for new pool creations and oracle quoter updates.
   * Fetches both NewPoolEvent and NewOracleQuoterEvent events to build a complete pool list
   * with associated oracle quoter data where available.
   * Updates the internal pool cache with the latest data and timestamp.
   *
   * @public
   */
  async refreshPoolCache() {
    let eventData: EventData<NewPoolEvent>[] = [];

    const res: DataPage<EventData<NewPoolEvent>[]> =
      await this.fullClient.queryEventsByPage({
        MoveEventType: `${this.originalId}::events::Event<${this.originalId}::pool::NewPoolResult>`,
      });

    eventData = res.data.reduce((acc, curr) => acc.concat(curr), []);
    const pools = extractPoolInfo(eventData);

    const oracleQuoterPkgId =
      this.sdkOptions.packages.steamm.config?.quoterIds.omm;
    const oracleV2QuoterPkgId =
      this.sdkOptions.packages.steamm.config?.quoterIds.ommV2;

    let oracleQuoterEventData: EventData<NewOracleQuoterEvent>[] = [];
    const res2: DataPage<EventData<NewOracleQuoterEvent>[]> =
      await this.fullClient.queryEventsByPage({
        MoveEventType: `${this.originalId}::events::Event<${oracleQuoterPkgId}::omm::NewOracleQuoter>`,
      });

    oracleQuoterEventData = res2.data.reduce(
      (acc, curr) => acc.concat(curr),
      [],
    );

    const oracleQuoterData = extractOracleQuoterInfo(oracleQuoterEventData);

    pools.forEach((pool) => {
      if (oracleQuoterData[pool.poolId]) {
        pool.quoterData = oracleQuoterData[pool.poolId];
      }
    });

    if (oracleV2QuoterPkgId !== "0x0") {
      let oracleV2QuoterEventData: EventData<NewOracleV2QuoterEvent>[] = [];
      const res3: DataPage<EventData<NewOracleV2QuoterEvent>[]> =
        await this.fullClient.queryEventsByPage({
          MoveEventType: `${this.originalId}::events::Event<${oracleV2QuoterPkgId}::omm_v2::NewOracleQuoterV2>`,
        });

      oracleV2QuoterEventData = res3.data.reduce(
        (acc, curr) => acc.concat(curr),
        [],
      );

      const oracleV2QuoterData = extractOracleV2QuoterInfo(
        oracleV2QuoterEventData,
      );

      pools.forEach((pool) => {
        if (oracleV2QuoterData[pool.poolId]) {
          pool.quoterData = oracleV2QuoterData[pool.poolId];
        }
      });
    }

    this._pools = { pools, updatedAt: Date.now() };
  }

  /**
   * Refreshes the bank cache by querying events for new bank creations.
   * Fetches all NewBankEvent events and processes them into a structured bank list.
   * Updates the internal bank cache with the latest data and timestamp.
   *
   * @private
   */
  private async refreshBankCache() {
    let eventData: EventData<NewBankEvent>[] = [];

    const res: DataPage<EventData<NewBankEvent>[]> =
      await this.fullClient.queryEventsByPage({
        MoveEventType: `${this.originalId}::events::Event<${this.originalId}::bank::NewBankEvent>`,
      });

    eventData = res.data.reduce((acc, curr) => acc.concat(curr), []);

    this._banks = { banks: extractBankList(eventData), updatedAt: Date.now() };
  }

  /**
   * Refreshes the oracle cache by fetching the latest oracle registry data.
   * Maps each oracle to an OracleInfo object containing its identifier, index, and type.
   * Handles both Pyth and Switchboard oracle types.
   *
   * @private
   * @throws {Error} When encountering an unknown oracle type
   */
  private async refreshOracleCache() {
    const oracleRegistry = await this.fullClient.fetchOracleRegistry(
      this._sdkOptions.packages.oracle.config!.oracleRegistryId,
    );

    const oracles = oracleRegistry.oracles;

    const oracleInfos: OracleInfo[] = oracles.map((oracle, index) => {
      const oracleType = oracle.oracleType;
      const oracleVariant = oracleType.$data;

      let identifier;
      if (oracleVariant.$kind === "pyth") {
        identifier = oracleType.$data.pyth?.priceIdentifier.bytes as number[];
      } else if (oracleVariant.$kind === "switchboard") {
        identifier = oracleType.$data.switchboard?.feedId as string;
      } else {
        throw new Error(`Unknown oracle type: ${oracleVariant}`);
      }

      return {
        oracleIdentifier: identifier,
        oracleIndex: index,
        oracleType: oracleVariant.$kind,
      };
    });

    this._oracleRegistry = { oracles: oracleInfos, updatedAt: Date.now() };
  }

  // **************** Test-only Methods **************** //

  mockOracleObjectForTesting(feedId: string, objectId: string) {
    if (!this._sdkOptions.enableTestMode) {
      throw new Error("Mocking only enabled in test mode.");
    }
    if (!this.testConfig) {
      this.testConfig = { mockOracleObjs: {} };
    }
    this.testConfig.mockOracleObjs[feedId] = objectId;
  }

  getMockOraclePriceObject(feedId: string): string {
    if (!this._sdkOptions.enableTestMode) {
      throw new Error("Mocking only enabled in test mode.");
    }

    const mockObject = this.testConfig!.mockOracleObjs[feedId];
    if (!mockObject) {
      throw new Error(`Mock oracle object for feedId ${feedId} not found.`);
    }
    return mockObject;
  }
}
