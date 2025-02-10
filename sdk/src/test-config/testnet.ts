export const SUILEND_TESTNET_PKG_ID =
  "0xf8659699b500cb66c7625b9859e796bbdb62777632c6ea900c937bbe0578acd7";
export const STEAMM_TESTNET_PKG_ID =
  "0x0248d02e356aa2954eeca9ead0bd3df976eda06044a7d29009f31740d612ac8e";

export const TESTNET_CONFIG = {
  fullRpcUrl: "https://fullnode.testnet.sui.io:443",
  steamm_config: {
    package_id: STEAMM_TESTNET_PKG_ID,
    published_at: STEAMM_TESTNET_PKG_ID,
  },
  suilend_config: {
    package_id: SUILEND_TESTNET_PKG_ID,
    published_at: SUILEND_TESTNET_PKG_ID,
  },
};
