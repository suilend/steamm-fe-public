import { CoinMetadata } from "@mysten/sui/client";
import { normalizeStructTag } from "@mysten/sui/utils";
import { SuiPriceServiceConnection } from "@pythnetwork/pyth-sui-js";
import BigNumber from "bignumber.js";
import useSWR, { useSWRConfig } from "swr";

import {
  NORMALIZED_STEAMM_POINTS_COINTYPE,
  getCoinMetadataMap,
} from "@suilend/frontend-sui";
import { showErrorToast, useSettingsContext } from "@suilend/frontend-sui-next";
import {
  SuilendClient,
  formatRewards,
  initializeSuilend,
  initializeSuilendRewards,
  toHexString,
} from "@suilend/sdk";
import {
  BETA_CONFIG,
  BankInfo,
  MAINNET_CONFIG,
  OracleInfo,
  ParsedBank,
  ParsedPool,
  PoolInfo,
  RedeemQuote,
  SteammSDK,
  getParsedBank,
  getParsedPool,
} from "@suilend/steamm-sdk";
import { Bank } from "@suilend/steamm-sdk/_codegen/_generated/steamm/bank/structs";
import { CpQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/cpmm/structs";
import { OracleQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm/structs";
import { OracleQuoterV2 } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm_v2/structs";
import { Pool } from "@suilend/steamm-sdk/_codegen/_generated/steamm/pool/structs";

import { AppData } from "@/contexts/AppContext";
import { ASSETS_URL } from "@/lib/constants";
import { formatPair } from "@/lib/format";
import { normalizeRewards } from "@/lib/liquidityMining";
import { API_URL } from "@/lib/navigation";
import { OracleType } from "@/lib/oracles";
import { fetchPool } from "@/lib/pools";

const TEST_BANK_COIN_TYPES: string[] = [];
const TEST_POOL_IDS: string[] = [
  "0x933a0929120061c9922b404f2425d2c2de7fcf059547d2dcd55759c7fda79063",
];

type BankObj = {
  bankInfo: BankInfo;
  bank: Bank<string, string, string>;
  totalFunds: number;
};

type PoolObj = {
  poolInfo: PoolInfo;
  pool:
    | Pool<string, string, CpQuoter, string>
    | Pool<string, string, OracleQuoter, string>
    | Pool<string, string, OracleQuoterV2, string>;
  redeemQuote: RedeemQuote | null;
};

export default function useFetchAppData(steammClient: SteammSDK) {
  const { suiClient } = useSettingsContext();

  const { cache } = useSWRConfig();

  // Data
  const dataFetcher = async () => {
    const [
      suilend,
      lstAprPercentMap,
      {
        oracleIndexOracleInfoPriceMap,
        COINTYPE_ORACLE_INDEX_MAP,
        coinTypeOracleInfoPriceMap,
        bankObjs,
        poolObjs,
      },
    ] = await Promise.all([
      // Suilend
      (async () => {
        // Suilend - Main market
        const mainMarket_suilendClient = await SuilendClient.initialize(
          process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
            ? BETA_CONFIG.packages.suilend.config!.lendingMarketId // Requires NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true
            : MAINNET_CONFIG.packages.suilend.config!.lendingMarketId,
          process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
            ? BETA_CONFIG.packages.suilend.config!.lendingMarketType // Requires NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true
            : MAINNET_CONFIG.packages.suilend.config!.lendingMarketType,
          suiClient,
        );

        const {
          lendingMarket: mainMarket_lendingMarket,

          refreshedRawReserves: mainMarket_refreshedRawReserves,
          reserveMap: mainMarket_reserveMap,

          activeRewardCoinTypes: mainMarket_activeRewardCoinTypes,
          rewardCoinMetadataMap: mainMarket_rewardCoinMetadataMap,
        } = await initializeSuilend(suiClient, mainMarket_suilendClient);

        const { rewardPriceMap: mainMarket_rewardPriceMap } =
          await initializeSuilendRewards(
            mainMarket_reserveMap,
            mainMarket_activeRewardCoinTypes,
          );

        const mainMarket_reserveDepositAprPercentMap: Record<
          string,
          BigNumber
        > = Object.fromEntries(
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

        const { rewardPriceMap: lmMarket_rewardPriceMap } =
          await initializeSuilendRewards(
            { ...mainMarket_reserveMap, ...lmMarket_reserveMap }, // Use main market reserve map prices for LM rewards
            lmMarket_activeRewardCoinTypes,
          );

        return {
          mainMarket: {
            suilendClient: mainMarket_suilendClient,

            lendingMarket: mainMarket_lendingMarket,

            refreshedRawReserves: mainMarket_refreshedRawReserves,
            reserveMap: mainMarket_reserveMap,

            rewardCoinMetadataMap: mainMarket_rewardCoinMetadataMap,
            rewardPriceMap: mainMarket_rewardPriceMap,

            depositAprPercentMap: mainMarket_reserveDepositAprPercentMap,
          },
          lmMarket: {
            suilendClient: lmMarket_suilendClient,

            lendingMarket: lmMarket_lendingMarket,

            refreshedRawReserves: lmMarket_refreshedRawReserves,
            reserveMap: lmMarket_reserveMap,

            rewardCoinMetadataMap: lmMarket_rewardCoinMetadataMap,
            rewardPriceMap: lmMarket_rewardPriceMap,
          },
        };
      })(),

      // LSTs (won't throw on error)
      (async () => {
        try {
          const lstInfoRes = await fetch(`${API_URL}/springsui/lst-info`);
          const lstInfoJson: Record<
            string,
            { LIQUID_STAKING_INFO: any; liquidStakingInfo: any; apy: string }
          > = await lstInfoRes.json();
          if ((lstInfoRes as any)?.statusCode === 500)
            throw new Error("Failed to fetch SpringSui LST data");

          return Object.fromEntries(
            Object.entries(lstInfoJson).map(([coinType, lstData]) => [
              coinType,
              new BigNumber(lstData.apy),
            ]),
          ) as AppData["lstAprPercentMap"];
        } catch (err) {
          console.error(err);
          return {} as AppData["lstAprPercentMap"];
        }
      })(),

      // Oracles, Banks, and Pools
      (async () => {
        // Oracles and Banks
        const [
          {
            oracleIndexOracleInfoPriceMap,
            COINTYPE_ORACLE_INDEX_MAP,
            coinTypeOracleInfoPriceMap,
          },
          bankObjs,
        ] = await Promise.all([
          // Oracles
          (async () => {
            const [oracleIndexOracleInfoPriceMap, COINTYPE_ORACLE_INDEX_MAP] =
              await Promise.all([
                // OracleInfos
                (async () => {
                  const pythConnection = new SuiPriceServiceConnection(
                    "https://hermes.pyth.network",
                  );

                  const oracleInfos = await steammClient.fetchOracleData();

                  const oracleIndexOracleInfoPriceEntries: [
                    number,
                    { oracleInfo: OracleInfo; price: BigNumber },
                  ][] = await Promise.all(
                    oracleInfos.map((oracleInfo, index) =>
                      (async () => {
                        const priceIdentifier =
                          oracleInfo.oracleType === OracleType.PYTH
                            ? typeof oracleInfo.oracleIdentifier === "string"
                              ? oracleInfo.oracleIdentifier
                              : toHexString(oracleInfo.oracleIdentifier)
                            : ""; // TODO: Parse Switchboard price identifier

                        if (oracleInfo.oracleType === OracleType.PYTH) {
                          const pythPriceFeeds =
                            (await pythConnection.getLatestPriceFeeds([
                              priceIdentifier,
                            ])) ?? [];

                          return [
                            +index,
                            {
                              oracleInfo,
                              price: new BigNumber(
                                pythPriceFeeds[0]
                                  .getPriceUnchecked()
                                  .getPriceAsNumberUnchecked(),
                              ),
                            },
                          ];
                        } else if (
                          oracleInfo.oracleType === OracleType.SWITCHBOARD
                        ) {
                          return [
                            +index,
                            {
                              oracleInfo,
                              price: new BigNumber(0.000001), // TODO: Fetch Switchboard price
                            },
                          ];
                        } else {
                          throw new Error(
                            `Unknown oracle type: ${oracleInfo.oracleType}`,
                          );
                        }
                      })(),
                    ),
                  );

                  return Object.fromEntries(oracleIndexOracleInfoPriceEntries);
                })(),

                // COINTYPE_ORACLE_INDEX_MAP
                (async () => {
                  const COINTYPE_ORACLE_INDEX_MAP: Record<string, number> =
                    await (
                      await fetch(
                        `${ASSETS_URL}/cointype-oracle-index-map.json?timestamp=${Date.now()}`,
                      )
                    ).json();

                  return COINTYPE_ORACLE_INDEX_MAP;
                })(),
              ]);

            const coinTypeOracleInfoPriceMap: Record<
              string,
              { oracleInfo: OracleInfo; price: BigNumber }
            > = Object.entries(COINTYPE_ORACLE_INDEX_MAP).reduce(
              (acc, [coinType, oracleIndex]) => ({
                ...acc,
                [coinType]: oracleIndexOracleInfoPriceMap[oracleIndex],
              }),
              {} as Record<
                string,
                { oracleInfo: OracleInfo; price: BigNumber }
              >,
            );

            return {
              oracleIndexOracleInfoPriceMap,
              COINTYPE_ORACLE_INDEX_MAP,
              coinTypeOracleInfoPriceMap,
            };
          })(),

          // Banks
          (async () => {
            const bankObjs: BankObj[] = [];
            if (process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true") {
              const bankInfos = Object.values(
                await steammClient.fetchBankData(),
              );

              for (const bankInfo of bankInfos) {
                if (TEST_BANK_COIN_TYPES.includes(bankInfo.coinType)) continue; // Filter out test banks

                const bank = await steammClient.fullClient.fetchBank(
                  bankInfo.bankId,
                );
                const totalFunds =
                  await steammClient.Bank.getTotalFunds(bankInfo);

                bankObjs.push({
                  bankInfo,
                  bank,
                  totalFunds: +totalFunds.toString(),
                });
              }
            } else {
              const banksRes = await fetch(`${API_URL}/steamm/banks/all`);
              const banksJson: (Omit<BankObj, "totalFundsRaw"> & {
                totalFunds: number;
              })[] = await banksRes.json();
              if ((banksJson as any)?.statusCode === 500)
                throw new Error("Failed to fetch banks");

              bankObjs.push(
                ...banksJson.filter(
                  (bankObj) =>
                    !TEST_BANK_COIN_TYPES.includes(bankObj.bankInfo.coinType), // Filter out test banks
                ),
              );
            }

            return bankObjs;
          })(),
        ]);

        // Pools
        const poolObjs: PoolObj[] = [];
        if (process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true") {
          const poolInfos = await steammClient.fetchPoolData();

          for (const poolInfo of poolInfos) {
            if (TEST_POOL_IDS.includes(poolInfo.poolId)) continue; // Filter out test pools

            const pool = await fetchPool(steammClient, poolInfo);
            const redeemQuote =
              new BigNumber(pool.balanceA.value.toString()).eq(0) &&
              new BigNumber(pool.balanceB.value.toString()).eq(0)
                ? null
                : await steammClient.Pool.quoteRedeem({
                    lpTokens: pool.lpSupply.value,
                    poolInfo,
                    bankInfoA: bankObjs.find(
                      (bankObj) =>
                        bankObj.bankInfo.btokenType === poolInfo.coinTypeA,
                    )!.bankInfo,
                    bankInfoB: bankObjs.find(
                      (bankObj) =>
                        bankObj.bankInfo.btokenType === poolInfo.coinTypeB,
                    )!.bankInfo,
                  });

            poolObjs.push({ poolInfo, pool, redeemQuote });
          }
        } else {
          const poolsRes = await fetch(`${API_URL}/steamm/pools/all`);
          const poolsJson: PoolObj[] = await poolsRes.json();
          if ((poolsJson as any)?.statusCode === 500)
            throw new Error("Failed to fetch pools");

          poolObjs.push(
            ...poolsJson.filter(
              (poolObj) => !TEST_POOL_IDS.includes(poolObj.poolInfo.poolId), // Filter out test pools
            ),
          );
        }

        return {
          oracleIndexOracleInfoPriceMap,
          COINTYPE_ORACLE_INDEX_MAP,
          coinTypeOracleInfoPriceMap,
          bankObjs,
          poolObjs,
        };
      })(),
    ]);

    // CoinMetadata
    let coinMetadataMap: Record<string, CoinMetadata> = {
      ...suilend.mainMarket.rewardCoinMetadataMap,
      ...suilend.lmMarket.rewardCoinMetadataMap,
    };

    // CoinMetadata - additional
    const bankCoinTypes: string[] = [];
    for (const bankObj of bankObjs) {
      bankCoinTypes.push(normalizeStructTag(bankObj.bankInfo.coinType));
    }
    const uniqueBankCoinTypes = Array.from(new Set(bankCoinTypes));

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

    //

    const uniqueAdditionalCoinTypes = Array.from(
      new Set([
        NORMALIZED_STEAMM_POINTS_COINTYPE,
        ...uniqueBankCoinTypes,
        ...uniquePoolCoinTypes,
      ]),
    ).filter((coinType) => !Object.keys(coinMetadataMap).includes(coinType));

    const additionalCoinMetadataMap = await getCoinMetadataMap(
      uniqueAdditionalCoinTypes,
    );
    coinMetadataMap = { ...coinMetadataMap, ...additionalCoinMetadataMap };

    // Banks - parse
    const bTokenTypeCoinTypeMap: Record<string, string> = {};
    for (const bankObj of bankObjs) {
      bTokenTypeCoinTypeMap[bankObj.bankInfo.btokenType] = normalizeStructTag(
        bankObj.bankInfo.coinType,
      );
    }

    const banks: ParsedBank[] = bankObjs.map((bankObj) =>
      getParsedBank(
        { suilend, coinMetadataMap },
        bankObj.bankInfo,
        bankObj.bank,
        bankObj.totalFunds,
      ),
    );
    const bankMap = Object.fromEntries(
      banks.map((bank) => [bank.coinType, bank]),
    );

    // Pools - parse
    const pools: ParsedPool[] = poolObjs
      .map((poolObj) =>
        getParsedPool(
          {
            coinMetadataMap,
            lstAprPercentMap,
            oracleIndexOracleInfoPriceMap,
            coinTypeOracleInfoPriceMap,
            bTokenTypeCoinTypeMap,
            bankMap,
          },
          poolObj.poolInfo,
          poolObj.pool,
          poolObj.redeemQuote,
        ),
      )
      .filter(Boolean) as ParsedPool[];

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

    // Rewards
    const normalizedPoolRewardMap = normalizeRewards(
      formatRewards(
        suilend.lmMarket.reserveMap,
        suilend.lmMarket.rewardCoinMetadataMap,
        suilend.lmMarket.rewardPriceMap,
        [],
      ),
      suilend.lmMarket.reserveMap,
      sortedPools,
    );

    return {
      suilend,

      coinMetadataMap,
      lstAprPercentMap,

      oracleIndexOracleInfoPriceMap,
      COINTYPE_ORACLE_INDEX_MAP,
      coinTypeOracleInfoPriceMap,

      bTokenTypeCoinTypeMap,
      banks,
      bankMap,

      pools: sortedPools,
      normalizedPoolRewardMap,
    };
  };

  const { data, mutate } = useSWR<AppData>("appData", dataFetcher, {
    refreshInterval: 30 * 1000,
    onSuccess: (data) => {
      console.log("Refreshed app data", data);
    },
    onError: (err, key) => {
      const isInitialLoad = cache.get(key)?.data === undefined;
      if (isInitialLoad) showErrorToast("Failed to fetch app data", err);

      console.error(err);
    },
  });

  return { data, mutateData: mutate };
}
