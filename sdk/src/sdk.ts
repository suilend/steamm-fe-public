import { Signer } from "@mysten/sui/cryptography";
import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from "@pythnetwork/pyth-sui-js";

import { Bank, BankScript, Pool, PoolScript } from "./base";
import {
  BankManager,
  PoolManager,
  RouterManager,
  RpcManager,
} from "./managers";
import {
  BankInfo,
  BankList,
  DataPage,
  EventData,
  NewBankEvent,
  NewOracleQuoterEvent,
  NewPoolEvent,
  OracleConfigs,
  OracleInfo,
  Package,
  PackageInfo,
  PoolInfo,
  SteammConfigs,
  SteammPackageInfo,
  SuilendConfigs,
  extractBankList,
  extractOracleQuoterInfo,
  extractPoolInfo,
} from "./types";
import { SuiAddressType, patchFixSuiObjectId } from "./utils";

const WORMHOLE_STATE_ID =
  "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c";
const PYTH_STATE_ID =
  "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8";

export type SdkOptions = {
  fullRpcUrl: string;
  steamm_config: Package<SteammConfigs>;
  oracle_config: Package<OracleConfigs>;
  steamm_script_config: Package;
  suilend_config: Package<SuilendConfigs>;
  cache_refresh_ms?: number /* default: 5000 */;
  enableTestMode?: boolean;
};

interface TestConfig {
  mockOracleObjs: Record<string, string>;
}

interface PoolCache {
  pools: PoolInfo[];
  updatedAt: number;
}

interface BankCache {
  banks: BankList;
  updatedAt: number;
}

interface OracleCache {
  oracles: OracleInfo[];
  updatedAt: number;
}

/**
 * The SteammSDK class provides a comprehensive interface for interacting with the Steamm platform.
 * It includes modules for managing pools, banks, routers, and oracles, as well as handling
 * connections and configurations.
 *
 * @class SteammSDK
 * @property {RpcManager} _rpcManager - The RPC manager for making network requests.
 * @property {PoolManager} _pool - The manager for managing pools.
 * @property {RouterManager} _router - The manager for managing routers.
 * @property {BankManager} _bank - The manager for managing banks.
 * @property {SdkOptions} _sdkOptions - The SDK configuration options.
 * @property {PoolCache} [_pools] - The cache for pool data.
 * @property {BankCache} [_banks] - The cache for bank data.
 * @property {OracleCache} [_oracleRegistry] - The cache for oracle data.
 * @property {SuiPythClient} _pythClient - The client for interacting with the Pyth network.
 * @property {SuiPriceServiceConnection} _pythConnection - The connection for fetching price data from Pyth.
 * @property {TestConfig} [testConfig] - Configuration for testing.
 * @property {Signer} [_signer] - The signer for transactions.
 * @property {string} _senderAddress - The address of the sender.
 *
 * @constructor
 * @param {SdkOptions} options - The SDK configuration options.
 *
 * @method get pythClient - Getter for the Pyth client.
 * @method get pythConnection - Getter for the Pyth connection.
 * @method get senderAddress - Getter for the sender address.
 * @method set senderAddress - Setter for the sender address.
 * @method get signer - Getter for the signer.
 * @method set signer - Setter for the signer.
 * @method get client - Getter for the full client.
 * @method get sdkOptions - Getter for the SDK options.
 * @method get Pool - Getter for the pool module.
 * @method get Bank - Getter for the bank module.
 * @method get Router - Getter for the router module.
 * @method getPool - Retrieves a pool instance based on pool information.
 * @method getBank - Retrieves a bank instance based on bank information.
 * @method getPoolScript - Retrieves a pool script instance based on pool and bank information.
 * @method getBankScript - Retrieves a bank script instance based on bank information.
 * @method packageInfo - Retrieves package information for the Steamm SDK.
 * @method scriptPackageInfo - Retrieves script package information for the Steamm SDK.
 * @method sourcePkgId - Retrieves the source package ID.
 * @method publishedAt - Retrieves the publication date.
 * @method getBanks - Retrieves a list of banks.
 * @method getPools - Retrieves a list of pools, optionally filtered by coin types.
 * @method getOracles - Retrieves a list of oracles.
 * @method refreshOracleCache - Refreshes the oracle cache.
 * @method refreshBankCache - Refreshes the bank cache.
 * @method refreshPoolCache - Refreshes the pool cache.
 * @method mockOracleObjectForTesting - Mocks an oracle object for testing purposes.
 * @method getMockOraclePriceObject - Retrieves a mocked oracle price object for testing purposes.
 */
