import { SdkOptions } from "../sdk";
import { Package, SteammConfigs } from "../types";

import { ORACLE_CONFIG } from "./mainnet";

export const STEAMM_BETA_CONFIG: Package<SteammConfigs> = {
  package_id:
    "0xb41402e33ca9c00b610ae96a0780de7ba0caaa10f50b11b8d54ad6f1f4e50ce5",
  published_at:
    "0x27b4732a24c2ff79f49de10d11317701b6196365c213f97f225b52caba5c73a3",
  config: {
    registryId:
      "0x62986f83e2a4a3724460cfe5ddee54e9de14e4f680b7f66b00cbb9096fd9da60",
    globalAdmin:
      "0x2fafd49a9549c36a84f1ea725f0c19fe54419a677b0a7f78241ce78715e8a82e",
    quoterSourcePkgs: {
      cpmm: "0xb41402e33ca9c00b610ae96a0780de7ba0caaa10f50b11b8d54ad6f1f4e50ce5",
      omm: "0xb41402e33ca9c00b610ae96a0780de7ba0caaa10f50b11b8d54ad6f1f4e50ce5",
      stable:
        "0x27b4732a24c2ff79f49de10d11317701b6196365c213f97f225b52caba5c73a3",
    },
  },
};

export const STEAMM_SCRIPT_BETA_CONFIG = {
  package_id:
    "0xa4544b52b40e44e41d3ec2d13a9b112b6d0b199641ba98b4664da2f841168ce5",
  published_at:
    "0x3eec6d02cc5f2bc56afc3ac386212ca70360bc54a1703a1e8e3d303f9ac75faf",
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
