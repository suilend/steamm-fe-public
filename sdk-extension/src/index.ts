export * from "./bank";
export * from "./pool";

export const BTOKEN_URI =
  "https://suilend-assets.s3.us-east-2.amazonaws.com/steamm/STEAMM+bToken.svg";
export const LP_TOKEN_URI =
  "https://suilend-assets.s3.us-east-2.amazonaws.com/steamm/STEAMM+LP+Token.svg";

export interface CoinData {
  coinMeta: string;
  coinType: string;
  btreasury: string;
  bTokenmeta: string;
  btokenType: string;
  bTokenSymbol: string;
}

export interface LpData {
  lpTreasuryId: string;
  lpMetadataId: string;
  lpTokenType: string;
}
