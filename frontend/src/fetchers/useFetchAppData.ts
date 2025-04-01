import { CoinMetadata } from "@mysten/sui/client";
import { normalizeStructTag } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import useSWR from "swr";

import {
  NORMALIZED_STEAMM_POINTS_COINTYPE,
  getCoinMetadataMap,
} from "@suilend/frontend-sui";
import { showErrorToast, useSettingsContext } from "@suilend/frontend-sui-next";
import {
  SuilendClient,
  initializeSuilend,
  initializeSuilendRewards,
} from "@suilend/sdk";
import { fetchRegistryLiquidStakingInfoMap } from "@suilend/springsui-sdk";
import { BETA_CONFIG, MAINNET_CONFIG, SteammSDK } from "@suilend/steamm-sdk";

import { AppData } from "@/contexts/AppContext";

export default function useFetchAppData(steammClient: SteammSDK) {
  const { suiClient } = useSettingsContext();

  // Data
  const dataFetcher = async () => {
    let coinMetadataMap: Record<string, CoinMetadata> = {};

    // Suilend
    // Suilend - Main market
    const mainMarket_suilendClient = await SuilendClient.initialize(
      process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
        ? BETA_CONFIG.suilend_config.config!.lendingMarketId // Requires NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true (may not match bank config)
        : MAINNET_CONFIG.suilend_config.config!.lendingMarketId,
      process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
        ? BETA_CONFIG.suilend_config.config!.lendingMarketType // Requires NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true (may not match bank config)
        : MAINNET_CONFIG.suilend_config.config!.lendingMarketType,
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
        ? "0xb1d89cf9082cedce09d3647f0ebda4a8b5db125aff5d312a8bfd7eefa715bd35" // Requires NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true
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
        { ...mainMarket_reserveMap, ...lmMarket_reserveMap }, // Use main market reserve map prices for LM rewards
        lmMarket_activeRewardCoinTypes,
      );

    const pointsCoinMetadataMap = await getCoinMetadataMap(
      suiClient,
      [NORMALIZED_STEAMM_POINTS_COINTYPE].filter(
        (coinType) => !Object.keys(coinMetadataMap).includes(coinType),
      ),
    );
    coinMetadataMap = { ...coinMetadataMap, ...pointsCoinMetadataMap };

    // LSTs
    const LIQUID_STAKING_INFO_MAP =
      await fetchRegistryLiquidStakingInfoMap(suiClient);

    const lstCoinTypes = Object.keys(LIQUID_STAKING_INFO_MAP);

    // Banks
    const bankCoinTypes: string[] = [];

    const bankInfos = Object.values(await steammClient.getBanks());
    for (const bankInfo of bankInfos) {
      bankCoinTypes.push(normalizeStructTag(bankInfo.coinType));
    }
    const uniqueBankCoinTypes = Array.from(new Set(bankCoinTypes));

    const bankCoinMetadataMap = await getCoinMetadataMap(
      suiClient,
      uniqueBankCoinTypes.filter(
        (coinType) => !Object.keys(coinMetadataMap).includes(coinType),
      ),
    );
    coinMetadataMap = { ...coinMetadataMap, ...bankCoinMetadataMap };

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

    return {
      mainMarket: {
        reserveMap: mainMarket_reserveMap,

        depositAprPercentMap: mainMarket_reserveDepositAprPercentMap,
      },
      lmMarket: {
        suilendClient: lmMarket_suilendClient,

        lendingMarket: lmMarket_lendingMarket,

        refreshedRawReserves: lmMarket_refreshedRawReserves,
        reserveMap: lmMarket_reserveMap,

        rewardPriceMap: lmMarket_rewardPriceMap,
        rewardCoinMetadataMap: lmMarket_rewardCoinMetadataMap,
      },

      coinMetadataMap,

      LIQUID_STAKING_INFO_MAP,
      lstCoinTypes,

      bankInfos,
      poolInfos,
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
