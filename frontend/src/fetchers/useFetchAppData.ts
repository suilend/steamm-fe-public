import { normalizeStructTag } from "@mysten/sui/utils";
import { SuiPriceServiceConnection } from "@pythnetwork/pyth-sui-js";
import BigNumber from "bignumber.js";
import useSWR from "swr";

import {
  NORMALIZED_AUSD_COINTYPE,
  NORMALIZED_DEEP_COINTYPE,
  NORMALIZED_SEND_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_USDC_COINTYPE,
  NORMALIZED_sSUI_COINTYPE,
  getCoinMetadataMap,
  isSui,
} from "@suilend/frontend-sui";
import { showErrorToast, useSettingsContext } from "@suilend/frontend-sui-next";
import {
  LENDING_MARKET_ID,
  LENDING_MARKET_TYPE,
  SuilendClient,
  WAD,
} from "@suilend/sdk";
import * as simulate from "@suilend/sdk/utils/simulate";
import { SteammSDK } from "@suilend/steamm-sdk";

import { AppData } from "@/contexts/AppContext";
import { ChartData } from "@/lib/chart";
import { ParsedPool, PoolType } from "@/lib/types";

export default function useFetchAppData(steammClient: SteammSDK) {
  const { suiClient } = useSettingsContext();

  const dataFetcher = async () => {
    // Suilend
    const suilendClient = await SuilendClient.initialize(
      LENDING_MARKET_ID,
      LENDING_MARKET_TYPE,
      suiClient,
    );

    const nowMs = Date.now();
    const nowS = Math.floor(nowMs / 1000);

    const rawReserves = suilendClient.lendingMarket.reserves.filter((r) =>
      [NORMALIZED_SUI_COINTYPE, NORMALIZED_USDC_COINTYPE].includes(
        normalizeStructTag(r.coinType.name),
      ),
    );
    const refreshedRawReserves = await simulate.refreshReservePrice(
      rawReserves.map((r) => simulate.compoundReserveInterest(r, nowS)),
      new SuiPriceServiceConnection("https://hermes.pyth.network"),
    );

    const priceMap = refreshedRawReserves.reduce(
      (acc, r) => {
        const coinType = normalizeStructTag(r.coinType.name);
        const price = new BigNumber(r.price.value.toString()).div(WAD);

        return { ...acc, [coinType]: price };
      },
      {} as Record<string, BigNumber>,
    );

    const suiPrice = priceMap[NORMALIZED_SUI_COINTYPE];
    const usdcPrice = priceMap[NORMALIZED_USDC_COINTYPE];

    // Banks
    const bTokenTypeToCoinTypeMap: Record<string, string> = {};

    const bankList = await steammClient.getBanks();
    for (const bank of Object.values(bankList)) {
      const { coinType, btokenType } = bank;
      bTokenTypeToCoinTypeMap[btokenType] = normalizeStructTag(coinType);
    }

    const lendingMarketIdTypeMap = Object.values(bankList).reduce(
      (acc, bank) => ({
        ...acc,
        [bank.lendingMarketId]: bank.lendingMarketType,
      }),
      {},
    );

    // Pools
    const poolInfos = await steammClient.getPools();

    const poolCoinTypes: string[] = [
      // TEMP
      NORMALIZED_SUI_COINTYPE,
      NORMALIZED_DEEP_COINTYPE,
      NORMALIZED_USDC_COINTYPE,
      NORMALIZED_SEND_COINTYPE,
      NORMALIZED_sSUI_COINTYPE,
      NORMALIZED_AUSD_COINTYPE,
    ];
    for (const poolInfo of poolInfos) {
      const coinTypes = [
        poolInfo.lpTokenType,
        bTokenTypeToCoinTypeMap[poolInfo.coinTypeA],
        bTokenTypeToCoinTypeMap[poolInfo.coinTypeB],
      ];
      poolCoinTypes.push(...coinTypes);
    }
    const uniquePoolCoinTypes = Array.from(new Set(poolCoinTypes));

    const poolCoinMetadataMap = await getCoinMetadataMap(
      suiClient,
      uniquePoolCoinTypes,
    );

    const pools: ParsedPool[] = [];

    for (const poolInfo of poolInfos) {
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
        continue; // Skip pools with test btokens

      const coinTypeA = bTokenTypeToCoinTypeMap[btokenTypeA];
      const coinTypeB = bTokenTypeToCoinTypeMap[btokenTypeB];

      const pool = await steammClient.fullClient.fetchPool(poolInfo.poolId);

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
            : balanceB.div(balanceA).times(priceB);
      } else if (coinTypeB === NORMALIZED_USDC_COINTYPE) {
        priceB = usdcPrice;
        priceA = isSui(coinTypeA)
          ? suiPrice
          : balanceB.div(balanceA).times(priceB);
      } else {
        console.error(
          `Quote asset must be one of SUI, USDC - skipping pool with id: ${id}`,
        );
        continue;
      }

      const tvlUsd = balanceA.times(priceA).plus(balanceB.times(priceB));
      const volumeUsd_24h = undefined;
      const volumeUsd_30d = undefined;
      const feesUsd_24h = undefined;
      const feesUsd_30d = undefined;
      const apr = {
        coinTypes: [coinTypeA], // TEMP
        percent: new BigNumber(2.3), // 24h, TEMP
      };

      const feeTierPercent = new BigNumber(
        pool.poolFeeConfig.feeNumerator.toString(),
      )
        .div(pool.poolFeeConfig.feeDenominator.toString())
        .times(100); // TODO: Replace with poolInfo.swapFeeBps
      const protocolFeePercent = new BigNumber(
        pool.protocolFees.config.feeNumerator.toString(),
      )
        .div(pool.protocolFees.config.feeDenominator.toString())
        .times(feeTierPercent.div(100))
        .times(100);

      pools.push({
        id,
        type,

        lpTokenType: poolInfo.lpTokenType,
        btokenTypes: [btokenTypeA, btokenTypeB],
        coinTypes: [coinTypeA, coinTypeB],
        balances: [balanceA, balanceB],
        prices: [priceA, priceB],

        tvlUsd,
        volumeUsd_24h,
        volumeUsd_30d,
        feesUsd_24h,
        feesUsd_30d,
        apr,

        feeTierPercent,
        protocolFeePercent,
      });
    }

    const featuredCoinTypePairs: [[string, string]] = [
      [NORMALIZED_SUI_COINTYPE, NORMALIZED_USDC_COINTYPE],
    ];

    // TVL (dummy data)
    const historicalTvlUsd_30d: ChartData[] = [];
    for (let i = 0; i < 30; i++) {
      historicalTvlUsd_30d.push({
        timestampS: 1739253600 + i * 24 * 60 * 60,
        ...[
          NORMALIZED_SUI_COINTYPE,
          NORMALIZED_DEEP_COINTYPE,
          NORMALIZED_USDC_COINTYPE,
          NORMALIZED_SEND_COINTYPE,
          NORMALIZED_sSUI_COINTYPE,
          NORMALIZED_AUSD_COINTYPE,
        ].reduce(
          (acc, coinType, index) => ({
            ...acc,
            [coinType]: Math.random() * 1.5 ** index * 1000,
          }),
          {},
        ),
      });
    }

    // Volume (dummy data)
    const volumeUsd_30d = new BigNumber(669152);

    const historicalVolumeUsd_30d: ChartData[] = [];
    for (let i = 0; i < 30; i++) {
      historicalVolumeUsd_30d.push({
        timestampS: 1739253600 + i * 24 * 60 * 60,
        ...[
          NORMALIZED_SUI_COINTYPE,
          NORMALIZED_DEEP_COINTYPE,
          NORMALIZED_USDC_COINTYPE,
          NORMALIZED_SEND_COINTYPE,
          NORMALIZED_sSUI_COINTYPE,
          NORMALIZED_AUSD_COINTYPE,
        ].reduce(
          (acc, coinType) => ({
            ...acc,
            [coinType]: Math.random() * 1000,
          }),
          {},
        ),
      });
    }

    return {
      lendingMarketIdTypeMap,

      pools,
      poolCoinTypes,
      poolCoinMetadataMap,
      featuredCoinTypePairs,

      historicalTvlUsd_30d,
      volumeUsd_30d,
      historicalVolumeUsd_30d,
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
