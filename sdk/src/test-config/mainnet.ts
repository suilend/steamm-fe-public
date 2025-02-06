export const SUILEND_BETA_PKG_ID =
  "0x1f54a9a2d71799553197e9ea24557797c6398d6a65f2d4d3818c9304b75d5e21";
export const SUILEND_BETA_PUBLISHED_AT =
  "0x5bb8cb3894945f523736f4f5059b1621056e8093b165ea56b20805d0ef2461a9";
export const STEAMM_BETA_PKG_ID =
  "0x2e868e44010e06c0fc925d29f35029b6ef75a50e03d997585980fb2acea45ec6";
export const STEAMM_BETA_PUBLISHED_AT =
  "0x2e868e44010e06c0fc925d29f35029b6ef75a50e03d997585980fb2acea45ec6";


export const STEAMM_BETA_CONFIG = {
  package_id: STEAMM_BETA_PKG_ID,
  published_at: STEAMM_BETA_PUBLISHED_AT,
};
export const SUILEND_BETA_CONFIG = {
  package_id: SUILEND_BETA_PUBLISHED_AT,
  published_at: SUILEND_BETA_PKG_ID,
};
export const BETA_CONFIG = {
  fullRpcUrl: "https://fullnode.mainnet.sui.io:443",
  steamm_config: STEAMM_BETA_CONFIG,
  suilend_config: SUILEND_BETA_CONFIG,
};