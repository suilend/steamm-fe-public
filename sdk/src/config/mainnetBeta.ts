export const SUILEND_BETA_PKG_ID =
  "0x1f54a9a2d71799553197e9ea24557797c6398d6a65f2d4d3818c9304b75d5e21";
export const SUILEND_BETA_PUBLISHED_AT =
  "0x5bb8cb3894945f523736f4f5059b1621056e8093b165ea56b20805d0ef2461a9";

export const STEAMM_BETA_PKG_ID =
  "0x8f19f70c0ce1f69c5533e1e981b5b0342b309cb1d324ee6b0d5e9b969d1cc639";
export const STEAMM_BETA_PUBLISHED_AT =
  "0x8f19f70c0ce1f69c5533e1e981b5b0342b309cb1d324ee6b0d5e9b969d1cc639";

export const REGISTRY_BETA_OBJECT_ID =
  "0x50be15ca6e028dd60d506d9d098c4bb2ae94a88331df287d2201cf93c25441c4";

export const GLOBAL_ADMIN_OBJECT_ID =
  "0x7cd7d0e22e256e6d339a4198c481b08193831394c3556d606526c9d1df1f651d";

export const LENDING_MARKET_ID =
  "0x84030d26d85eaa7035084a057f2f11f701b7e2e4eda87551becbc7c97505ece1";
export const LENDING_MARKET_TYPE =
  "0xf95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf::suilend::MAIN_POOL";

export const STEAMM_SCRIPT_PKG_ID =
  "0x845152a6e383ba4bd34425772d95280db380aa304f2d2dc4e0c22a0ccfb84f52";
export const STEAMM_SCRIPT_PUBLISHED_AT =
  "0x845152a6e383ba4bd34425772d95280db380aa304f2d2dc4e0c22a0ccfb84f52";

export const STEAMM_BETA_CONFIG = {
  package_id: STEAMM_BETA_PKG_ID,
  published_at: STEAMM_BETA_PUBLISHED_AT,
  config: {
    registryId: REGISTRY_BETA_OBJECT_ID,
    globalAdmin: GLOBAL_ADMIN_OBJECT_ID,
  },
};
export const SUILEND_BETA_CONFIG = {
  package_id: SUILEND_BETA_PUBLISHED_AT,
  published_at: SUILEND_BETA_PKG_ID,
  config: {
    lendingMarketId: LENDING_MARKET_ID,
    lendingMarketType: LENDING_MARKET_TYPE,
  },
};

export const STEAMM_SCRIPT_CONFIG = {
  package_id: STEAMM_SCRIPT_PKG_ID,
  published_at: STEAMM_SCRIPT_PKG_ID,
};

export const BETA_CONFIG = {
  fullRpcUrl: "https://fullnode.mainnet.sui.io:443",
  steamm_config: STEAMM_BETA_CONFIG,
  suilend_config: SUILEND_BETA_CONFIG,
  steamm_script_config: STEAMM_SCRIPT_CONFIG,
};
