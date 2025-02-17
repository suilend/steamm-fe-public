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

export type ParsedPool = {
  id: string;
  type?: PoolType;

  lpTokenType: string;
  btokenTypes: [string, string];
  coinTypes: [string, string];
  balances: [BigNumber, BigNumber];
  prices: [BigNumber, BigNumber];

  tvlUsd: BigNumber;
  volumeUsd_24h?: BigNumber; // Used on Pools page
  aprPercent_24h?: BigNumber; // Used on Pools and Portfolio pages

  feeTierPercent: BigNumber;
  protocolFeePercent: BigNumber;
};

export type PoolGroup = {
  id: string;
  coinTypes: [string, string];
  pools: ParsedPool[];
};

export type PoolPosition = {
  pool: ParsedPool;
  balanceUsd?: BigNumber;
  // depositedAmountUsd?: BigNumber;
  // isStaked: boolean;
  // claimableRewards: Record<string, BigNumber>;
  // pnl: {
  //   percent?: BigNumber;
  //   amountUsd?: BigNumber;
  // };
};