export class SteammSDK {
  protected _rpc: RpcManager;
  protected _pool: PoolManager;
  protected _router: RouterManager;
  protected _bank: BankManager;
  protected _sdkOptions: SdkOptions;
  protected _pools?: PoolCache;
  protected _banks?: BankCache;
  protected _oracleRegistry?: OracleCache;
  protected _pythClient: SuiPythClient;
  protected _pythConnection: SuiPriceServiceConnection;
  testConfig?: TestConfig;

  protected _signer: Signer | undefined;
  protected _senderAddress = "";

  constructor(options: SdkOptions) {
    this._sdkOptions = {
      ...options,
      cache_refresh_ms: options.cache_refresh_ms ?? 5000,
    };
    this._rpc = new RpcManager({
      url: options.fullRpcUrl,
    });

    this._pool = new PoolManager(this);
    this._bank = new BankManager(this);
    this._router = new RouterManager(this);
    this._pythClient = new SuiPythClient(
      this._rpc,
      PYTH_STATE_ID,
      WORMHOLE_STATE_ID,
    );
    this._pythConnection = new SuiPriceServiceConnection(
      "https://hermes.pyth.network",
    );

    patchFixSuiObjectId(this.sdkOptions);
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
   * Gets the current signer instance used for transactions.
   * @returns {Signer | undefined} The current signer instance, or undefined if not set.
   */
  get signer(): Signer | undefined {
    return this._signer;
  }

  /**
   * Getter for the client property.
   * @returns {RpcModule} The client property value.
   */
  get client(): RpcManager {
    return this._rpc;
  }

  /**
   * Getter for the sdkOptions property.
   * @returns {SdkOptions} The sdkOptions property value.
   */
  get sdkOptions(): SdkOptions {
    return this._sdkOptions;
  }

  /**
   * Getter for the Pool Manager property.
   * @returns {PoolManager} The Pool property value.
   */
  get PoolManager(): PoolManager {
    return this._pool;
  }

  /**
   * Getter for the Bank property.
   * @returns {BankManager} The Bank property value.
   */
  get BankManager(): BankManager {
    return this._bank;
  }

  /**
   * Getter for the Router property.
   * @returns {RouterManager} The Router property value.
   */
  get Router(): RouterManager {
    return this._router;
  }

  /**
   * Creates a Pool instance based on the provided pool information.
   * @param {PoolInfo} poolInfo - Information about the pool to be instantiated
   * @returns {Pool} A new Pool instance
   */
  getPool(poolInfo: PoolInfo): Pool {
    return new Pool(this.packageInfo(), poolInfo);
  }

  /**
   * Creates a Bank instance based on the provided bank information.
   * @param {BankInfo} bankInfo - Information about the bank to be instantiated
   * @returns {Bank} A new Bank instance
   */
  getBank(bankInfo: BankInfo): Bank {
    return new Bank(this.packageInfo(), bankInfo);
  }

  /**
   * Creates a PoolScript instance for operations involving a pool and two banks.
   * @param {PoolInfo} poolInfo - Information about the pool
   * @param {BankInfo} bankInfoA - Information about the first bank
   * @param {BankInfo} bankInfoB - Information about the second bank
   * @returns {PoolScript} A new PoolScript instance
   */
  getPoolScript(
    poolInfo: PoolInfo,
    bankInfoA: BankInfo,
    bankInfoB: BankInfo,
  ): PoolScript {
    return new PoolScript(
      this.packageInfo(),
      this.scriptPackageInfo(),
      poolInfo,
      bankInfoA,
      bankInfoB,
    );
  }

  /**
   * Creates a BankScript instance for operations involving two banks.
   * @param {BankInfo} bankInfoX - Information about the first bank
   * @param {BankInfo} bankInfoY - Information about the second bank
   * @returns {BankScript} A new BankScript instance
   */
  getBankScript(bankInfoX: BankInfo, bankInfoY: BankInfo): BankScript {
    return new BankScript(
      this.packageInfo(),
      this.scriptPackageInfo(),
      bankInfoX,
      bankInfoY,
    );
  }

  /**
   * Retrieves the package information for the Steamm protocol.
   * @returns {SteammPackageInfo} Object containing package ID, publication date, and quoter package information
   */
  public packageInfo(): SteammPackageInfo {
    return {
      sourcePkgId: this.sourcePkgId(),
      publishedAt: this.publishedAt(),
      quoterPkgs: {
        cpmm: this.sdkOptions.steamm_config.config!.quoterSourcePkgs.cpmm,
        omm: this.sdkOptions.steamm_config.config!.quoterSourcePkgs.omm,
      },
    };
  }

  /**
   * Gets the source package ID from the SDK configuration.
   * @returns {string} The source package ID
   */
  public sourcePkgId(): string {
    return this.sdkOptions.steamm_config.packageId;
  }

  /**
   * Gets the publication date from the SDK configuration.
   * @returns {string} The publication date
   */
  public publishedAt(): string {
    return this.sdkOptions.steamm_config.publishedAt;
  }

  /**
   * Retrieves the script package information.
   * @returns {PackageInfo} Object containing script package ID and publication date
   */
  public scriptPackageInfo(): PackageInfo {
    return {
      sourcePkgId: this.sdkOptions.steamm_script_config.packageId,
      publishedAt: this.sdkOptions.steamm_script_config.publishedAt,
    };
  }

  /**
   * Retrieves the list of banks from the cache or fetches new data if the cache is expired.
   * The cache is considered expired if the time since the last update exceeds cache_refresh_ms.
   *
   * @returns {Promise<BankList>} A promise that resolves to a map of bank information indexed by coin type
   * @throws {Error} If the bank cache fails to initialize
   */
  public async getBanks(): Promise<BankList> {
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
   * Retrieves pools from the cache or fetches new data if the cache is expired.
   * The cache is considered expired if the time since the last update exceeds cache_refresh_ms.
   *
   * @param {[string, string]} [coinTypes] - Optional tuple of coin types to filter pools.
   *                                         If provided, returns only pools that match these coin types in either order.
   * @returns {Promise<PoolInfo[]>} A promise that resolves to an array of pool information
   * @throws {Error} If the pool cache fails to initialize
   */
  public async getPools(coinTypes?: [string, string]): Promise<PoolInfo[]> {
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
      const banks = await this.getBanks();
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
   * Retrieves the list of oracles from the cache or fetches new data if the cache is expired.
   * The cache is considered expired if the time since the last update exceeds cache_refresh_ms.
   *
   * @returns {Promise<OracleInfo[]>} A promise that resolves to an array of oracle information objects.
   *                                  Each object contains the oracle identifier, index, and type.
   * @throws {Error} If the oracle registry cache fails to initialize
   */
  public async getOracles(): Promise<OracleInfo[]> {
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

  /**
   * Refreshes the oracle cache by fetching the latest oracle registry data.
   * Maps each oracle to an OracleInfo object containing its identifier, index, and type.
   * Handles both Pyth and Switchboard oracle types.
   *
   * @private
   * @throws {Error} When encountering an unknown oracle type
   */
  private async refreshOracleCache() {
    const oracleRegistry = await this.client.fetchOracleRegistry(
      this._sdkOptions.oracle_config.config!.oracleRegistryId,
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

  /**
   * Refreshes the bank cache by querying events for new bank creations.
   * Fetches all NewBankEvent events and processes them into a structured bank list.
   * Updates the internal bank cache with the latest data and timestamp.
   *
   * @private
   */
  private async refreshBankCache() {
    const pkgAddy = this.sourcePkgId();

    let eventData: EventData<NewBankEvent>[] = [];

    const res: DataPage<EventData<NewBankEvent>[]> =
      await this.client.queryEventsByPage({
        MoveEventType: `${pkgAddy}::events::Event<${pkgAddy}::bank::NewBankEvent>`,
      });

    eventData = res.data.reduce((acc, curr) => acc.concat(curr), []);

    this._banks = { banks: extractBankList(eventData), updatedAt: Date.now() };
  }

  /**
   * Refreshes the pool cache by querying events for new pool creations and oracle quoter updates.
   * Fetches both NewPoolEvent and NewOracleQuoterEvent events to build a complete pool list
   * with associated oracle quoter data where available.
   * Updates the internal pool cache with the latest data and timestamp.
   *
   * @public
   */
  async refreshPoolCache() {
    const pkgAddy = this.sourcePkgId();

    let eventData: EventData<NewPoolEvent>[] = [];

    const res: DataPage<EventData<NewPoolEvent>[]> =
      await this.client.queryEventsByPage({
        MoveEventType: `${pkgAddy}::events::Event<${pkgAddy}::pool::NewPoolResult>`,
      });

    eventData = res.data.reduce((acc, curr) => acc.concat(curr), []);

    const oracleQuoterPkgId =
      this.sdkOptions.steamm_config.config?.quoterSourcePkgs.omm;

    let quoterEventData: EventData<NewOracleQuoterEvent>[] = [];
    const res2: DataPage<EventData<NewOracleQuoterEvent>[]> =
      await this.client.queryEventsByPage({
        MoveEventType: `${pkgAddy}::events::Event<${oracleQuoterPkgId}::omm::NewOracleQuoter>`,
      });

    quoterEventData = res2.data.reduce((acc, curr) => acc.concat(curr), []);
    const pools = extractPoolInfo(eventData);
    const oracleQuoterData = extractOracleQuoterInfo(quoterEventData);

    pools.forEach((pool) => {
      if (oracleQuoterData[pool.poolId]) {
        pool.quoterData = oracleQuoterData[pool.poolId];
      }
    });

    this._pools = { pools, updatedAt: Date.now() };
  }

  /**
   * Configure a mock oracle object for testing purposes. This allows overriding oracle price feed responses.
   *
   * @remarks
   * This method is only available when the SDK is initialized with `enableTestMode: true`.
   * It should not be used in production environments.
   *
   * @param {string} feedId - The oracle feed identifier to mock
   * @param {string} objectId - The Sui object ID to return for this feed
   * @throws {Error} If called when test mode is not enabled
   * @test
   */
  mockOracleObjectForTesting(feedId: string, objectId: string) {
    if (!this._sdkOptions.enableTestMode) {
      throw new Error("Mocking only enabled in test mode.");
    }
    if (!this.testConfig) {
      this.testConfig = { mockOracleObjs: {} };
    }
    this.testConfig.mockOracleObjs[feedId] = objectId;
  }

  /**
   * Retrieves a previously configured mock oracle price object.
   *
   * @remarks
   * This method is only available when the SDK is initialized with `enableTestMode: true`.
   * It should not be used in production environments.
   *
   * @param {string} feedId - The oracle feed identifier to retrieve the mock object for
   * @returns {string} The mocked Sui object ID for the given feed
   * @throws {Error} If called when test mode is not enabled or if the feed ID has not been mocked
   * @test
   */
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
