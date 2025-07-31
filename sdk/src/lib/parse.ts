import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";

import { BankInfo, OracleInfo, PoolInfo, RedeemQuote } from "..";
import { Bank } from "../_codegen/_generated/steamm/bank/structs";
import { CpQuoter } from "../_codegen/_generated/steamm/cpmm/structs";
import { OracleQuoter } from "../_codegen/_generated/steamm/omm/structs";
import { OracleQuoterV2 } from "../_codegen/_generated/steamm/omm_v2/structs";
import { Pool } from "../_codegen/_generated/steamm/pool/structs";

// Types

export enum QuoterId {
  CPMM = "cpmm",
  V_CPMM = "v_cpmm",
  ORACLE = "oracle",
  ORACLE_V2 = "oracle_v2",
}
export const QUOTER_ID_NAME_MAP: Record<QuoterId, string> = {
  [QuoterId.CPMM]: "CPMM",
  [QuoterId.V_CPMM]: "vCPMM",
  [QuoterId.ORACLE]: "OMMv0.1",
  [QuoterId.ORACLE_V2]: "OMM",
};

export enum OracleType {
  PYTH = "pyth",
  SWITCHBOARD = "switchboard",
}

export type OracleObj = OracleInfo;

export type BankObj = {
  bankInfo: BankInfo;
  bank: Bank<string, string, string>;
  totalFunds: number;
};

export type ParsedBank = {
  id: string;
  bank: Bank<string, string, string>;
  bankInfo: BankInfo;
  coinType: string;
  bTokenType: string;

  fundsAvailable: BigNumber;
  fundsDeployed: BigNumber;
  totalFunds: BigNumber;

  bTokenSupply: BigNumber;
  bTokenExchangeRate: BigNumber;

  utilizationPercent: BigNumber;
  suilendDepositAprPercent: BigNumber;
};

export type PoolObj = {
  poolInfo: PoolInfo;
  pool:
    | Pool<string, string, CpQuoter, string>
    | Pool<string, string, OracleQuoter, string>
    | Pool<string, string, OracleQuoterV2, string>;
  redeemQuote: RedeemQuote | null;
  priceA: string | null;
  priceB: string | null;
  isInitialLpTokenBurned: boolean | null;
  initialLpTokensMinted: string | null;
  timestampS: string | null;
};

export type ParsedPool = {
  id: string;
  timestampS: number | null;
  pool:
    | Pool<string, string, CpQuoter, string>
    | Pool<string, string, OracleQuoter, string>
    | Pool<string, string, OracleQuoterV2, string>;
  poolInfo: PoolInfo;
  quoterId: QuoterId;

  lpTokenType: string;
  bTokenTypes: [string, string];
  coinTypes: [string, string];
  balances: [BigNumber, BigNumber];
  prices: [BigNumber, BigNumber];

  lpSupply: BigNumber;
  isInitialLpTokenBurned: boolean | null;
  initialLpTokensMinted: BigNumber | null;
  tvlUsd: BigNumber;

  feeTierPercent: BigNumber;
  protocolFeePercent: BigNumber;

  suilendDepositAprPercents: [BigNumber, BigNumber];
  suilendWeightedAverageDepositAprPercent: BigNumber;

  //
  volumeUsd_24h?: BigNumber; // Used on Home page
  aprPercent_24h?: BigNumber; // Used on Home and Portfolio pages
};

// Parsers

export const getParsedBank = (
  data: {
    suilend: {
      mainMarket: {
        depositAprPercentMap: Record<string, BigNumber>;
      };
    };
    coinMetadataMap: Record<string, CoinMetadata>;
  },
  bankInfo: BankInfo,
  bank: ParsedBank["bank"],
  totalFundsRaw: number,
): ParsedBank => {
  const { suilend, coinMetadataMap } = data;

  const id = bankInfo.bankId;
  const coinType = bankInfo.coinType;
  const bTokenType = bankInfo.btokenType;

  const totalFunds = new BigNumber(totalFundsRaw.toString()).div(
    10 ** coinMetadataMap[coinType].decimals,
  );

  const fundsAvailable = new BigNumber(
    bank.fundsAvailable.value.toString(),
  ).div(10 ** coinMetadataMap[coinType].decimals);
  const fundsDeployed = totalFunds.minus(fundsAvailable);

  const bTokenSupply = new BigNumber(bank.btokenSupply.value.toString()).div(
    10 ** coinMetadataMap[coinType].decimals,
  );
  const bTokenExchangeRate = totalFunds.div(bTokenSupply);

  const utilizationPercent = totalFunds.gt(0)
    ? fundsDeployed.div(totalFunds).times(100)
    : new BigNumber(0);
  const suilendDepositAprPercent =
    suilend.mainMarket.depositAprPercentMap[coinType] ?? new BigNumber(0);

  return {
    id,
    bank,
    bankInfo,
    coinType,
    bTokenType,

    fundsAvailable,
    fundsDeployed,
    totalFunds,

    bTokenSupply,
    bTokenExchangeRate,

    utilizationPercent,
    suilendDepositAprPercent,
  };
};

