import { CoinMetadata } from "@mysten/sui/client";
import { normalizeStructTag } from "@mysten/sui/utils";
import { SuiPriceServiceConnection } from "@pythnetwork/pyth-sui-js";
import BigNumber from "bignumber.js";
import useSWR from "swr";

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
  PoolInfo,
  RedeemQuote,
  SteammSDK,
} from "@suilend/steamm-sdk";
import { Bank } from "@suilend/steamm-sdk/_codegen/_generated/steamm/bank/structs";
import { CpQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/cpmm/structs";
import { OracleQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm/structs";
import { OracleQuoterV2 } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm_v2/structs";
import { Pool } from "@suilend/steamm-sdk/_codegen/_generated/steamm/pool/structs";

import { AppContext, AppData } from "@/contexts/AppContext";
import { getParsedBank } from "@/lib/banks";
import { ASSETS_URL } from "@/lib/constants";
import { formatPair } from "@/lib/format";
import { normalizeRewards } from "@/lib/liquidityMining";
import { API_URL } from "@/lib/navigation";
import { OracleType } from "@/lib/oracles";
import { fetchPool, getParsedPool } from "@/lib/pools";
import { ParsedBank, ParsedPool } from "@/lib/types";

const TEST_BANK_COIN_TYPES = [
  "0x02242e71c54b389c5e4001c2635c598469c5900020cc873e21d01a542124b260::zxcv::ZXCV",
  "0x990988b4d1297c9d9bad49a43717bd46b37c6fe5546d789274e94a6bfa8e4632::asdd::ASDD",
  "0xfaccf97bcd174fdd11c9f540085a2dfe5a1aa1d861713b2887271a41c6fe9556::bzbz::BZBZ",
  "0x6d73ca1798d868a3320e32be4657969175793356b499e4e32240a2ff071c7ead::ott::OTT",
  "0x235a314a92d8dddfd72e002aeb00f69c5e23bb27d53637d74e928bac94ed0d9a::orng::ORNG",
  "0x601c6056be147470ff3fae945e9488abf8dd776e3921684ed6f5d931795e5b4d::ttt::TTT",
  "0x55708349d3786db6ad10a6d6709528b666b1be9479d0e7dbcff9671fe09747b5::zxc::ZXC",
];

const TEST_POOL_IDS = [
  "0x9bac3b28b5960f791e0526b3c5bcea889c2bce56a8dd37fc39a532fe8d49baec",
  "0x56d3919cdbdf22c0a4d60471c045e07fd0ba37d0b8fe2577b22408c17141f692",
  "0x2c76690cd6ef9607212b4e72aa3292bcf74843586ffbef61f781d1afecc19a37",
  "0x1d4cf16a1a83883117577a3e5e4dbe2aab8016dc67bf2451c4671d400d9f05c9",
  "0x843c212b9a37fb0c5f6c02d227a861515e0346f62abb41ebed3983899d618f0d",
  "0x6a8b1f29b7f7b4d0ad5c53f95fa9081ac62bf3895d196d5abac001e465c72661",
  "0x5376f6262948204581fcdbd14808613b8890655d868ad615e2c8a4ef5397783f",
  "0x31abe0dfec024f6b794f462e078b6713e94fd5d5b2ea39bb0a0329cdf41210e7", // DMC test pool
  "0xee46df0cf257d6fb91792fa9837f54a24377d3c7b43a2a96283aced4cda96f78", // GMB test pool
  "0x7ac91a9b9197a669b902bf51faa2ed609cebb178c21af5dc55aa3ad02ecf3f3a", // FUD test pool
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
  redeemQuote: RedeemQuote;
};

export default function useFetchAppData(
  steammClient: SteammSDK,
  localCoinMetadataMap: AppContext["localCoinMetadataMap"],
  addCoinMetadataToLocalMap: AppContext["addCoinMetadataToLocalMap"],
) {
  const { suiClient } = useSettingsContext();

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
            ? BETA_CONFIG.suilend_config.config!.lendingMarketId // Requires NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true
            : MAINNET_CONFIG.suilend_config.config!.lendingMarketId,
          process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
            ? BETA_CONFIG.suilend_config.config!.lendingMarketType // Requires NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true
            : MAINNET_CONFIG.suilend_config.config!.lendingMarketType,
          suiClient,
        );

        const {
          lendingMarket: mainMarket_lendingMarket,
          coinMetadataMap: mainMarket_coinMetadataMap,

          refreshedRawReserves: mainMarket_refreshedRawReserves,
          reserveMap: mainMarket_reserveMap,

          activeRewardCoinTypes: mainMarket_activeRewardCoinTypes,
          rewardCoinMetadataMap: mainMarket_rewardCoinMetadataMap,
        } = await initializeSuilend(
          suiClient,
          mainMarket_suilendClient,
          localCoinMetadataMap,
        );
        for (const coinType of Object.keys(mainMarket_coinMetadataMap)) {
          if (!localCoinMetadataMap[coinType])
            addCoinMetadataToLocalMap(
              coinType,
              mainMarket_coinMetadataMap[coinType],
            );
        }

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
          coinMetadataMap: lmMarket_coinMetadataMap,

          refreshedRawReserves: lmMarket_refreshedRawReserves,
          reserveMap: lmMarket_reserveMap,

          activeRewardCoinTypes: lmMarket_activeRewardCoinTypes,
          rewardCoinMetadataMap: lmMarket_rewardCoinMetadataMap,
        } = await initializeSuilend(
          suiClient,
          lmMarket_suilendClient,
          localCoinMetadataMap,
        );
        for (const coinType of Object.keys(lmMarket_coinMetadataMap)) {
          if (!localCoinMetadataMap[coinType])
            addCoinMetadataToLocalMap(
              coinType,
              lmMarket_coinMetadataMap[coinType],
            );
        }

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

      // LSTs
      (async () => {
        const lstAprsRes = await fetch(`${API_URL}/springsui/all`);
        const lstAprsJson: Record<string, string> = await lstAprsRes.json();
        if ((lstAprsRes as any)?.statusCode === 500)
          throw new Error("Failed to fetch SpringSui LST APRs");

        return Object.fromEntries(
          Object.entries(lstAprsJson).map(([coinType, aprPercent]) => [
            coinType,
            new BigNumber(aprPercent),
          ]),
        ) as AppData["lstAprPercentMap"];
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

                  const oracleInfos = await steammClient.getOracles();

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
              const bankInfos = Object.values(await steammClient.getBanks());

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
          const poolInfos = await steammClient.getPools();

          for (const poolInfo of poolInfos) {
            if (TEST_POOL_IDS.includes(poolInfo.poolId)) continue; // Filter out test pools

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

    const _additionalCoinMetadataMap = await getCoinMetadataMap(
      uniqueAdditionalCoinTypes.filter(
        (coinType) => !localCoinMetadataMap[coinType],
      ),
    );
    const additionalCoinMetadataMap: Record<string, CoinMetadata> =
      uniqueAdditionalCoinTypes.reduce(
        (acc, coinType) => ({
          ...acc,
          [coinType]:
            localCoinMetadataMap?.[coinType] ??
            _additionalCoinMetadataMap[coinType],
        }),
        {} as Record<string, CoinMetadata>,
      );
    coinMetadataMap = { ...coinMetadataMap, ...additionalCoinMetadataMap };

    for (const coinType of Object.keys(additionalCoinMetadataMap)) {
      if (!localCoinMetadataMap[coinType])
        addCoinMetadataToLocalMap(
          coinType,
          additionalCoinMetadataMap[coinType],
        );
    }

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
            suilend,
            coinMetadataMap,
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
    onError: (err) => {
      showErrorToast("Failed to refresh app data", err);
      console.error(err);
    },
  });

  return { data, mutateData: mutate };
}
