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
import { API_URL } from "@/lib/navigation";
import { fetchPool } from "@/lib/pools";

export default function useFetchAppData(steammClient: SteammSDK) {
  const { suiClient } = useSettingsContext();

  // Data
  const dataFetcher = async () => {
    let coinMetadataMap: Record<string, CoinMetadata> = {};

    // Suilend
    // Suilend - Main market
    const mainMarket_suilendClient = await SuilendClient.initialize(
      process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
        ? BETA_CONFIG.suilend_config.config!.lendingMarketId // Requires NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true
        : MAINNET_CONFIG.suilend_config.config!.lendingMarketId,
      process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
        ? BETA_CONFIG.suilend_config.config!.lendingMarketType // Requires NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true
        : MAINNET_CONFIG.suilend_config.config!.lendingMarketType,
      suiClient,
    );

    const {
      refreshedRawReserves: mainMarket_refreshedRawReserves,
      lendingMarket: mainMarket_lendingMarket,

      reserveMap: mainMarket_reserveMap,

      activeRewardCoinTypes: mainMarket_activeRewardCoinTypes,
      rewardCoinMetadataMap: mainMarket_rewardCoinMetadataMap,
    } = await initializeSuilend(suiClient, mainMarket_suilendClient);
    coinMetadataMap = {
      ...coinMetadataMap,
      ...mainMarket_rewardCoinMetadataMap,
    };

    const { rewardPriceMap: mainMarket_rewardPriceMap } =
      await initializeSuilendRewards(
        mainMarket_reserveMap,
        mainMarket_activeRewardCoinTypes,
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
    const bankObjs: AppData["bankObjs"] = [];
    if (process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true") {
      const bankInfos = Object.values(await steammClient.getBanks());

      for (const bankInfo of bankInfos) {
        const bank = await steammClient.fullClient.fetchBank(bankInfo.bankId);
        const totalFunds = await steammClient.Bank.getTotalFunds(bankInfo);

        bankObjs.push({ bankInfo, bank, totalFunds: +totalFunds.toString() });
      }
    } else {
      const banksRes = await fetch(`${API_URL}/steamm/banks/all`);
      const banksJson: AppData["bankObjs"] = await banksRes.json();
      if ((banksJson as any)?.statusCode === 500)
        throw new Error("Failed to fetch banks");

      bankObjs.push(...banksJson);
    }

    const bankCoinTypes: string[] = [];
    for (const bankObj of bankObjs) {
      bankCoinTypes.push(normalizeStructTag(bankObj.bankInfo.coinType));
    }
    const uniqueBankCoinTypes = Array.from(new Set(bankCoinTypes));

    const bankCoinMetadataMap = await getCoinMetadataMap(
      uniqueBankCoinTypes.filter(
        (coinType) => !Object.keys(coinMetadataMap).includes(coinType),
      ),
    );
    coinMetadataMap = { ...coinMetadataMap, ...bankCoinMetadataMap };

    // Pools
    const poolObjs: AppData["poolObjs"] = [];
    if (process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true") {
      const poolInfos = await steammClient.getPools();

      for (const poolInfo of poolInfos) {
        const pool = await fetchPool(steammClient, poolInfo);
        const redeemQuote = await steammClient.Pool.quoteRedeem({
          lpTokens: pool.lpSupply.value,
          poolInfo,
          bankInfoA: bankObjs.find(
            (bankObj) => bankObj.bankInfo.btokenType === poolInfo.coinTypeA,
          )!.bankInfo,
          bankInfoB: bankObjs.find(
            (bankObj) => bankObj.bankInfo.btokenType === poolInfo.coinTypeB,
          )!.bankInfo,
        });

        poolObjs.push({ poolInfo, pool, redeemQuote });
      }
    } else {
      const poolsRes = await fetch(`${API_URL}/steamm/pools/all`);
      const poolsJson: AppData["poolObjs"] = await poolsRes.json();
      if ((poolsJson as any)?.statusCode === 500)
        throw new Error("Failed to fetch pools");

      poolObjs.push(...poolsJson);
    }

    const poolCoinTypes: string[] = [];
    for (const poolObj of poolObjs) {
      const coinTypes = [
        poolObj.poolInfo.lpTokenType,
        // bTokenTypeCoinTypeMap[poolInfo.coinTypeA], // Already included in bankCoinTypes
        // bTokenTypeCoinTypeMap[poolInfo.coinTypeB], // Already included in bankCoinTypes
      ];
      poolCoinTypes.push(...coinTypes);
    }
    const uniquePoolCoinTypes = Array.from(new Set(poolCoinTypes));

    const poolCoinMetadataMap = await getCoinMetadataMap(
      uniquePoolCoinTypes.filter(
        (coinType) => !Object.keys(coinMetadataMap).includes(coinType),
      ),
    );
    coinMetadataMap = { ...coinMetadataMap, ...poolCoinMetadataMap };

    return {
      mainMarket: {
        suilendClient: mainMarket_suilendClient,

        lendingMarket: mainMarket_lendingMarket,

        refreshedRawReserves: mainMarket_refreshedRawReserves,
        reserveMap: mainMarket_reserveMap,

        rewardPriceMap: mainMarket_rewardPriceMap,
        rewardCoinMetadataMap: mainMarket_rewardCoinMetadataMap,

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

      bankObjs: bankObjs.filter(
        (bankObj) =>
          ![
            "0x02242e71c54b389c5e4001c2635c598469c5900020cc873e21d01a542124b260::zxcv::ZXCV",
            "0x990988b4d1297c9d9bad49a43717bd46b37c6fe5546d789274e94a6bfa8e4632::asdd::ASDD",
            "0xfaccf97bcd174fdd11c9f540085a2dfe5a1aa1d861713b2887271a41c6fe9556::bzbz::BZBZ",
          ].includes(bankObj.bankInfo.coinType), // Filter out test banks
      ),
      poolObjs: poolObjs.filter(
        (poolObj) =>
          ![
            "0x9bac3b28b5960f791e0526b3c5bcea889c2bce56a8dd37fc39a532fe8d49baec",
            "0x56d3919cdbdf22c0a4d60471c045e07fd0ba37d0b8fe2577b22408c17141f692",
            "0x2c76690cd6ef9607212b4e72aa3292bcf74843586ffbef61f781d1afecc19a37",
          ].includes(poolObj.poolInfo.poolId), // Filter out test pools
      ),
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
