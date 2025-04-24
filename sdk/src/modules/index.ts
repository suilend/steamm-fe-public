import {
  DepositLiquidityArgs,
  QuoteDepositArgs,
  QuoteRedeemArgs,
  QuoteSwapArgs,
  RedeemLiquidityArgs,
  SharePoolArgs,
  SwapArgs,
} from "../base";
import { CreateCpPoolArgs } from "../base/quoters/constantQuoter/args";
import { CreateOraclePoolArgs } from "../base/quoters/oracleQuoter/args";
import { CreateOracleV2PoolArgs } from "../base/quoters/oracleV2Quoter/args";
import { BankInfo, PoolInfo } from "../types";
import { SuiAddressType, SuiTypeName } from "../utils";

export * from "./bankModule";
export * from "./poolModule";
export * from "./routerModule";
export * from "./rpcModule";

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
