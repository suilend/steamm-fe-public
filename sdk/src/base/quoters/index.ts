import { CpQuoteSwapArgs, CpSwapArgs } from "./constantQuoter/args";
import { OracleQuoteSwapArgs, OracleSwapArgs } from "./oracleQuoter/args";

export * from "./constantQuoter";
export * from "./oracleQuoter";

export type swapArgs = CpSwapArgs | OracleSwapArgs;
export type quoteSwapArgs = CpQuoteSwapArgs | OracleQuoteSwapArgs;