export const getParsedPool = (
  data: {
    coinMetadataMap: Record<string, CoinMetadata>;

    // Oracles
    oracleIndexOracleInfoPriceMap: Record<
      number,
      { oracleInfo: OracleInfo; price: BigNumber }
    >;

    // Banks
    bTokenTypeCoinTypeMap: Record<string, string>;
    bankMap: Record<string, ParsedBank>;
  },
  poolObj: PoolObj,
): ParsedPool | undefined => {
  {
    const {
      coinMetadataMap,
      oracleIndexOracleInfoPriceMap,
      bTokenTypeCoinTypeMap,
      bankMap,
    } = data;
    const {
      poolInfo,
      pool,
      redeemQuote,
      priceA: _priceA,
      priceB: _priceB,
      isInitialLpTokenBurned,
      initialLpTokensMinted,
      timestampS,
    } = poolObj;

    const id = poolInfo.poolId;
    const quoterId = poolInfo.quoterType.endsWith("omm::OracleQuoter")
      ? QuoterId.ORACLE
      : poolInfo.quoterType.endsWith("omm_v2::OracleQuoterV2")
        ? QuoterId.ORACLE_V2
        : (pool.quoter as CpQuoter).offset.toString() !== "0"
          ? QuoterId.V_CPMM
          : QuoterId.CPMM;

    const bTokenTypeA = poolInfo.coinTypeA;
    const bTokenTypeB = poolInfo.coinTypeB;
    const bTokenTypes: [string, string] = [bTokenTypeA, bTokenTypeB];

    const coinTypeA = bTokenTypeCoinTypeMap[bTokenTypeA];
    const coinTypeB = bTokenTypeCoinTypeMap[bTokenTypeB];
    const coinTypes: [string, string] = [coinTypeA, coinTypeB];
    if (coinTypes.some((coinType) => coinType === undefined)) return undefined;

    const balanceA =
      redeemQuote === null
        ? new BigNumber(0)
        : new BigNumber(redeemQuote.withdrawA.toString()).div(
            10 ** coinMetadataMap[coinTypes[0]].decimals,
          );
    const balanceB =
      redeemQuote === null
        ? new BigNumber(0)
        : new BigNumber(redeemQuote.withdrawB.toString()).div(
            10 ** coinMetadataMap[coinTypes[1]].decimals,
          );

    const balances: [BigNumber, BigNumber] = [balanceA, balanceB];

    let priceA: BigNumber | null = [
      QuoterId.ORACLE,
      QuoterId.ORACLE_V2,
    ].includes(quoterId)
      ? oracleIndexOracleInfoPriceMap[
          +(pool.quoter as OracleQuoter).oracleIndexA.toString()
        ].price
      : _priceA !== null
        ? new BigNumber(_priceA)
        : null;
    const priceB: BigNumber = [QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(
      quoterId,
    )
      ? oracleIndexOracleInfoPriceMap[
          +(pool.quoter as OracleQuoter).oracleIndexB.toString()
        ].price
      : new BigNumber(_priceB !== null ? _priceB : 10 ** -12);

    if (priceA === null) {
      // CPMM or vCPMM
      priceA = !balanceA.eq(0)
        ? new BigNumber(
            balanceB.plus(
              quoterId === QuoterId.V_CPMM
                ? new BigNumber(
                    (pool.quoter as CpQuoter).offset.toString(),
                  ).div(10 ** coinMetadataMap[coinTypeB].decimals)
                : 0,
            ),
          )
            .div(balanceA)
            .times(priceB) // Assumes the pool is balanced (only true for arb'd CPMM pools)
        : new BigNumber(10 ** -12);
    }

    const prices: [BigNumber, BigNumber] = [priceA, priceB];

    const lpSupply = new BigNumber(pool.lpSupply.value.toString()).div(10 ** 9);
    const tvlUsd = balanceA.times(priceA).plus(balanceB.times(priceB));

    const feeTierPercent = new BigNumber(poolInfo.swapFeeBps).div(100);
    const protocolFeePercent = new BigNumber(
      pool.protocolFees.config.feeNumerator.toString(),
    )
      .div(pool.protocolFees.config.feeDenominator.toString())
      .times(feeTierPercent.div(100))
      .times(100);

    const suilendDepositAprPercents = (
      tvlUsd.gt(0)
        ? coinTypes.map((coinType) => {
            const bank = bankMap[coinType];
            if (!bank) return new BigNumber(0);

            return new BigNumber(
              bank.suilendDepositAprPercent
                .times(bank.utilizationPercent)
                .div(100),
            );
          })
        : [new BigNumber(0), new BigNumber(0)]
    ) as [BigNumber, BigNumber];
    const suilendWeightedAverageDepositAprPercent = tvlUsd.gt(0)
      ? suilendDepositAprPercents
          .reduce(
            (acc, aprPercent, index) =>
              acc.plus(aprPercent.times(prices[index].times(balances[index]))),
            new BigNumber(0),
          )
          .div(tvlUsd)
      : new BigNumber(0);

    return {
      id,
      timestampS: timestampS === null ? null : +timestampS,
      pool,
      poolInfo,
      quoterId,

      lpTokenType: poolInfo.lpTokenType,
      bTokenTypes,
      coinTypes,
      balances,
      prices,

      lpSupply,
      isInitialLpTokenBurned,
      initialLpTokensMinted:
        initialLpTokensMinted === null || initialLpTokensMinted === ""
          ? null
          : new BigNumber(initialLpTokensMinted).div(10 ** 9),
      tvlUsd,

      feeTierPercent,
      protocolFeePercent,

      suilendDepositAprPercents,
      suilendWeightedAverageDepositAprPercent,
    };
  }
};
