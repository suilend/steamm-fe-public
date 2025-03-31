import { Signer } from "@mysten/sui/cryptography";
import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from "@pythnetwork/pyth-sui-js";

import { Bank, BankScript, Pool, PoolScript } from "./base";
import { BankManager } from "./managers/bankManager";
import { FullClient } from "./managers/client";
import { PoolManager } from "./managers/poolManager";
import { Router } from "./managers/router";
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

export const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET
  ? "0xa902504c338e17f44dfee1bd1c3cad1ff03326579b9cdcfe2762fc12c46fc033" // beta owner
  : "0xb1ffbc2e1915f44b8f271a703becc1bf8aa79bc22431a58900a102892b783c25";

export type SdkOptions = {
  fullRpcUrl: string;
  steammConfig: Package<SteammConfigs>;
  oracleConfig: Package<OracleConfigs>;
  steammScriptConfig: Package;
  suilendConfig: Package<SuilendConfigs>;
  cacheRefreshMs?: number /* default: 5000 */;
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

export class SteammSDK {
  protected _rpcModule: FullClient;
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

  protected _signer: Signer | undefined;
  protected _senderAddress = "";

  constructor(options: SdkOptions) {
    this._sdkOptions = {
      ...options,
      cacheRefreshMs: options.cacheRefreshMs ?? 5000,
    };
    this._rpcModule = new FullClient({
      url: options.fullRpcUrl,
    });

    this._pool = new PoolManager(this);
    this._bank = new BankManager(this);
    this._router = new Router(this);
    this._pythClient = new SuiPythClient(
      this._rpcModule,
      PYTH_STATE_ID,
      WORMHOLE_STATE_ID,
    );
    this._pythConnection = new SuiPriceServiceConnection(
      "https://hermes.pyth.network",
    );

    patchFixSuiObjectId(this.sdkOptions);
  }

  get pythClient(): SuiPythClient {
    return this._pythClient;
  }
  get pythConnection(): SuiPriceServiceConnection {
    return this._pythConnection;
  }

  get senderAddress(): SuiAddressType {
    if (this._senderAddress === "") {
      throw new Error("Sender address not set.");
    }
    return this._senderAddress;
  }

  set senderAddress(value: string) {
    this._senderAddress = value;
  }

  set signer(signer: Signer) {
    this._signer = signer;
    this._senderAddress = signer.getPublicKey().toSuiAddress();
  }

  get signer(): Signer | undefined {
    return this._signer;
  }

  /**
   * Getter for the fullClient property.
   * @returns {RpcModule} The fullClient property value.
   */
  get fullClient(): FullClient {
    return this._rpcModule;
  }

  /**
   * Getter for the sdkOptions property.
   * @returns {SdkOptions} The sdkOptions property value.
   */
  get sdkOptions(): SdkOptions {
    return this._sdkOptions;
  }

  /**
   * Getter for the Pool property.
   * @returns {PoolManager} The Pool property value.
   */
  get Pool(): PoolManager {
    return this._pool;
  }

  /**
   * Getter for the Pool property.
   * @returns {BankManager} The Pool property value.
   */
  get Bank(): BankManager {
    return this._bank;
  }

  get Router(): Router {
    return this._router;
  }

  getPool(poolInfo: PoolInfo): Pool {
    return new Pool(this.packageInfo(), poolInfo);
  }

  getBank(bankInfo: BankInfo): Bank {
    return new Bank(this.packageInfo(), bankInfo);
  }

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

  getBankScript(bankInfoX: BankInfo, bankInfoY: BankInfo): BankScript {
    return new BankScript(
      this.packageInfo(),
      this.scriptPackageInfo(),
      bankInfoX,
      bankInfoY,
    );
  }

  public packageInfo(): SteammPackageInfo {
    return {
      sourcePkgId: this.sourcePkgId(),
      publishedAt: this.publishedAt(),
      quoterPkgs: {
        cpmm: this.sdkOptions.steammConfig.config!.quoterSourcePkgs.cpmm,
        omm: this.sdkOptions.steammConfig.config!.quoterSourcePkgs.omm,
      },
    };
  }

  public scriptPackageInfo(): PackageInfo {
    return {
      sourcePkgId: this.sdkOptions.steammScriptConfig.packageId,
      publishedAt: this.sdkOptions.steammScriptConfig.publishedAt,
    };
  }

  public sourcePkgId(): string {
    return this.sdkOptions.steammConfig.packageId;
  }

  public publishedAt(): string {
    return this.sdkOptions.steammConfig.publishedAt;
  }

  async getBanks(): Promise<BankList> {
    if (!this._banks) {
      await this.refreshBankCache();
    } else if (
      this.sdkOptions.cacheRefreshMs &&
      Date.now() > this._banks.updatedAt + this.sdkOptions.cacheRefreshMs
    ) {
      await this.refreshBankCache();
    }

    if (!this._banks) {
      throw new Error("Bank cache not initialized");
    }

    return this._banks.banks;
  }

  async getPools(coinTypes?: [string, string]): Promise<PoolInfo[]> {
    if (!this._pools) {
      await this.refreshPoolCache();
    } else if (
      this.sdkOptions.cacheRefreshMs &&
      Date.now() > this._pools.updatedAt + this.sdkOptions.cacheRefreshMs
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

  async getOracles(): Promise<OracleInfo[]> {
    if (!this._oracleRegistry) {
      await this.refreshOracleCache();
    } else if (
      this.sdkOptions.cacheRefreshMs &&
      Date.now() >
        this._oracleRegistry.updatedAt + this.sdkOptions.cacheRefreshMs
    ) {
      await this.refreshOracleCache();
    }

    if (!this._oracleRegistry) {
      throw new Error("Bank cache not initialized");
    }

    return this._oracleRegistry.oracles;
  }

  private async refreshOracleCache() {
    const oracleRegistry = await this.fullClient.fetchOracleRegistry(
      this._sdkOptions.oracleConfig.config!.oracleRegistryId,
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

  private async refreshBankCache() {
    const pkgAddy = this.sourcePkgId();

    let eventData: EventData<NewBankEvent>[] = [];

    const res: DataPage<EventData<NewBankEvent>[]> =
      await this.fullClient.queryEventsByPage({
        MoveEventType: `${pkgAddy}::events::Event<${pkgAddy}::bank::NewBankEvent>`,
      });

    eventData = res.data.reduce((acc, curr) => acc.concat(curr), []);

    this._banks = { banks: extractBankList(eventData), updatedAt: Date.now() };
  }

  async refreshPoolCache() {
    const pkgAddy = this.sourcePkgId();

    let eventData: EventData<NewPoolEvent>[] = [];

    const res: DataPage<EventData<NewPoolEvent>[]> =
      await this.fullClient.queryEventsByPage({
        MoveEventType: `${pkgAddy}::events::Event<${pkgAddy}::pool::NewPoolResult>`,
      });

    eventData = res.data.reduce((acc, curr) => acc.concat(curr), []);

    const oracleQuoterPkgId =
      this.sdkOptions.steammConfig.config?.quoterSourcePkgs.omm;

    let quoterEventData: EventData<NewOracleQuoterEvent>[] = [];
    const res2: DataPage<EventData<NewOracleQuoterEvent>[]> =
      await this.fullClient.queryEventsByPage({
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
