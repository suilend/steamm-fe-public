import { SdkOptions } from "../types";

export const STEAMM_CONFIG = {
  packageId:
    "0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261",
  publishedAt:
    "0xdf7bad227d873a47f0f1e86676cabb163734b73f2351bdf0ebf9c6ef15469cef",
  config: {
    registryId:
      "0x8584948e8c0a2809ec192ede7e030b0a32bd602e5ca6c91bde8dc35fb8b0068d",
    globalAdmin:
      "0xdd3d22dba6c38117615a51698136e9867191328a8ef1b065c342d0a887b9be4a",
    quoterIds: {
      cpmm: "0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261",
      omm: "0x67e4835cbe51818ce79af790f25ee7d8dfb03fc1556094ca5531cc399c687444",
      ommV2:
        "0x90e18bdfa7206d5d19df0eed869203812b608e50d07e3a49b9e9044fdedac443",
    },
  },
};

export const STEAMM_SCRIPT_CONFIG = {
  packageId:
    "0x13bfc09cfc1bd922d3aa53fcf7b2cd510727ee65068ce136e2ebd5f3b213fdd2",
  publishedAt:
    "0x0e2199e947bd5bd24b006fcdca1e5b958655398a5f9ac5b2c482dd67deae5504",
};

export const SUILEND_CONFIG = {
  packageId:
    "0xf95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf",
  publishedAt:
    "0x21f544aff826a48e6bd5364498454d8487c4a90f84995604cd5c947c06b596c3",
  config: {
    lendingMarketId:
      "0x84030d26d85eaa7035084a057f2f11f701b7e2e4eda87551becbc7c97505ece1", // Main market
    lendingMarketType:
      "0xf95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf::suilend::MAIN_POOL",
  },
};

export const ORACLE_CONFIG = {
  packageId:
    "0xe84b649199654d18c38e727212f5d8dacfc3cf78d60d0a7fc85fd589f280eb2b",
  publishedAt:
    "0xe84b649199654d18c38e727212f5d8dacfc3cf78d60d0a7fc85fd589f280eb2b",
  config: {
    oracleRegistryId:
      "0x919bba48fddc65e9885433e36ec24278cc80b56bf865f46e9352fa2852d701bc",
  },
};

export const MAINNET_CONFIG: SdkOptions = {
  fullRpcUrl: "https://fullnode.mainnet.sui.io:443",
  packages: {
    suilend: SUILEND_CONFIG,
    steamm: STEAMM_CONFIG,
    steammScript: STEAMM_SCRIPT_CONFIG,
    oracle: ORACLE_CONFIG,
  },
};
