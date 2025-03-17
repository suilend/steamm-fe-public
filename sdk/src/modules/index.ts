import {
  DepositLiquidityArgs,
  QuoteDepositArgs,
  QuoteRedeemArgs,
  QuoteSwapArgs,
  RedeemLiquidityArgs,
  SwapArgs,
} from "../base";
import { CreateCpPoolArgs } from "../base/quoters/constantQuoter/args";
import { CreateOraclePoolArgs } from "../base/quoters/oracleQuoter/args";
import { SuiAddressType, SuiTypeName } from "../utils";

export * from "./bankModule";
export * from "./poolModule";
export * from "./routerModule";
export * from "./rpcModule";

export type DepositLiquidityParams = DepositLiquidityArgs & {
  pool: SuiAddressType;
  coinTypeA: SuiTypeName;
  coinTypeB: SuiTypeName;
};

export type RedeemLiquidityParams = RedeemLiquidityArgs & {
  pool: SuiAddressType;
  coinTypeA: SuiTypeName;
  coinTypeB: SuiTypeName;
};

export type SwapParams = SwapArgs & {
  pool: SuiAddressType;
  coinTypeA: SuiTypeName;
  coinTypeB: SuiTypeName;
};

export type QuoteSwapParams = QuoteSwapArgs & { pool: SuiAddressType };
export type QuoteDepositParams = QuoteDepositArgs & { pool: SuiAddressType };
export type QuoteRedeemParams = QuoteRedeemArgs & { pool: SuiAddressType };

export type CreateCpPoolParams = Omit<CreateCpPoolArgs, "registry">;
export type CreateOraclePoolParams = Omit<
  CreateOraclePoolArgs,
  "registry" | "oracleRegistry" | "lendingMarket" | "lendingMarketType"
>;

export type CreatePoolParams = CreateCpPoolParams | CreateOraclePoolParams;
