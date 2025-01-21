import {
  SteammConfigs,
  Package,
  SuilendConfigs,
  BankList,
  DataPage,
  PoolInfo,
  EventData,
  NewPoolEvent,
  extractPoolInfo,
  NewBankEvent,
  extractBankList,
} from "./types";
import { RpcModule } from "./modules/rpcModule";
import { patchFixSuiObjectId, SuiAddressType } from "./utils";
import { PoolModule } from "./modules/poolModule";
import { Signer } from "@mysten/sui/dist/cjs/cryptography/keypair";

export type SdkOptions = {
  fullRpcUrl: string;
  steamm_config: Package<SteammConfigs>;
  suilend_config: Package<SuilendConfigs>;
};

export class SteammSDK {
  protected _rpcModule: RpcModule;
  protected _pool: PoolModule;
  protected _sdkOptions: SdkOptions;

  protected _signer: Signer | undefined;
  protected _senderAddress = "";

  constructor(options: SdkOptions) {
    this._sdkOptions = options;
    this._rpcModule = new RpcModule({
      url: options.fullRpcUrl,
    });

    this._pool = new PoolModule(this);

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

  async getPools(): Promise<PoolInfo[]> {
    const pkgAddy = this.sdkOptions.steamm_config.package_id;

    let eventData: EventData<NewPoolEvent>[] = [];
    let pools: PoolInfo[] = [];

    const res: DataPage<EventData<NewPoolEvent>[]> =
      await this.fullClient.queryEventsByPage({
        MoveEventType: `${pkgAddy}::events::Event<${pkgAddy}::pool::NewPoolResult>`,
      });

    eventData = res.data.reduce((acc, curr) => acc.concat(curr), []);
    pools = extractPoolInfo(eventData);

    return pools;
  }
}
