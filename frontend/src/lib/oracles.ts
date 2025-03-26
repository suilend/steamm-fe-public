import {
  NORMALIZED_DEEP_COINTYPE,
  NORMALIZED_SEND_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_USDC_COINTYPE,
} from "@suilend/frontend-sui";

export enum OracleType {
  PYTH = "pyth",
  SWITCHBOARD = "switchboard",
}

export const ORACLE_INDEX_TYPE_COINTYPE_MAP: Record<
  number,
  { type: OracleType; coinType: string }
> =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? {
        0: { type: OracleType.PYTH, coinType: NORMALIZED_SUI_COINTYPE },
        1: { type: OracleType.PYTH, coinType: NORMALIZED_USDC_COINTYPE },
        2: { type: OracleType.PYTH, coinType: NORMALIZED_SEND_COINTYPE },
        3: { type: OracleType.PYTH, coinType: NORMALIZED_DEEP_COINTYPE },
      }
    : {
        0: { type: OracleType.PYTH, coinType: NORMALIZED_SUI_COINTYPE },
        1: { type: OracleType.PYTH, coinType: NORMALIZED_USDC_COINTYPE },
        2: { type: OracleType.PYTH, coinType: NORMALIZED_SEND_COINTYPE },
        3: { type: OracleType.PYTH, coinType: NORMALIZED_DEEP_COINTYPE },
      };
