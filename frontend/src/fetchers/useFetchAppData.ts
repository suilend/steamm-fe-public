import { normalizeStructTag } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import useSWR from "swr";

import {
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
} from "@suilend/sdk";
import { SteammSDK } from "@suilend/steamm-sdk";

import { AppData } from "@/contexts/AppContext";
import { formatPair } from "@/lib/format";
import { ParsedPool, PoolType } from "@/lib/types";

export default function useFetchAppData(steammClient: SteammSDK) {
  const { suiClient } = useSettingsContext();

  const dataFetcher = async () => {
    // Suilend
    const suilendClient = await SuilendClient.initialize(
      LENDING_MARKET_ID, // Main Market
      LENDING_MARKET_TYPE,
      suiClient,
    ); // Switch to Suilend Beta Main Market by setting NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true (should not need to in practice)

    const {
      lendingMarket,
      coinMetadataMap,

      refreshedRawReserves,
      reserveMap,
      reserveCoinTypes,
      reserveCoinMetadataMap,

      rewardCoinTypes,
      activeRewardCoinTypes,
      rewardCoinMetadataMap,
    } = await initializeSuilend(suiClient, suilendClient);

    const reserveDepositAprPercentMap: Record<string, BigNumber> =
      Object.fromEntries(
        Object.entries(reserveMap).map(([coinType, reserve]) => [
          coinType,
          reserve.depositAprPercent,
        ]),
      );

    // Prices
    const suiPrice = reserveMap[NORMALIZED_SUI_COINTYPE].price;
    const usdcPrice = reserveMap[NORMALIZED_USDC_COINTYPE].price;

    // Banks
    const bTokenTypeCoinTypeMap: Record<string, string> = {};

    const bankInfos = await steammClient.getBanks();
    for (const bankInfo of Object.values(bankInfos)) {
      const { coinType, btokenType } = bankInfo;
      bTokenTypeCoinTypeMap[btokenType] = normalizeStructTag(coinType);

      // const bank = await steammClient.fullClient.fetchBank(bankInfo.bankId);
      // console.log("XXX", bank);
    }

    const lendingMarketIdTypeMap = Object.values(bankInfos).reduce(
      (acc, bankInfo) => ({
        ...acc,
        [bankInfo.lendingMarketId]: bankInfo.lendingMarketType,
      }),
      {},
    );

    // Pools
    const poolInfos = await steammClient.getPools();

    const poolCoinTypes: string[] = [];
    for (const poolInfo of poolInfos) {
      const coinTypes = [
        poolInfo.lpTokenType,
        bTokenTypeCoinTypeMap[poolInfo.coinTypeA],
        bTokenTypeCoinTypeMap[poolInfo.coinTypeB],
      ];
      poolCoinTypes.push(...coinTypes);
    }
    const uniquePoolCoinTypes = Array.from(new Set(poolCoinTypes));

    const poolCoinMetadataMap = await getCoinMetadataMap(
      suiClient,
      uniquePoolCoinTypes,
    );

    const pools: ParsedPool[] = (
      await Promise.all(
        poolInfos.map((poolInfo) =>
          (async () => {
            const id = poolInfo.poolId;
            const type = poolInfo.quoterType.endsWith("cpmm::CpQuoter")
              ? PoolType.CONSTANT
              : undefined; // TODO: Add support for other pool types

            const btokenTypeA = poolInfo.coinTypeA;
            const btokenTypeB = poolInfo.coinTypeB;
            if (
              btokenTypeA.startsWith("0x10e03a93cf1e3d") ||
              btokenTypeB.startsWith("0x10e03a93cf1e3d")
            )
              return undefined; // Skip pools with test btokens

            const coinTypeA = bTokenTypeCoinTypeMap[btokenTypeA];
            const coinTypeB = bTokenTypeCoinTypeMap[btokenTypeB];

            const pool = await steammClient.fullClient.fetchPool(
              poolInfo.poolId,
            );

            const balanceA = new BigNumber(pool.balanceA.value.toString()).div(
              10 ** poolCoinMetadataMap[coinTypeA].decimals,
            );
            const balanceB = new BigNumber(pool.balanceB.value.toString()).div(
              10 ** poolCoinMetadataMap[coinTypeB].decimals,
            );

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

            const tvlUsd = balanceA.times(priceA).plus(balanceB.times(priceB));

            const feeTierPercent = new BigNumber(poolInfo.swapFeeBps).div(100);
            const protocolFeePercent = new BigNumber(
              pool.protocolFees.config.feeNumerator.toString(),
            )
              .div(pool.protocolFees.config.feeDenominator.toString())
              .times(feeTierPercent.div(100))
              .times(100);

            return {
              id,
              type,

              lpTokenType: poolInfo.lpTokenType,
              btokenTypes: [btokenTypeA, btokenTypeB],
              coinTypes: [coinTypeA, coinTypeB],
              balances: [balanceA, balanceB],
              prices: [priceA, priceB],

              tvlUsd,

              feeTierPercent,
              protocolFeePercent,
            };
          })(),
        ),
      )
    ).filter(Boolean) as ParsedPool[];

    const sortedPools = pools.slice().sort((a, b) => {
      return formatPair([
        coinMetadataMap[a.coinTypes[0]].symbol,
        coinMetadataMap[a.coinTypes[1]].symbol,
      ]) <
        formatPair([
          coinMetadataMap[b.coinTypes[0]].symbol,
          coinMetadataMap[b.coinTypes[1]].symbol,
        ])
        ? -1
        : 1; // Sort by pair (ascending)
    });

    const featuredCoinTypePairs: [[string, string]] = [["", ""]];

    return {
      reserveDepositAprPercentMap,

      bTokenTypeCoinTypeMap,
      lendingMarketIdTypeMap,

      pools: sortedPools,
      poolCoinTypes,
      poolCoinMetadataMap,
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
