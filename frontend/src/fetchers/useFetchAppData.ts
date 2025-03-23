import { CoinMetadata } from "@mysten/sui/client";
import { normalizeStructTag } from "@mysten/sui/utils";
import { PriceFeed, SuiPriceServiceConnection } from "@pythnetwork/pyth-sui-js";
import BigNumber from "bignumber.js";
import useSWR from "swr";

import {
  NORMALIZED_STEAMM_POINTS_COINTYPE,
  getCoinMetadataMap,
} from "@suilend/frontend-sui";
import { showErrorToast, useSettingsContext } from "@suilend/frontend-sui-next";
import {
  LENDING_MARKET_ID,
  LENDING_MARKET_TYPE,
  SuilendClient,
  initializeSuilend,
  initializeSuilendRewards,
  toHexString,
} from "@suilend/sdk";
import { SteammSDK } from "@suilend/steamm-sdk";

import { AppData } from "@/contexts/AppContext";
import { formatPair } from "@/lib/format";
import { COINTYPE_ORACLE_INDEX_MAP } from "@/lib/oracles";
import { ParsedBank, ParsedPool, QuoterId } from "@/lib/types";

export default function useFetchAppData(steammClient: SteammSDK) {
  const { suiClient } = useSettingsContext();

  // Data
  const dataFetcher = async () => {
    let coinMetadataMap: Record<string, CoinMetadata> = {};

    // Suilend
    // Suilend - Main market
    const mainMarket_suilendClient = await SuilendClient.initialize(
      LENDING_MARKET_ID, // Main market / Main market (beta) when NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true
      LENDING_MARKET_TYPE,
      suiClient,
    );

    const { reserveMap: mainMarket_reserveMap } = await initializeSuilend(
      suiClient,
      mainMarket_suilendClient,
    );

    const mainMarket_reserveDepositAprPercentMap: Record<string, BigNumber> =
      Object.fromEntries(
        Object.entries(mainMarket_reserveMap).map(([coinType, reserve]) => [
          coinType,
          reserve.depositAprPercent,
        ]),
      );

    // Suilend - LM market
    const lmMarket_suilendClient = await SuilendClient.initialize(
      process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
        ? "0xb1d89cf9082cedce09d3647f0ebda4a8b5db125aff5d312a8bfd7eefa715bd35"
        : "0xc1888ec1b81a414e427a44829310508352aec38252ee0daa9f8b181b6947de9f",
      process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
        ? "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP"
        : "0x0a071f4976abae1a7f722199cf0bfcbe695ef9408a878e7d12a7ca87b7e582a6::lp_rewards::LP_REWARDS",
      suiClient,
    );

    const {
      lendingMarket: lmMarket_lendingMarket,

      refreshedRawReserves: lmMarket_refreshedRawReserves,
      reserveMap: lmMarket_reserveMap,

      activeRewardCoinTypes: lmMarket_activeRewardCoinTypes,
      rewardCoinMetadataMap: lmMarket_rewardCoinMetadataMap,
    } = await initializeSuilend(suiClient, lmMarket_suilendClient);
    coinMetadataMap = { ...coinMetadataMap, ...lmMarket_rewardCoinMetadataMap };

    const { rewardPriceMap: lmMarket_rewardPriceMap } =
      await initializeSuilendRewards(
        lmMarket_reserveMap,
        lmMarket_activeRewardCoinTypes,
      );

    const pointsCoinMetadataMap = await getCoinMetadataMap(
      suiClient,
      [NORMALIZED_STEAMM_POINTS_COINTYPE].filter(
        (coinType) => !Object.keys(coinMetadataMap).includes(coinType),
      ),
    );
    coinMetadataMap = { ...coinMetadataMap, ...pointsCoinMetadataMap };

    // Oracles
    const oracles: any[] = []; // await steammClient.getOracles();

    const pythOracles = oracles.filter(
      (oracle) => oracle.oracleType === "pyth",
    );
    const switchboardOracles = oracles.filter(
      (oracle) => oracle.oracleType === "switchboard",
    );

    // Oracles - Pyth
    const pythConnection = new SuiPriceServiceConnection(
      "https://hermes.pyth.network",
    );

    const pythPriceIdentifiers = pythOracles.map((oracle) =>
      typeof oracle.oracleIdentifier === "string"
        ? oracle.oracleIdentifier
        : toHexString(oracle.oracleIdentifier),
    );

    const pythPriceFeeds: PriceFeed[] =
      (await pythConnection.getLatestPriceFeeds(pythPriceIdentifiers)) ?? [];

    const coinTypePythPriceMap: Record<string, BigNumber> = Object.fromEntries(
      Object.keys(COINTYPE_ORACLE_INDEX_MAP).map((coinType, index) => [
        coinType,
        new BigNumber(
          pythPriceFeeds[index].getPriceUnchecked().getPriceAsNumberUnchecked(),
        ),
      ]),
    );

    // Oracles - Switchboard
    const coinTypeSwitchboardPriceMap: Record<string, BigNumber> = {};

    // Banks
    const bankCoinTypes: string[] = [];
    const bTokenTypeCoinTypeMap: Record<string, string> = {};

    const bankInfos = await steammClient.getBanks();
    for (const bankInfo of Object.values(bankInfos)) {
      bankCoinTypes.push(normalizeStructTag(bankInfo.coinType));
      bTokenTypeCoinTypeMap[bankInfo.btokenType] = normalizeStructTag(
        bankInfo.coinType,
      );
    }
    const uniqueBankCoinTypes = Array.from(new Set(bankCoinTypes));

    const bankCoinMetadataMap = await getCoinMetadataMap(
      suiClient,
      uniqueBankCoinTypes.filter(
        (coinType) => !Object.keys(coinMetadataMap).includes(coinType),
      ),
    );
    coinMetadataMap = { ...coinMetadataMap, ...bankCoinMetadataMap };

    const banks: ParsedBank[] = await Promise.all(
      Object.values(bankInfos).map((bankInfo) =>
        (async () => {
          const id = bankInfo.bankId;
          const coinType = bankInfo.coinType;
          const bTokenType = bankInfo.btokenType;

          const bank = await steammClient.fullClient.fetchBank(id);

          const liquidAmount = new BigNumber(
            bank.fundsAvailable.value.toString(),
          ).div(10 ** coinMetadataMap[coinType].decimals);
          const depositedAmount = new BigNumber(
            bank.lending ? bank.lending.ctokens.toString() : 0,
          )
            .times(mainMarket_reserveMap[coinType]?.cTokenExchangeRate ?? 0) // Fallback for when NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true and Main market  stablecoin
            .div(10 ** coinMetadataMap[coinType].decimals);
          const totalAmount = liquidAmount.plus(depositedAmount);

          const utilizationPercent = totalAmount.gt(0)
            ? depositedAmount.div(totalAmount).times(100)
            : new BigNumber(0);
          const suilendDepositAprPercent =
            mainMarket_reserveDepositAprPercentMap[coinType] ??
            new BigNumber(0);

          return {
            id,
            bank,
            bankInfo,
            coinType,
            bTokenType,

            liquidAmount,
            depositedAmount,
            totalAmount,

            utilizationPercent,
            suilendDepositAprPercent,
          };
        })(),
      ),
    );
    const bankMap = Object.fromEntries(
      banks.map((bank) => [bank.coinType, bank]),
    );

    // Pools
    const poolCoinTypes: string[] = [];

    const poolInfos = await steammClient.getPools();
    for (const poolInfo of poolInfos) {
      const coinTypes = [
        poolInfo.lpTokenType,
        // bTokenTypeCoinTypeMap[poolInfo.coinTypeA], // Already included in bankCoinTypes
        // bTokenTypeCoinTypeMap[poolInfo.coinTypeB], // Already included in bankCoinTypes
      ];
      poolCoinTypes.push(...coinTypes);
    }
    const uniquePoolCoinTypes = Array.from(new Set(poolCoinTypes));

    const poolCoinMetadataMap = await getCoinMetadataMap(
      suiClient,
      uniquePoolCoinTypes.filter(
        (coinType) => !Object.keys(coinMetadataMap).includes(coinType),
      ),
    );
    coinMetadataMap = { ...coinMetadataMap, ...poolCoinMetadataMap };

    const pools: ParsedPool[] = (
      await Promise.all(
        poolInfos.map((poolInfo) =>
          (async () => {
            const id = poolInfo.poolId;
            const quoterId = poolInfo.quoterType.endsWith("cpmm::CpQuoter")
              ? QuoterId.CPMM
              : poolInfo.quoterType.endsWith("omm::OracleQuoter")
                ? QuoterId.ORACLE
                : QuoterId.CPMM; // Should never need to use the fallback

            const bTokenTypeA = poolInfo.coinTypeA;
            const bTokenTypeB = poolInfo.coinTypeB;
            const bTokenTypes = [bTokenTypeA, bTokenTypeB];
            if (
              bTokenTypeA.startsWith("0x10e03a93cf1e3d") ||
              bTokenTypeB.startsWith("0x10e03a93cf1e3d")
            )
              return undefined; // Skip pools with test bTokens

            const coinTypeA = bTokenTypeCoinTypeMap[bTokenTypeA];
            const coinTypeB = bTokenTypeCoinTypeMap[bTokenTypeB];
            const coinTypes = [coinTypeA, coinTypeB];

            const pool = await steammClient.fullClient.fetchPool(id);

            const redeemQuote = await steammClient.Pool.quoteRedeem({
              lpTokens: pool.lpSupply.value,
              poolInfo,
              bankInfoA: bankMap[coinTypes[0]].bankInfo,
              bankInfoB: bankMap[coinTypes[1]].bankInfo,
            });

            const withdrawA = new BigNumber(
              redeemQuote.withdrawA.toString(),
            ).div(10 ** coinMetadataMap[coinTypes[0]].decimals);
            const withdrawB = new BigNumber(
              redeemQuote.withdrawB.toString(),
            ).div(10 ** coinMetadataMap[coinTypes[1]].decimals);

            let balanceA = new BigNumber(pool.balanceA.value.toString()).div(
              10 ** coinMetadataMap[coinTypeA].decimals,
            );
            let balanceB = new BigNumber(pool.balanceB.value.toString()).div(
              10 ** coinMetadataMap[coinTypeB].decimals,
            );
            balanceA = balanceA.times(withdrawA.div(balanceA));
            balanceB = balanceB.times(withdrawB.div(balanceB));

            const balances = [balanceA, balanceB];

            let priceA =
              coinTypePythPriceMap[coinTypeA] ??
              coinTypeSwitchboardPriceMap[coinTypeA] ??
              mainMarket_reserveMap[coinTypeA]?.price ??
              undefined;
            let priceB =
              coinTypePythPriceMap[coinTypeB] ??
              coinTypeSwitchboardPriceMap[coinTypeB] ??
              mainMarket_reserveMap[coinTypeB]?.price ??
              undefined;

            if (priceA === undefined && priceB === undefined) {
              console.error(
                `Skipping pool with id ${id}, quoterId ${quoterId} - missing prices for both assets (no Pyth price feed, no Switchboard price feed, and no Suilend main market reserve) for coinType(s) ${coinTypes.join(", ")}`,
              );
              return;
            } else if (priceA === undefined) {
              console.warn(
                `Missing price for coinTypeA ${coinTypeA}, using balance ratio to calculate price (pool with id ${id}, quoterId ${quoterId})`,
              );
              priceA = !balanceA.eq(0)
                ? balanceB.div(balanceA).times(priceB)
                : new BigNumber(0); // Assumes the pool is balanced (only true for arb'd CPMM quoter)
            } else if (priceB === undefined) {
              console.warn(
                `Missing price for coinTypeB ${coinTypeB}, using balance ratio to calculate price (pool with id ${id}, quoterId ${quoterId})`,
              );
              priceB = !balanceB.eq(0)
                ? balanceA.div(balanceB).times(priceA)
                : new BigNumber(0); // Assumes the pool is balanced (only true for arb'd CPMM quoter)
            }
            const prices = [priceA, priceB];

            const lpSupply = new BigNumber(pool.lpSupply.value.toString()).div(
              10 ** 9,
            );
            const tvlUsd = balanceA.times(priceA).plus(balanceB.times(priceB));

            const feeTierPercent = new BigNumber(poolInfo.swapFeeBps).div(100);
            const protocolFeePercent = new BigNumber(
              pool.protocolFees.config.feeNumerator.toString(),
            )
              .div(pool.protocolFees.config.feeDenominator.toString())
              .times(feeTierPercent.div(100))
              .times(100);

            const suilendWeightedAverageDepositAprPercent = tvlUsd.gt(0)
              ? coinTypes
                  .reduce((acc, coinType, index) => {
                    const bank = bankMap[coinType];
                    if (!bank) return acc;

                    return acc.plus(
                      new BigNumber(
                        bank.suilendDepositAprPercent
                          .times(bank.utilizationPercent)
                          .div(100),
                      ).times(prices[index].times(balances[index])),
                    );
                  }, new BigNumber(0))
                  .div(tvlUsd)
              : new BigNumber(0);

            return {
              id,
              pool,
              poolInfo,
              quoterId,

              lpTokenType: poolInfo.lpTokenType,
              bTokenTypes,
              coinTypes,
              balances,
              prices,

              lpSupply,
              tvlUsd,

              feeTierPercent,
              protocolFeePercent,

              suilendWeightedAverageDepositAprPercent,
            };
          })(),
        ),
      )
    ).filter(Boolean) as ParsedPool[];

    const sortedPools = pools.slice().sort((a, b) => {
      return formatPair(
        a.coinTypes.map((coinType) => coinMetadataMap[coinType].symbol),
      ).toLowerCase() <
        formatPair(
          b.coinTypes.map((coinType) => coinMetadataMap[coinType].symbol),
        ).toLowerCase()
        ? -1
        : 1; // Sort by pair (ascending)
    });

    const featuredCoinTypePairs: [[string, string]] = [["", ""]];

    return {
      lm: {
        suilendClient: lmMarket_suilendClient,

        lendingMarket: lmMarket_lendingMarket,

        refreshedRawReserves: lmMarket_refreshedRawReserves,
        reserveMap: lmMarket_reserveMap,

        rewardPriceMap: lmMarket_rewardPriceMap,
        rewardCoinMetadataMap: lmMarket_rewardCoinMetadataMap,
      },

      coinMetadataMap,
      bTokenTypeCoinTypeMap,

      coinTypePythPriceMap,
      coinTypeSwitchboardPriceMap,

      banks,
      bankMap,
      bankCoinTypes,

      pools: sortedPools,
      poolCoinTypes,

      featuredCoinTypePairs,
    };
  };

  const { data, mutate } = useSWR<AppData>("appData", dataFetcher, {
    refreshInterval: 30 * 1000,
    onSuccess: (data) => {
      console.log("Refreshed app data", data);
    },
    onError: (err) => {
      showErrorToast("Failed to refresh app data", err);
      console.error(err);
    },
  });

  return { data, mutateData: mutate };
}
