import { CoinMetadata } from "@mysten/sui/client";
import { normalizeStructTag } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import useSWR from "swr";

import {
  NORMALIZED_SEND_POINTS_S2_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_USDC_COINTYPE,
  getCoinMetadataMap,
  isSui,
} from "@suilend/frontend-sui";
import { showErrorToast, useSettingsContext } from "@suilend/frontend-sui-next";
import {
  LENDING_MARKET_ID,
  LENDING_MARKET_TYPE,
  SuilendClient,
  initializeSuilend,
  initializeSuilendRewards,
} from "@suilend/sdk";
import { SteammSDK } from "@suilend/steamm-sdk";

import { AppData } from "@/contexts/AppContext";
import { formatPair } from "@/lib/format";
import { ParsedBank, ParsedPool, PoolType } from "@/lib/types";

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
      [NORMALIZED_SEND_POINTS_S2_COINTYPE].filter(
        (coinType) => !Object.keys(coinMetadataMap).includes(coinType),
      ),
    );
    coinMetadataMap = { ...coinMetadataMap, ...pointsCoinMetadataMap };

    // Prices
    const suiPrice = mainMarket_reserveMap[NORMALIZED_SUI_COINTYPE].price;
    const usdcPrice = mainMarket_reserveMap[NORMALIZED_USDC_COINTYPE].price;

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
            .times(mainMarket_reserveMap[coinType]?.cTokenExchangeRate ?? 0) // Fallback for when NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true and Main market (beta) does not have the reserve
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
            const type = poolInfo.quoterType.endsWith("cpmm::CpQuoter")
              ? PoolType.CPMM
              : undefined; // TODO: Add support for other pool types

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

            const balanceA = new BigNumber(pool.balanceA.value.toString()).div(
              10 ** coinMetadataMap[coinTypeA].decimals,
            );
            const balanceB = new BigNumber(pool.balanceB.value.toString()).div(
              10 ** coinMetadataMap[coinTypeB].decimals,
            );
            const balances = [balanceA, balanceB];

            let priceA, priceB;
            if (isSui(coinTypeB)) {
              priceB = suiPrice;
              priceA =
                coinTypeA === NORMALIZED_USDC_COINTYPE
                  ? usdcPrice
                  : !balanceA.eq(0)
                    ? balanceB.div(balanceA).times(priceB)
                    : new BigNumber(0); // Assumes the pool is balanced (only works for CPMM quoter)
            } else if (coinTypeB === NORMALIZED_USDC_COINTYPE) {
              priceB = usdcPrice;
              priceA = isSui(coinTypeA)
                ? suiPrice
                : !balanceA.eq(0)
                  ? balanceB.div(balanceA).times(priceB)
                  : new BigNumber(0); // Assumes the pool is balanced (only works for CPMM quoter)
            } else {
              console.error(
                `Quote asset must be one of SUI, USDC - skipping pool with id: ${id}`,
              );
              return undefined;
            }
            const prices = [priceA, priceB];

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
              type,

              lpTokenType: poolInfo.lpTokenType,
              bTokenTypes,
              coinTypes,
              balances,
              prices,

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
      ) <
        formatPair(
          b.coinTypes.map((coinType) => coinMetadataMap[coinType].symbol),
        )
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
