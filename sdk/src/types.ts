import { SuiObjectIdType } from "./modules/rpcModule";
import { SuiAddressType } from "./utils";

/**
 * Represents a paginated data page with optional cursor and limit.
 */
export type DataPage<T> = {
  data: T[];
  nextCursor?: any;
  hasNextPage: boolean;
};

export type NewPoolEvent = {
  coin_type_a: { name: string };
  coin_type_b: { name: string };
  creator: string;
  lp_token_type: { name: string };
  pool_cap_id: string;
  pool_id: string;
  quoter_type: { name: string };
};

export type NewBankEvent = {
  bank_id: string;
  btoken_type: { name: string };
  coin_type: { name: string };
  lending_market_id: string;
  lending_market_type: { name: string };
};

export type EventData<T> = {
  id: {
    txDigest: string;
    eventSeq: string;
  };
  packageId: string;
  transactionModule: string;
  sender: string;
  type: string;
  parsedJson: {
    event: T;
  };
  bcsEncoding: string;
  bcs: string;
  timestampMs: string;
};

export function extractBankList(events: EventData<NewBankEvent>[]): BankList {
  const bankList: BankList = {};

  events.forEach((event) => {
    const {
      coin_type,
      btoken_type,
      bank_id,
      lending_market_id,
      lending_market_type,
    } = event.parsedJson.event;

    const bankInfo: BankInfo = {
      coinType: `0x${coin_type.name}`,
      btokenType: `0x${btoken_type.name}`,
      lendingMarketType: `0x${lending_market_type.name}`,
      bankId: bank_id,
      lendingMarketId: lending_market_id,
    };

    // Set the key as coin_type.name
    bankList[`0x${coin_type.name}`] = bankInfo;
  });

  return bankList;
}

export function extractPoolInfo(events: EventData<NewPoolEvent>[]): PoolInfo[] {
  return events.map((event) => {
    const {
      creator,
      pool_id,
      pool_cap_id,
      coin_type_a,
      coin_type_b,
      lp_token_type,
      quoter_type,
    } = event.parsedJson.event;
    return {
      creator,
      poolId: pool_id,
      poolCapId: pool_cap_id,
      coinTypeA: `0x${coin_type_a.name}`,
      coinTypeB: `0x${coin_type_b.name}`,
      lpTokenType: `0x${lp_token_type.name}`,
      quoterType: `0x${quoter_type.name}`,
    };
  });
}

export type SteammConfigs = {
  registryId: SuiObjectIdType;
  globalConfigId: SuiObjectIdType;
  adminCapId: SuiObjectIdType;
};

export type SuilendConfigs = {
  lendingMarketId: SuiObjectIdType;
  lendingMarketType: string;
};

export type BankList = {
  [key: string]: BankInfo;
};

export type PoolInfo = {
  creator: SuiAddressType;
  poolId: SuiObjectIdType;
  poolCapId: SuiObjectIdType;
  coinTypeA: string;
  coinTypeB: string;
  lpTokenType: string;
  quoterType: string;
};

export type BankInfo = {
  coinType: string;
  btokenType: string;
  lendingMarketType: string;
  bankId: SuiObjectIdType;
  lendingMarketId: SuiObjectIdType;
};

/**
 * Represents configuration data for a cryptocurrency coin.
 */
export type CoinConfig = {
  /**
   * The unique identifier of the coin.
   */
  id: string;

  /**
   * The name of the coin.
   */
  name: string;

  /**
   * The symbol of the coin.
   */
  symbol: string;

  /**
   * The address associated with the coin.
   */
  address: string;

  /**
   * The Pyth identifier of the coin.
   */
  pyth_id: string;

  /**
   * The project URL related to the coin.
   */
  project_url: string;

  /**
   * The URL to the logo image of the coin.
   */
  logo_url: string;

  /**
   * The number of decimal places used for the coin.
   */
  decimals: number;

  /**
   * Additional properties for the coin configuration.
   */
} & Record<string, any>;

/**
 * Represents a package containing specific configuration or data.
 * @template T - The type of configuration or data contained in the package.
 */
export type Package<T = undefined> = {
  /**
   * The unique identifier of the package.
   */
  package_id: string;
  /**
   * the package was published.
   */
  published_at: string;
  /**
   * The version number of the package (optional).
   */
  version?: number;
  /**
   * The configuration or data contained in the package (optional).
   */
  config?: T;
};
