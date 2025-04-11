import { Signer } from "@mysten/sui/cryptography";
import { normalizeStructTag } from "@mysten/sui/utils";
import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from "@pythnetwork/pyth-sui-js";
import BigNumber from "bignumber.js";
import pLimit from "p-limit";

import {
  NORMALIZED_STEAMM_POINTS_COINTYPE,
  getCoinMetadataMap,
  isSteammPoints,
} from "@suilend/frontend-sui";
import {
  ParsedObligation,
  Side,
  SuilendClient,
  formatRewards,
  initializeObligations,
  initializeSuilend,
} from "@suilend/sdk";

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

export class SteammSDK {
  protected _rpcModule: RpcModule;
  protected _pool: PoolModule;
  protected _router: RouterModule;
  protected _bank: BankModule;
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
    this._rpcModule = new RpcModule({
      url: options.fullRpcUrl,
    });

    this._pool = new PoolModule(this);
    this._bank = new BankModule(this);
    this._router = new RouterModule(this);
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

  async getPools(coinTypes?: [string, string]): Promise<PoolInfo[]> {
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

  async getOracles(): Promise<OracleInfo[]> {
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

  private async refreshOracleCache() {
    const oracleRegistry = await this.fullClient.fetchOracleRegistry(
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
      this.sdkOptions.steamm_config.config?.quoterSourcePkgs.omm;

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

  async getUserPositions(address: string): Promise<
    {
      poolId: string;
      coinTypeA: string;
      coinTypeB: string;
      lpTokenBalance: BigNumber;
      balanceA: BigNumber;
      balanceB: BigNumber;
      claimableRewards: Record<string, BigNumber>;
      totalPoints: BigNumber;
    }[]
  > {
    // Banks
    const bankInfos = Object.values(await this.getBanks());

    const bTokenTypeCoinTypeMap: Record<string, string> = {};

    for (const bankInfo of bankInfos) {
      bTokenTypeCoinTypeMap[bankInfo.btokenType] = normalizeStructTag(
        bankInfo.coinType,
      );
    }

    // Pools
    const poolInfos = await this.getPools();

    // CoinMetadata
    const coinMetadataMap = await getCoinMetadataMap(
      this.fullClient,
      Array.from(
        new Set(
          poolInfos
            .map((poolInfo) => [
              poolInfo.lpTokenType,
              bTokenTypeCoinTypeMap[poolInfo.coinTypeA],
              bTokenTypeCoinTypeMap[poolInfo.coinTypeB],
            ])
            .flat(),
        ),
      ),
    );

    // Suilend
    const suilendClient = await SuilendClient.initialize(
      process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
        ? "0xb1d89cf9082cedce09d3647f0ebda4a8b5db125aff5d312a8bfd7eefa715bd35" // Requires NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true
        : "0xc1888ec1b81a414e427a44829310508352aec38252ee0daa9f8b181b6947de9f",
      process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
        ? "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP"
        : "0x0a071f4976abae1a7f722199cf0bfcbe695ef9408a878e7d12a7ca87b7e582a6::lp_rewards::LP_REWARDS",
      this.fullClient,
    );

    const {
      refreshedRawReserves,
      reserveMap,

      rewardCoinMetadataMap,
    } = await initializeSuilend(this.fullClient, suilendClient);

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
      suilendClient,
      refreshedRawReserves,
      reserveMap,
      address,
    );

    // Rewards
    const rewardMap = formatRewards(
      reserveMap,
      rewardCoinMetadataMap,
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

    const poolRewardMap = poolInfos.reduce(
      (acc, poolInfo) => ({
        ...acc,
        [poolInfo.poolId]: (
          rewardMap[poolInfo.lpTokenType]?.[Side.DEPOSIT] ?? []
        ).reduce(
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
      totalPoints: BigNumber;
    }[] = [];

    const limit10 = pLimit(10);
    await Promise.all(
      poolInfos.map((poolInfo) =>
        limit10(async () => {
          const pool = poolInfo.quoterType.endsWith("cpmm::CpQuoter")
            ? await this.fullClient.fetchConstantProductPool(poolInfo.poolId)
            : poolInfo.quoterType.endsWith("omm::OracleQuoter")
              ? await this.fullClient.fetchOraclePool(poolInfo.poolId)
              : await this.fullClient.fetchConstantProductPool(poolInfo.poolId); // Should never need to use the fallback

          const bTokenTypeA = poolInfo.coinTypeA;
          const bTokenTypeB = poolInfo.coinTypeB;

          const coinTypeA = bTokenTypeCoinTypeMap[bTokenTypeA];
          const coinTypeB = bTokenTypeCoinTypeMap[bTokenTypeB];

          const bankInfoA = bankInfos.find(
            (bankInfo) => bankInfo.btokenType === bTokenTypeA,
          )!;
          const bankInfoB = bankInfos.find(
            (bankInfo) => bankInfo.btokenType === bTokenTypeB,
          )!;

          const redeemQuote = await this.Pool.quoteRedeem({
            lpTokens: pool.lpSupply.value,
            poolInfo,
            bankInfoA,
            bankInfoB,
          });

          const balanceA = new BigNumber(redeemQuote.withdrawA.toString()).div(
            10 ** coinMetadataMap[coinTypeA].decimals,
          );
          const balanceB = new BigNumber(redeemQuote.withdrawB.toString()).div(
            10 ** coinMetadataMap[coinTypeB].decimals,
          );

          // User
          const obligationIndexes = getIndexesOfObligationsWithDeposit(
            obligations,
            poolInfo.lpTokenType,
          );

          const lpTokenBalance =
            balanceMap[poolInfo.lpTokenType] ?? new BigNumber(0);
          const lpTokenDepositedAmount = obligationIndexes.reduce(
            (acc, obligationIndex) =>
              acc.plus(
                getObligationDepositedAmount(
                  obligations[obligationIndex],
                  poolInfo.lpTokenType,
                ),
              ),
            new BigNumber(0),
          );

          const lpTokenTotalAmount = lpTokenBalance.plus(
            lpTokenDepositedAmount,
          );
          if (lpTokenTotalAmount.eq(0)) return;

          const lpSupply = new BigNumber(pool.lpSupply.value.toString()).div(
            10 ** 9,
          );

          result.push({
            poolId: poolInfo.poolId,
            coinTypeA,
            coinTypeB,
            lpTokenBalance,
            balanceA: new BigNumber(lpTokenTotalAmount.div(lpSupply)).times(
              balanceA,
            ),
            balanceB: new BigNumber(lpTokenTotalAmount.div(lpSupply)).times(
              balanceB,
            ),
            claimableRewards: Object.fromEntries(
              Object.entries(poolRewardMap[pool.id] ?? {}).filter(
                ([coinType, amount]) => !isSteammPoints(coinType),
              ),
            ),
            totalPoints:
              poolRewardMap[pool.id]?.[NORMALIZED_STEAMM_POINTS_COINTYPE] ??
              new BigNumber(0),
          });
        }),
      ),
    );

    return result;
  }
}
