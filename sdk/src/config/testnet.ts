export const SUILEND_TESTNET_PKG_ID =
  "0xd868b023d126ac793280c505d6f1f96378459e6d7087f2d0b9a40fa84e73926a";
export const STEAMM_TESTNET_PKG_ID =
  "0x2f8751f6ff9554bd16849e5002b88147ad6549102bfd0ff04d509b666aa477ca";

export const TEST_SUI_TESTNET_TYPE = `${STEAMM_TESTNET_PKG_ID}::sui::SUI`;
export const TEST_USDC_TESTNET_TYPE = `${STEAMM_TESTNET_PKG_ID}::usdc::USDC`;

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
