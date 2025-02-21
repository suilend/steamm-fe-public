import BigNumber from "bignumber.js";

export type ParsedBank = {
  id: string;
  coinType: string;
  bTokenType: string;

  liquidAmount: BigNumber;
  depositedAmount: BigNumber;
  totalAmount: BigNumber;

  utilizationPercent: BigNumber;
  aprPercent: BigNumber;
};

export enum PoolType {
  CPMM = "cpmm",
  PYTH_ORACLE = "pythOracle",
  STABLE_SWAP = "stableSwap",
}

export const poolTypeNameMap: Record<PoolType, string> = {
  [PoolType.CPMM]: "CPMM",
  [PoolType.PYTH_ORACLE]: "Pyth oracle",
  [PoolType.STABLE_SWAP]: "Stable swap",
};

export type ParsedPool = {
  id: string;
  type?: PoolType;

  lpTokenType: string;
  bTokenTypes: [string, string];
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
