import { CoinBalance } from "@mysten/sui/client";
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

import { BankAbi, BankScript, PoolAbi, PoolScript } from "./abis";
import { PYTH_STATE_ID, WORMHOLE_STATE_ID } from "./config";
import { BankManager } from "./managers/bank";
import { FullClient } from "./managers/client";
import { PoolManager } from "./managers/pool";
import { Router } from "./managers/router";
import {
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
   * Fetches all LP token balances for a specific address.
   *
   * @param {SuiAddressType} address - The address to fetch LP token balances for.
   * @param {Set<string>} [lpCoinTypes] - Optional set of LP coin types to filter by.
   *                                      If not provided, all LP token types will be fetched.
   * @returns {Promise<CoinBalance[]>} A promise that resolves to an array of CoinBalance objects
   *                                   representing the LP token balances for the address.
   * @throws {Error} If there is an error fetching the balances from the blockchain.
   */
  async getLpTokenBalances(
    address: SuiAddressType,
    lpCoinTypes?: Set<string>,
  ): Promise<CoinBalance[]> {
    const coinTypes = lpCoinTypes ?? (await this.fetchLpTokenTypes());
    try {
      const balances = await this.fullClient.getAllBalances({
        owner: address,
      });
      const lpBalances = [];

      for (const balance of balances) {
        if (coinTypes.has(balance.coinType)) {
          lpBalances.push(balance);
        }
      }
      return lpBalances;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves all liquidity positions for a specific user across all pools.
   *
   * This method fetches comprehensive information about a user's positions including:
   * - LP token balances (both in wallet and deposited in lending markets)
   * - Underlying asset balances (tokenA and tokenB) based on the user's share of the pool
   * - Claimable rewards across all relevant protocols
   * - Total STEAMM points accumulated
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
   *   totalPoints: BigNumber;      - Total STEAMM points accumulated
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
      totalPoints: BigNumber;
    }[]
  > {
    // Banks
    const bankInfos = Object.values(await this.fetchBankData());

    const bTokenTypeCoinTypeMap: Record<string, string> = {};

    for (const bankInfo of bankInfos) {
      bTokenTypeCoinTypeMap[bankInfo.btokenType] = normalizeStructTag(
        bankInfo.coinType,
      );
    }

    // Pools
    const poolInfos = await this.fetchPoolData();

    // CoinMetadata
    const coinMetadataMap = await getCoinMetadataMap(
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
          const pool = poolInfo.quoterType.endsWith("omm::OracleQuoter")
            ? await this.fullClient.fetchOraclePool(poolInfo.poolId)
            : poolInfo.quoterType.endsWith("omm_v2::OracleQuoterV2")
              ? await this.fullClient.fetchOracleV2Pool(poolInfo.poolId)
              : await this.fullClient.fetchConstantProductPool(poolInfo.poolId);

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
