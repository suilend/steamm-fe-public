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
import { ParsedBank, ParsedPool, PoolType } from "@/lib/types";

export default function useFetchAppData(steammClient: SteammSDK) {
  const { suiClient } = useSettingsContext();

  const dataFetcher = async () => {
    // Suilend
    const suilendClient = await SuilendClient.initialize(
      LENDING_MARKET_ID, // Main Market
      LENDING_MARKET_TYPE,
      suiClient,
    ); // Switch to Suilend Beta Main Market by setting NEXT_PUBLIC_SUILEND_USE_BETA_MARKET=true (should not need to in practice)

    const { reserveMap } = await initializeSuilend(suiClient, suilendClient);

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
      uniqueBankCoinTypes,
    );

    const lendingMarketIdTypeMap = Object.values(bankInfos).reduce(
      (acc, bankInfo) => ({
        ...acc,
        [bankInfo.lendingMarketId]: bankInfo.lendingMarketType,
      }),
      {},
    );

    const banks: ParsedBank[] = await Promise.all(
      Object.values(bankInfos).map((bankInfo) =>
        (async () => {
          const id = bankInfo.bankId;
          const coinType = bankInfo.coinType;
          const bTokenType = bankInfo.btokenType;

          const bank = await steammClient.fullClient.fetchBank(id);

          const liquidAmount = new BigNumber(
            bank.fundsAvailable.value.toString(),
          ).div(10 ** bankCoinMetadataMap[coinType].decimals);
          const depositedAmount = new BigNumber(
            bank.lending ? bank.lending.ctokens.toString() : 0,
          )
            .times(reserveMap[coinType].cTokenExchangeRate)
            .div(10 ** bankCoinMetadataMap[coinType].decimals);
          const totalAmount = liquidAmount.plus(depositedAmount);

          const utilizationPercent = depositedAmount
            .div(totalAmount)
            .times(100);
          const suilendDepositAprPercent =
            reserveDepositAprPercentMap[coinType] ?? new BigNumber(0);

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
      uniquePoolCoinTypes,
    );

    const coinMetadataMap = {
      ...bankCoinMetadataMap,
      ...poolCoinMetadataMap,
    };

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
            if (
              bTokenTypeA.startsWith("0x10e03a93cf1e3d") ||
              bTokenTypeB.startsWith("0x10e03a93cf1e3d")
            )
              return undefined; // Skip pools with test bTokens

            const coinTypeA = bTokenTypeCoinTypeMap[bTokenTypeA];
            const coinTypeB = bTokenTypeCoinTypeMap[bTokenTypeB];

            const pool = await steammClient.fullClient.fetchPool(id);

            const balanceA = new BigNumber(pool.balanceA.value.toString()).div(
              10 ** coinMetadataMap[coinTypeA].decimals,
            );
            const balanceB = new BigNumber(pool.balanceB.value.toString()).div(
              10 ** coinMetadataMap[coinTypeB].decimals,
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
              bTokenTypes: [bTokenTypeA, bTokenTypeB],
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
      coinMetadataMap,
      bTokenTypeCoinTypeMap,
      lendingMarketIdTypeMap,

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
