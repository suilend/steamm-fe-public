import { SdkOptions } from "../sdk";

import {
  LENDING_MARKET_ID,
  LENDING_MARKET_TYPE,
  SUILEND_PKG_ID,
  SUILEND_PUBLISHED_AT,
} from "./mainnet";

export const STEAMM_BETA_PKG_ID =
  "0x8f19f70c0ce1f69c5533e1e981b5b0342b309cb1d324ee6b0d5e9b969d1cc639";
export const STEAMM_BETA_PUBLISHED_AT =
  "0x8f19f70c0ce1f69c5533e1e981b5b0342b309cb1d324ee6b0d5e9b969d1cc639";

export const REGISTRY_BETA_OBJECT_ID =
  "0x50be15ca6e028dd60d506d9d098c4bb2ae94a88331df287d2201cf93c25441c4";

export const GLOBAL_ADMIN_BETA_OBJECT_ID =
  "0x7cd7d0e22e256e6d339a4198c481b08193831394c3556d606526c9d1df1f651d";

export const STEAMM_SCRIPT_BETA_PKG_ID =
  "0x845152a6e383ba4bd34425772d95280db380aa304f2d2dc4e0c22a0ccfb84f52";
export const STEAMM_SCRIPT_BETA_PUBLISHED_AT =
  "0x845152a6e383ba4bd34425772d95280db380aa304f2d2dc4e0c22a0ccfb84f52";

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
