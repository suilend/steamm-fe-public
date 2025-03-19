import { SdkOptions } from "../sdk";

import {
  LENDING_MARKET_ID,
  LENDING_MARKET_TYPE,
  SUILEND_PKG_ID,
  SUILEND_PUBLISHED_AT,
} from "./mainnet";

export const STEAMM_BETA_PKG_ID =
  "0xddaa7c8c1e74d4b0448c5a11fdbee779eaca26c40183d8791e315c8f62530d51";
export const STEAMM_BETA_PUBLISHED_AT =
  "0xa73893381457055cb4c1ba97dca9ad611acd84e2c9eada7a9fdff9d40a0b1591";

export const ORACLE_BETA_PKG_ID =
  "0xf9c6edde058291f5b630ee8e6710c7a2f8cda1730ff935f24c32a06c2fd68cca";
export const ORACLE_BETA_PUBLISHED_AT =
  "0xf9c6edde058291f5b630ee8e6710c7a2f8cda1730ff935f24c32a06c2fd68cca";
export const ORACLE_BETA_REGISTRY_ID =
  "0x25dabc7f6d5d2e18b98ba780dd68e3af138d0a3bbe1d18ebc35a25d9354d378a";
export const ORACLE_ADMIN_CAP_OBJECT_ID =
  "0x7b077b66c8bffd20cfc2f006254bf5f60dc74f4157a09ea5c967c5bf2a4e83df";

export const REGISTRY_BETA_OBJECT_ID =
  "0xe20d9d9d762b3f233e0f2769f8ac7fe1c8bedcb1a006c11abd1cf3f013ac6df6";

export const GLOBAL_ADMIN_BETA_OBJECT_ID =
  "0xcebf107cba93173bd99837d0e267a8fedfbf43f127451af3fb61823373744868";

export const STEAMM_SCRIPT_BETA_PKG_ID =
  "0xdfcac0610e134d98885744e0fb4b400c77b850abaf7ec4b372530e3661d9728e";
export const STEAMM_SCRIPT_BETA_PUBLISHED_AT =
  "0x9caa34a479ff313e20b0be665540bf8b10192650a7886039fffdb449585c48f6";

export const STEAMM_BETA_ORACLE_QUOTER_PKG_ID =
  "0xa73893381457055cb4c1ba97dca9ad611acd84e2c9eada7a9fdff9d40a0b1591";

export const STEAMM_BETA_CONFIG = {
  package_id: STEAMM_BETA_PKG_ID,
  published_at: STEAMM_BETA_PUBLISHED_AT,
  config: {
    registryId: REGISTRY_BETA_OBJECT_ID,
    globalAdmin: GLOBAL_ADMIN_BETA_OBJECT_ID,
    oracleQuoterPkgId: STEAMM_BETA_ORACLE_QUOTER_PKG_ID,
  },
};
export const SUILEND_BETA_CONFIG = {
  package_id: SUILEND_PKG_ID,
  published_at: SUILEND_PUBLISHED_AT,
  config: {
    lendingMarketId: LENDING_MARKET_ID,
    lendingMarketType: LENDING_MARKET_TYPE,
  },
};
export const STEAMM_SCRIPT_BETA_CONFIG = {
  package_id: STEAMM_SCRIPT_BETA_PKG_ID,
  published_at: STEAMM_SCRIPT_BETA_PUBLISHED_AT,
};

export const ORACLE_BETA_CONFIG = {
  package_id: ORACLE_BETA_PKG_ID,
  published_at: ORACLE_BETA_PUBLISHED_AT,
  config: {
    oracleRegistryId: ORACLE_BETA_REGISTRY_ID,
  },
};

export const BETA_CONFIG: SdkOptions = {
  fullRpcUrl: "https://fullnode.mainnet.sui.io:443",
  suilend_config: SUILEND_BETA_CONFIG, // Same as SUILEND_CONFIG
  steamm_config: STEAMM_BETA_CONFIG,
  steamm_script_config: STEAMM_SCRIPT_BETA_CONFIG,
  oracle_config: ORACLE_BETA_CONFIG,
};
