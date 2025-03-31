import {
  NORMALIZED_DEEP_COINTYPE,
  NORMALIZED_NS_COINTYPE,
  NORMALIZED_SEND_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_USDC_COINTYPE,
  NORMALIZED_WAL_COINTYPE,
  NORMALIZED_sSUI_COINTYPE,
  NORMALIZED_wUSDC_COINTYPE,
} from "@suilend/frontend-sui";
import { toHexString } from "@suilend/sdk";
import { OracleInfo } from "@suilend/steamm-sdk";

export enum OracleType {
  PYTH = "pyth",
  SWITCHBOARD = "switchboard",
}

export const oracleTypeMap: Record<OracleType, string> = {
  [OracleType.PYTH]: "Pyth",
  [OracleType.SWITCHBOARD]: "Switchboard",
};

export const COINTYPE_ORACLE_INDEX_MAP: Record<string, number> =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? {
        [NORMALIZED_SUI_COINTYPE]: 0,
        [NORMALIZED_sSUI_COINTYPE]: 0,
        [NORMALIZED_USDC_COINTYPE]: 1,
        [NORMALIZED_wUSDC_COINTYPE]: 1,
        [NORMALIZED_SEND_COINTYPE]: 2,
        [NORMALIZED_DEEP_COINTYPE]: 3,
        [NORMALIZED_WAL_COINTYPE]: 4,
        [NORMALIZED_NS_COINTYPE]: 5,
      }
    : {
        [NORMALIZED_SUI_COINTYPE]: 0,
        [NORMALIZED_sSUI_COINTYPE]: 0,
        [NORMALIZED_USDC_COINTYPE]: 1,
        [NORMALIZED_wUSDC_COINTYPE]: 1,
        [NORMALIZED_SEND_COINTYPE]: 2,
        [NORMALIZED_DEEP_COINTYPE]: 3,
        [NORMALIZED_WAL_COINTYPE]: 4,
      };

export const parseOraclePriceIdentifier = (oracleInfo: OracleInfo) =>
  oracleInfo.oracleType === OracleType.PYTH
    ? typeof oracleInfo.oracleIdentifier === "string"
      ? oracleInfo.oracleIdentifier
      : toHexString(oracleInfo.oracleIdentifier)
    : ""; // TODO: Parse Switchboard price identifier

export const getPythOracleUrl = (symbol: string) =>
  `https://pyth.network/price-feeds/${symbol.toLowerCase().replace(/\.|\//g, "-")}?range=1W`;
