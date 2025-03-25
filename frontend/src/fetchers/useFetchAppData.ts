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
  LENDING_MARKET_ID,
  LENDING_MARKET_TYPE,
  SuilendClient,
  initializeSuilend,
  initializeSuilendRewards,
} from "@suilend/sdk";
import { LiquidStakingObjectInfo } from "@suilend/springsui-sdk";
import { SteammSDK } from "@suilend/steamm-sdk";

import { AppData } from "@/contexts/AppContext";
import { SPRINGSUI_ASSETS_URL } from "@/lib/constants";

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

    // LSTs
    let LIQUID_STAKING_INFO_MAP: Record<string, LiquidStakingObjectInfo>;
    try {
      LIQUID_STAKING_INFO_MAP = await (
        await fetch(
          `${SPRINGSUI_ASSETS_URL}/liquid-staking-info-map.json?timestamp=${Date.now()}`,
        )
      ).json();
    } catch (err) {
      LIQUID_STAKING_INFO_MAP = {};
    }

    const lstCoinTypes = Object.values(LIQUID_STAKING_INFO_MAP).map(
      (LIQUID_STAKING_INFO) => LIQUID_STAKING_INFO.type,
    );

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
