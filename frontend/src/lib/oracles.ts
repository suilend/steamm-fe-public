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

export const parseOraclePriceIdentifier = (oracleInfo: OracleInfo) =>
  oracleInfo.oracleType === OracleType.PYTH
    ? typeof oracleInfo.oracleIdentifier === "string"
      ? oracleInfo.oracleIdentifier
      : toHexString(oracleInfo.oracleIdentifier)
    : ""; // TODO: Parse Switchboard price identifier

export const getPythOracleUrl = (symbol: string) =>
  `https://insights.pyth.network/price-feeds/${symbol.replace("/", "%2F")}`;
