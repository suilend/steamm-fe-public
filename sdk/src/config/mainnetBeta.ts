export const SUILEND_BETA_PKG_ID =
  "0x1f54a9a2d71799553197e9ea24557797c6398d6a65f2d4d3818c9304b75d5e21";
export const SUILEND_BETA_PUBLISHED_AT =
  "0x5bb8cb3894945f523736f4f5059b1621056e8093b165ea56b20805d0ef2461a9";
export const STEAMM_BETA_PKG_ID =
  "0x6577c4d23783f79ba40d501e29a017c1e36a280ea3036632ba1bfe152dacadf5";
export const STEAMM_BETA_PUBLISHED_AT =
  "0x15dadedd5337d081697ec44b9ad337491f8361308b69af9067bedb7fb823e115";

export const REGISTRY_BETA_OBJECT_ID =
  "0x6577c4d23783f79ba40d501e29a017c1e36a280ea3036632ba1bfe152dacadf5";

export const GLOBAL_ADMIN_OBJECT_ID =
  "0x015d951a430da11f4a997d3058ffea49257045df894c6817b663d28b12c511a6";

export const LENDING_MARKET_ID =
  "0x84030d26d85eaa7035084a057f2f11f701b7e2e4eda87551becbc7c97505ece1";
export const LENDING_MARKET_TYPE =
  "0xf95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf::suilend::MAIN_POOL";

export const STEAMM_SCRIPT_PKG_ID =
  "0xe167bfdc4b8410e4af76079a37412590ace95064b2d17f1f3b7fed2009a59843";
export const STEAMM_SCRIPT_PUBLISHED_AT =
  "0x772b3d9c5d170f8225a231fa4f0366eef608117099191d316482139c2bc223fc";

export const TEST_SUI_BETA_TYPE = `${STEAMM_BETA_PKG_ID}::sui::SUI`;
export const TEST_USDC_BETA_TYPE = `${STEAMM_BETA_PKG_ID}::usdc::USDC`;

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
