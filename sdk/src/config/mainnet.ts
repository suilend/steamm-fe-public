import { SdkOptions } from "../sdk";

export const STEAMM_CONFIG = {
  package_id:
    "0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261",
  published_at:
    "0x67e4835cbe51818ce79af790f25ee7d8dfb03fc1556094ca5531cc399c687444",
  config: {
    registryId:
      "0x8584948e8c0a2809ec192ede7e030b0a32bd602e5ca6c91bde8dc35fb8b0068d",
    globalAdmin:
      "0xdd3d22dba6c38117615a51698136e9867191328a8ef1b065c342d0a887b9be4a",
    quoterSourcePkgs: {
      cpmm: "0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261",
      omm: "0x67e4835cbe51818ce79af790f25ee7d8dfb03fc1556094ca5531cc399c687444",
    },
  },
};

export const STEAMM_SCRIPT_CONFIG = {
  package_id:
    "0x13bfc09cfc1bd922d3aa53fcf7b2cd510727ee65068ce136e2ebd5f3b213fdd2",
  published_at:
    "0xaf8a9d331fa0c2362506803825bcb6092f8f7fbe553bad4423724159c5160a77",
};

export const SUILEND_CONFIG = {
  package_id:
    "0x1f54a9a2d71799553197e9ea24557797c6398d6a65f2d4d3818c9304b75d5e21",
  published_at:
    "0x5bb8cb3894945f523736f4f5059b1621056e8093b165ea56b20805d0ef2461a9",
  config: {
    lendingMarketId:
      "0x84030d26d85eaa7035084a057f2f11f701b7e2e4eda87551becbc7c97505ece1", // Main market
    lendingMarketType:
      "0xf95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf::suilend::MAIN_POOL",
  },
};

export const ORACLE_CONFIG = {
  package_id:
    "0xe84b649199654d18c38e727212f5d8dacfc3cf78d60d0a7fc85fd589f280eb2b",
  published_at:
    "0xe84b649199654d18c38e727212f5d8dacfc3cf78d60d0a7fc85fd589f280eb2b",
  config: {
    oracleRegistryId:
      "0x919bba48fddc65e9885433e36ec24278cc80b56bf865f46e9352fa2852d701bc",
  },
};

export const MAINNET_CONFIG: SdkOptions = {
  fullRpcUrl: "https://fullnode.mainnet.sui.io:443",
  suilend_config: SUILEND_CONFIG,
  steamm_config: STEAMM_CONFIG,
  steamm_script_config: STEAMM_SCRIPT_CONFIG,
  oracle_config: ORACLE_CONFIG,
};
