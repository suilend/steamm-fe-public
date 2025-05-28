import { BankObj, OracleObj, PoolObj } from "./lib";

export type SdkOptions = {
  fullRpcUrl: string;
  packages: {
    steamm: Package<SteammConfigs>;
    oracle: Package<OracleConfigs>;
    steammScript: Package;
    suilend: Package<SuilendConfigs>;
  };
  cache_refresh_ms?: number /* default: 5000 */;
  enableTestMode?: boolean;
};

export interface TestConfig {
  mockOracleObjs: Record<string, string>;
}

export interface PoolCache {
  pools: PoolInfo[];
  updatedAt: number;
}

export interface BankCache {
  banks: BankList;
  updatedAt: number;
}

export interface OracleCache {
  oracles: OracleInfo[];
  updatedAt: number;
}

export type SteammInfo = PackageInfo & {
  quoterIds: {
    cpmm: string;
    omm: string;
    ommV2: string;
  };
};

export interface PackageInfo {
  originalId: string;
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

export type NewOracleQuoterEvent = {
  pool_id: string;
  oracle_registry_id: string;
  oracle_index_a: string;
  oracle_index_b: string;
};

export type NewOracleV2QuoterEvent = {
  pool_id: string;
  oracle_registry_id: string;
  oracle_index_a: string;
  oracle_index_b: string;
  amplifier: string;
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

export function extractOracleQuoterInfo(
  events: EventData<NewOracleQuoterEvent>[],
): Record<string, QuoterData> {
  return events.reduce(
    (acc, event) => {
      const { pool_id, oracle_registry_id, oracle_index_a, oracle_index_b } =
        event.parsedJson.event;
      acc[pool_id] = {
        type: "Oracle",
        oracleRegistryId: oracle_registry_id,
        oracleIndexA: Number(oracle_index_a),
        oracleIndexB: Number(oracle_index_b),
      };
      return acc;
    },
    {} as Record<string, QuoterData>,
  );
}

export function extractOracleV2QuoterInfo(
  events: EventData<NewOracleV2QuoterEvent>[],
): Record<string, QuoterData> {
  return events.reduce(
    (acc, event) => {
      const {
        pool_id,
        oracle_registry_id,
        oracle_index_a,
        oracle_index_b,
        amplifier,
      } = event.parsedJson.event;
      acc[pool_id] = {
        type: "OracleV2",
        oracleRegistryId: oracle_registry_id,
        oracleIndexA: Number(oracle_index_a),
        oracleIndexB: Number(oracle_index_b),
        amplifier: BigInt(amplifier),
      };
      return acc;
    },
    {} as Record<string, QuoterData>,
  );
}

export type SteammConfigs = {
  registryId: SuiObjectIdType;
  globalAdmin: SuiObjectIdType;
  quoterIds: {
    cpmm: SuiObjectIdType;
    omm: SuiObjectIdType;
    ommV2: SuiObjectIdType;
  };
};

export type OracleConfigs = {
  oracleRegistryId: SuiObjectIdType;
};

export type SuilendConfigs = {
  lendingMarketId: SuiObjectIdType;
  lendingMarketType: string;
};

export type OracleInfo = {
  oracleIdentifier: number[] | string;
  oracleIndex: number;
  oracleType: "pyth" | "switchboard";
};

export type BankList = Record<string, BankInfo>;

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

export function getBankFromId(bankList: BankList, bankId: string): BankInfo {
  const bankInfos = Object.values(bankList);
  const bankInfo = bankInfos.find((bankInfo) => bankInfo.bankId === bankId);

  if (!bankInfo) {
    throw new Error(`BankInfo not found for the given ID: ${bankId}`);
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
  quoterData?: QuoterData;
};

export type QuoterData =
  | {
      type: "Oracle";
      oracleIndexA: number;
      oracleIndexB: number;
      oracleRegistryId: SuiObjectIdType;
    }
  | {
      type: "OracleV2";
      oracleIndexA: number;
      oracleIndexB: number;
      oracleRegistryId: SuiObjectIdType;
      amplifier: bigint;
    };

export function getQuoterType(
  quoterType: string,
): "ConstantProduct" | "Oracle" | "OracleV2" {
  if (quoterType.includes("::cpmm::CpQuoter")) {
    return "ConstantProduct";
  } else if (quoterType.includes("::omm::OracleQuoter")) {
    return "Oracle";
  } else if (quoterType.includes("::omm_v2::OracleQuoterV2")) {
    return "OracleV2";
  } else {
    throw new Error(`Unknown quoter type: ${quoterType}`);
  }
}

export type BankInfo = {
  coinType: string;
  btokenType: string;
  lendingMarketType: string;
  bankId: SuiObjectIdType;
  lendingMarketId: SuiObjectIdType;
};

/**
 * Represents a package containing specific configuration or data.
 * @template T - The type of configuration or data contained in the package.
 */
export type Package<T = undefined> = {
  /**
   * The unique identifier of the package.
   */
  packageId: string;
  /**
   * the package was published.
   */
  publishedAt: string;
  /**
   * The version number of the package (optional).
   */
  version?: number;
  /**
   * The configuration or data contained in the package (optional).
   */
  config?: T;
};

export interface ApiOracleCache {
  oracleObjs: OracleObj[];
  updatedAt: number;
}

export interface ApiPoolCache {
  poolObjs: PoolObj[];
  updatedAt: number;
}

export interface ApiBankCache {
  bankObjs: BankObj[];
  updatedAt: number;
}
