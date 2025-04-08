import { SdkOptions } from "../sdk";
import { Package, SteammConfigs } from "../types";

import { ORACLE_CONFIG } from "./mainnet";

export const STEAMM_BETA_CONFIG: Package<SteammConfigs> = {
  package_id:
    "0xca434de5b4ef05a2ad059947b371f9c94ae8c7786fdb112fe83da50b76f5069f",
  published_at:
    "0xca434de5b4ef05a2ad059947b371f9c94ae8c7786fdb112fe83da50b76f5069f",
  config: {
    registryId:
      "0x459187246e094301d1a0b58780e5b1761e8551ac88ffc125684e9d5a3f7dcefc",
    globalAdmin:
      "0xf79576d0911a1631407d76788aa88b401d128f75d2f9edbd645f3aee3d3bc9fd",
    quoterSourcePkgs: {
      cpmm: "0xca434de5b4ef05a2ad059947b371f9c94ae8c7786fdb112fe83da50b76f5069f",
      omm: "0xca434de5b4ef05a2ad059947b371f9c94ae8c7786fdb112fe83da50b76f5069f",
      stable:
        "0xca434de5b4ef05a2ad059947b371f9c94ae8c7786fdb112fe83da50b76f5069f",
    },
  },
};

export const STEAMM_SCRIPT_BETA_CONFIG = {
  package_id:
    "0xdfcac0610e134d98885744e0fb4b400c77b850abaf7ec4b372530e3661d9728e",
  published_at:
    "0xdfcac0610e134d98885744e0fb4b400c77b850abaf7ec4b372530e3661d9728e",
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
