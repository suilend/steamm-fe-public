import { Signer } from "@mysten/sui/cryptography";

import { Bank, BankScript, Pool, PoolScript } from "./base";
import { RouterModule } from "./modules";
import { BankModule } from "./modules/bankModule";
import { PoolModule } from "./modules/poolModule";
import { RpcModule } from "./modules/rpcModule";
import {
  BankInfo,
  BankList,
  DataPage,
  EventData,
  NewBankEvent,
  NewPoolEvent,
  Package,
  PackageInfo,
  PoolInfo,
  SteammConfigs,
  SuilendConfigs,
  extractBankList,
  extractPoolInfo,
} from "./types";
import { SuiAddressType, patchFixSuiObjectId } from "./utils";

export type SdkOptions = {
  fullRpcUrl: string;
  steamm_config: Package<SteammConfigs>;
  steamm_script_config: Package;
  suilend_config: Package<SuilendConfigs>;
};

export class SteammSDK {
  protected _rpcModule: RpcModule;
  protected _pool: PoolModule;
  protected _router: RouterModule;
  protected _bank: BankModule;
  protected _sdkOptions: SdkOptions;

  protected _signer: Signer | undefined;
  protected _senderAddress = "";

  constructor(options: SdkOptions) {
    this._sdkOptions = options;
    this._rpcModule = new RpcModule({
      url: options.fullRpcUrl,
    });

    this._pool = new PoolModule(this);
    this._bank = new BankModule(this);
    this._router = new RouterModule(this);

    patchFixSuiObjectId(this.sdkOptions);
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
  get fullClient(): RpcModule {
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
   * @returns {PoolModule} The Pool property value.
   */
  get Pool(): PoolModule {
    return this._pool;
  }

  /**
   * Getter for the Pool property.
   * @returns {BankModule} The Pool property value.
   */
  get Bank(): BankModule {
    return this._bank;
  }

  get Router(): RouterModule {
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

  public packageInfo(): PackageInfo {
    return {
      sourcePkgId: this.sourcePkgId(),
      publishedAt: this.publishedAt(),
    };
  }

  public scriptPackageInfo(): PackageInfo {
    return {
      sourcePkgId: this.sdkOptions.steamm_script_config.package_id,
      publishedAt: this.sdkOptions.steamm_script_config.published_at,
    };
  }

  public sourcePkgId(): string {
    return this.sdkOptions.steamm_config.package_id;
  }

  public publishedAt(): string {
    return this.sdkOptions.steamm_config.published_at;
  }

  async getBanks(): Promise<BankList> {
    const pkgAddy = this.sdkOptions.steamm_config.package_id;

    let eventData: EventData<NewBankEvent>[] = [];
    let bankList: BankList = {};

    const res: DataPage<EventData<NewBankEvent>[]> =
      await this.fullClient.queryEventsByPage({
        MoveEventType: `${pkgAddy}::events::Event<${pkgAddy}::bank::NewBankEvent>`,
      });

    eventData = res.data.reduce((acc, curr) => acc.concat(curr), []);

    bankList = extractBankList(eventData);

    return bankList;
  }

  async getPools(coinTypes?: [string, string]): Promise<PoolInfo[]> {
    const pkgAddy = this.sdkOptions.steamm_config.package_id;

    let eventData: EventData<NewPoolEvent>[] = [];
    let pools: PoolInfo[] = [];

    const res: DataPage<EventData<NewPoolEvent>[]> =
      await this.fullClient.queryEventsByPage({
        MoveEventType: `${pkgAddy}::events::Event<${pkgAddy}::pool::NewPoolResult>`,
      });

    eventData = res.data.reduce((acc, curr) => acc.concat(curr), []);
    pools = extractPoolInfo(eventData);

    // get pools by coin types
    if (coinTypes) {
      const banks = await this.getBanks();
      const bcoinTypes = {
        coinType1: banks[coinTypes[0]].btokenType,
        coinType2: banks[coinTypes[1]].btokenType,
      };

      pools = pools.filter(
        (pool) =>
          (pool.coinTypeA === bcoinTypes.coinType1 &&
            pool.coinTypeB === bcoinTypes.coinType2) ||
          (pool.coinTypeA === bcoinTypes.coinType2 &&
            pool.coinTypeB === bcoinTypes.coinType1),
      );
    }

    return pools;
  }

  async getPoolsByType(
    coinType1: string,
    coinType2: string,
  ): Promise<PoolInfo[]> {
    const pools = await this.getPools();

    return pools.filter(
      (pool) =>
        (pool.coinTypeA === coinType1 && pool.coinTypeB === coinType2) ||
        (pool.coinTypeA === coinType2 && pool.coinTypeB === coinType1),
    );
  }
}
