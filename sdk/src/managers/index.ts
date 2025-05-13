import {
  DepositLiquidityArgs,
  QuoteDepositArgs,
  QuoteRedeemArgs,
  QuoteSwapArgs,
  RedeemLiquidityArgs,
  SharePoolArgs,
  SwapArgs,
} from "../abis";
import { CreateCpPoolArgs } from "../abis/quoters/constantProduct/args";
import { CreateOraclePoolArgs } from "../abis/quoters/oracleV1/args";
import { CreateOracleV2PoolArgs } from "../abis/quoters/oracleV2/args";
import { SteammSDK } from "../sdk";
import { BankInfo, PoolInfo } from "../types";
import { SuiAddressType, SuiTypeName } from "../utils";

export * from "./bank";
export * from "./pool";
export * from "./router";
export * from "./client";

export interface IManager {
  readonly sdk: SteammSDK;
}

export type DepositLiquidityParams = DepositLiquidityArgs &
  (
    | {
        pool: SuiAddressType;
        coinTypeA: SuiTypeName;
        coinTypeB: SuiTypeName;
      }
    | {
        poolInfo: PoolInfo;
        bankInfoA: BankInfo;
        bankInfoB: BankInfo;
      }
  );

export type RedeemLiquidityParams = RedeemLiquidityArgs &
  (
    | {
        pool: SuiAddressType;
        coinTypeA: SuiTypeName;
        coinTypeB: SuiTypeName;
      }
    | {
        poolInfo: PoolInfo;
        bankInfoA: BankInfo;
        bankInfoB: BankInfo;
      }
  );

export type SwapParams = SwapArgs &
  (
    | {
        pool: SuiAddressType;
        coinTypeA: SuiTypeName;
        coinTypeB: SuiTypeName;
      }
    | {
        poolInfo: PoolInfo;
        bankInfoA: BankInfo;
        bankInfoB: BankInfo;
      }
  );

export type QuoteSwapParams = QuoteSwapArgs &
  (
    | { pool: SuiAddressType }
    | {
        poolInfo: PoolInfo;
        bankInfoA: BankInfo;
        bankInfoB: BankInfo;
      }
  );

export type QuoteDepositParams = QuoteDepositArgs &
  (
    | { pool: SuiAddressType }
    | {
        poolInfo: PoolInfo;
        bankInfoA: BankInfo;
        bankInfoB: BankInfo;
      }
  );

export type QuoteRedeemParams = QuoteRedeemArgs &
  (
    | { pool: SuiAddressType }
    | {
        poolInfo: PoolInfo;
        bankInfoA: BankInfo;
        bankInfoB: BankInfo;
      }
  );

export type CreateCpPoolParams = Omit<CreateCpPoolArgs, "registry">;
export type CreateOraclePoolParams = Omit<
  CreateOraclePoolArgs,
  "registry" | "oracleRegistry" | "lendingMarket" | "lendingMarketType"
>;
export type CreateOracleV2PoolParams = Omit<
  CreateOracleV2PoolArgs,
  "registry" | "oracleRegistry" | "lendingMarket" | "lendingMarketType"
>;

export type CreatePoolParams =
  | CreateCpPoolParams
  | CreateOraclePoolParams
  | CreateOracleV2PoolParams;

export type SharePoolParams = SharePoolArgs & {
  type: "ConstantProduct" | "Oracle" | "OracleV2";
};
