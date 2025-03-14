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
  "0xddaa7c8c1e74d4b0448c5a11fdbee779eaca26c40183d8791e315c8f62530d51";

export const REGISTRY_BETA_OBJECT_ID =
  "0xe20d9d9d762b3f233e0f2769f8ac7fe1c8bedcb1a006c11abd1cf3f013ac6df6";

export const GLOBAL_ADMIN_BETA_OBJECT_ID =
  "0xcebf107cba93173bd99837d0e267a8fedfbf43f127451af3fb61823373744868";

export const STEAMM_SCRIPT_BETA_PKG_ID = "";
export const STEAMM_SCRIPT_BETA_PUBLISHED_AT = "";

export const STEAMM_BETA_CONFIG = {
  package_id: STEAMM_BETA_PKG_ID,
  published_at: STEAMM_BETA_PUBLISHED_AT,
  config: {
    registryId: REGISTRY_BETA_OBJECT_ID,
    globalAdmin: GLOBAL_ADMIN_BETA_OBJECT_ID,
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

export const BETA_CONFIG: SdkOptions = {
  fullRpcUrl: "https://fullnode.mainnet.sui.io:443",
  suilend_config: SUILEND_BETA_CONFIG, // Same as SUILEND_CONFIG
  steamm_config: STEAMM_BETA_CONFIG,
  steamm_script_config: STEAMM_SCRIPT_BETA_CONFIG,
};
