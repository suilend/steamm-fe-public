export const SUILEND_PKG_ID =
  "0x1f54a9a2d71799553197e9ea24557797c6398d6a65f2d4d3818c9304b75d5e21";
export const SUILEND_PUBLISHED_AT =
  "0x5bb8cb3894945f523736f4f5059b1621056e8093b165ea56b20805d0ef2461a9";

export const STEAMM_PKG_ID =
  "0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261";
export const STEAMM_PUBLISHED_AT =
  "0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261";

export const REGISTRY_OBJECT_ID =
  "0x8584948e8c0a2809ec192ede7e030b0a32bd602e5ca6c91bde8dc35fb8b0068d";
export const GLOBAL_ADMIN_OBJECT_ID =
  "0xdd3d22dba6c38117615a51698136e9867191328a8ef1b065c342d0a887b9be4a";

export const LENDING_MARKET_ID =
  "0x84030d26d85eaa7035084a057f2f11f701b7e2e4eda87551becbc7c97505ece1";
export const LENDING_MARKET_TYPE =
  "0xf95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf::suilend::MAIN_POOL";

export const STEAMM_SCRIPT_PKG_ID =
  "0x7e69a01e9d856fdbfa315a3b0835d828ce632d3dd2fdc3d80de256895fca9e0a";
export const STEAMM_SCRIPT_PUBLISHED_AT =
  "0x7e69a01e9d856fdbfa315a3b0835d828ce632d3dd2fdc3d80de256895fca9e0a";

export const MAINNET_CONFIG = {
  fullRpcUrl: "https://fullnode.mainnet.sui.io:443",
  steamm_config: {
    package_id: STEAMM_PKG_ID,
    published_at: STEAMM_PUBLISHED_AT,
    config: {
      registryId: REGISTRY_OBJECT_ID,
      globalAdmin: GLOBAL_ADMIN_OBJECT_ID,
    },
  },
  suilend_config: {
    package_id: SUILEND_PUBLISHED_AT,
    published_at: SUILEND_PKG_ID,
    config: {
      lendingMarketId: LENDING_MARKET_ID,
      lendingMarketType: LENDING_MARKET_TYPE,
    },
  },
  steamm_script_config: {
    package_id: STEAMM_SCRIPT_PKG_ID,
    published_at: STEAMM_SCRIPT_PUBLISHED_AT,
  },
};
