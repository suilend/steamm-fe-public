import BigNumber from "bignumber.js";

export enum PoolType {
  CONSTANT = "constant",
  PYTH_ORACLE = "pythOracle",
  STABLE_SWAP = "stableSwap",
}

export const poolTypeNameMap: Record<PoolType, string> = {
  [PoolType.CONSTANT]: "Constant",
  [PoolType.PYTH_ORACLE]: "Pyth oracle",
  [PoolType.STABLE_SWAP]: "Stable swap",
};

export type Pool = {
  id: string;
  poolGroupId: string;
  assetCoinTypes: [string, string];
  type: PoolType;
  tvlUsd: BigNumber;
  volumeUsd: BigNumber;
  apr: {
    assetCoinTypes: string[];
    percent: BigNumber;
  };
};

export type PoolGroup = {
  id: string;
  assetCoinTypes: [string, string];
  pools: Pool[];
};
