import { SdkOptions } from "../sdk";
import { Package, SteammConfigs } from "../types";

import { ORACLE_CONFIG } from "./mainnet";

export const STEAMM_BETA_CONFIG: Package<SteammConfigs> = {
  package_id:
    "0x78fad9cc6e778755549e8c860328f06172e521f3db9be0ff756e8db94b44c3b3",
  published_at:
    "0x78fad9cc6e778755549e8c860328f06172e521f3db9be0ff756e8db94b44c3b3",
  config: {
    registryId:
      "0x15dd775763a5e8d59ff4ad658918720d5d2df91bf09cb6635f47dc737249c79a",
    globalAdmin:
      "0x83bcd98aa195b5c962bfda5c6f017e0dc3c1ea936ac8d35079eedd0a95f0c14a",
    quoterSourcePkgs: {
      cpmm: "0x78fad9cc6e778755549e8c860328f06172e521f3db9be0ff756e8db94b44c3b3",
      omm: "0x78fad9cc6e778755549e8c860328f06172e521f3db9be0ff756e8db94b44c3b3",
      omm_v2:
        "0x78fad9cc6e778755549e8c860328f06172e521f3db9be0ff756e8db94b44c3b3",
    },
  },
};

export const STEAMM_SCRIPT_BETA_CONFIG = {
  package_id:
    "0x50301c7ec20f9bf5be0ddf92c2f2a27a2c81f693308b6b2c358dda499d1691dd",
  published_at:
    "0x50301c7ec20f9bf5be0ddf92c2f2a27a2c81f693308b6b2c358dda499d1691dd",
};

export const SUILEND_BETA_CONFIG = {
  package_id:
    "0x1f54a9a2d71799553197e9ea24557797c6398d6a65f2d4d3818c9304b75d5e21",
  published_at:
    "0xd1ad8c401da6933bb5a5ccde1420f35c45e6a42a79ea6003f3248fe3c510d418",
  config: {
    lendingMarketId:
      "0x12e46de3eafaf0308a2dd64f1158782ed19e6621835bf883a1dd6b3061115667", // Main market (beta)
    lendingMarketType:
      "0x83556891f4a0f233ce7b05cfe7f957d4020492a34f5405b2cb9377d060bef4bf::spring_sui::SPRING_SUI",
  },
};

export const BETA_CONFIG: SdkOptions = {
  fullRpcUrl: "https://fullnode.mainnet.sui.io:443",
  suilend_config: SUILEND_BETA_CONFIG,
  steamm_config: STEAMM_BETA_CONFIG,
  steamm_script_config: STEAMM_SCRIPT_BETA_CONFIG,
  oracle_config: ORACLE_CONFIG,
};
