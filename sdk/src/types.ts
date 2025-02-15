import { SuiAddressType } from "./utils";

export interface PackageInfo {
  sourcePkgId: string;
  publishedAt: string;
}

export type SuiObjectIdType = string;

/**
 * Represents query parameters for pagination.
 */
export type PageQuery = {
  cursor?: any;
  limit?: number | null;
};

/**
 * Represents arguments for pagination, with options for fetching all data or using PageQuery.
 */
export type PaginationArgs = "all" | PageQuery;

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
  lp_token_type: { name: string };
  pool_id: string;
  quoter_type: { name: string };
  swap_fee_bps: string;
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
      pool_id,
      coin_type_a,
      coin_type_b,
      lp_token_type,
      quoter_type,
      swap_fee_bps,
    } = event.parsedJson.event;
    return {
      poolId: pool_id,
      coinTypeA: `0x${coin_type_a.name}`,
      coinTypeB: `0x${coin_type_b.name}`,
      lpTokenType: `0x${lp_token_type.name}`,
      quoterType: `0x${quoter_type.name}`,
      swapFeeBps: parseInt(swap_fee_bps),
    };
  });
}

export type SteammConfigs = {
  registryId: SuiObjectIdType;
  globalAdmin: SuiObjectIdType;
};

export type SuilendConfigs = {
  lendingMarketId: SuiObjectIdType;
  lendingMarketType: string;
};

export type BankList = {
  [key: string]: BankInfo;
};

export function getBankFromBToken(
  bankList: BankList,
  bTokenType: string,
): BankInfo {
  const bankInfos = Object.values(bankList);
  const bankInfo = bankInfos.find(
    (bankInfo) => bankInfo.btokenType === bTokenType,
  );

  if (!bankInfo) {
    throw new Error(
      `BankInfo not found for the given bTokenType: ${bTokenType}`,
    );
  }

  return bankInfo;
}

export function getBankFromUnderlying(
  bankList: BankList,
  coinType: string,
): BankInfo {
  const bankInfo = bankList[coinType];

  if (!bankInfo) {
    throw new Error(
      `BankInfo not found for the given underlying coin: ${coinType}`,
    );
  }

  return bankInfo;
}

export type PoolInfo = {
  poolId: SuiObjectIdType;
  coinTypeA: string;
  coinTypeB: string;
  lpTokenType: string;
  quoterType: string;
  swapFeeBps: number;
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
