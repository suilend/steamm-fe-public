import { SdkOptions } from "../sdk";
import { Package, SteammConfigs } from "../types";

import { ORACLE_CONFIG } from "./mainnet";

export const STEAMM_BETA_CONFIG: Package<SteammConfigs> = {
  package_id:
    "0xc765782a3e13ca6d89880433bcd7137bf368860038bc52513f4e4710a92b9d13",
  published_at:
    "0xc765782a3e13ca6d89880433bcd7137bf368860038bc52513f4e4710a92b9d13",
  config: {
    registryId:
      "0x15fe7bd1184857440c3613126718506d26e225db5ec43ebae01f1027fcf15d34",
    globalAdmin:
      "0xb480e29206136932123a8f9b04bdb42da79e15060f3811c6e8b62c365e96b395",
    quoterSourcePkgs: {
      cpmm: "0xc765782a3e13ca6d89880433bcd7137bf368860038bc52513f4e4710a92b9d13",
      omm: "0xc765782a3e13ca6d89880433bcd7137bf368860038bc52513f4e4710a92b9d13",
      omm_v2:
        "0xc765782a3e13ca6d89880433bcd7137bf368860038bc52513f4e4710a92b9d13",
    },
  },
};

export const STEAMM_SCRIPT_BETA_CONFIG = {
  package_id:
    "0xeb1cdce9f21401a0c49d67ce4391ef431054da51b51b2701528f1815eb787f51",
  published_at:
    "0xeb1cdce9f21401a0c49d67ce4391ef431054da51b51b2701528f1815eb787f51",
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
