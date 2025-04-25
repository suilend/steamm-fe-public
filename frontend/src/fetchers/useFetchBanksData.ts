import { normalizeStructTag } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import useSWR from "swr";

import { showErrorToast } from "@suilend/frontend-sui-next";

import { AppData, BanksData } from "@/contexts/AppContext";
import { ParsedBank } from "@/lib/types";

export default function useFetchBanksData(appData: AppData | undefined) {
  // Data
  const dataFetcher = async () => {
    if (!appData) return undefined as unknown as BanksData; // In practice `dataFetcher` won't be called if `appData` is falsy

    const { mainMarket, coinMetadataMap, bankObjs } = appData;

    // Banks
    const bTokenTypeCoinTypeMap: Record<string, string> = {};

    for (const bankObj of bankObjs) {
      bTokenTypeCoinTypeMap[bankObj.bankInfo.btokenType] = normalizeStructTag(
        bankObj.bankInfo.coinType,
      );
    }

    const banks: ParsedBank[] = bankObjs.map((bankObj) => {
      const { bankInfo, bank, totalFunds: totalFundsRaw } = bankObj;

      const id = bankInfo.bankId;
      const coinType = bankInfo.coinType;
      const bTokenType = bankInfo.btokenType;

      const totalFunds = new BigNumber(totalFundsRaw.toString()).div(
        10 ** coinMetadataMap[coinType].decimals,
      );

      const fundsAvailable = new BigNumber(
        bank.fundsAvailable.value.toString(),
      ).div(10 ** coinMetadataMap[coinType].decimals);
      const fundsDeployed = totalFunds.minus(fundsAvailable);

      const bTokenSupply = new BigNumber(
        bank.btokenSupply.value.toString(),
      ).div(10 ** coinMetadataMap[coinType].decimals);
      const bTokenExchangeRate = totalFunds.div(bTokenSupply);

      const utilizationPercent = totalFunds.gt(0)
        ? fundsDeployed.div(totalFunds).times(100)
        : new BigNumber(0);
      const suilendDepositAprPercent =
        mainMarket.depositAprPercentMap[coinType] ?? new BigNumber(0);

      return {
        id,
        bank,
        bankInfo,
        coinType,
        bTokenType,

        fundsAvailable,
        fundsDeployed,
        totalFunds,

        bTokenSupply,
        bTokenExchangeRate,

        utilizationPercent,
        suilendDepositAprPercent,
      };
    });
    const bankMap = Object.fromEntries(
      banks.map((bank) => [bank.coinType, bank]),
    );

    return {
      bTokenTypeCoinTypeMap,

      banks,
      bankMap,
    };
  };

  const { data, mutate } = useSWR<BanksData>(
    !appData ? null : "banksData",
    dataFetcher,
    {
      refreshInterval: 30 * 1000,
      onSuccess: (data) => {
        console.log("Refreshed banks data", data);
      },
      onError: (err) => {
        showErrorToast(
          "Failed to refresh banks data. Please check your internet connection or change RPC providers in Settings.",
          err,
        );
        console.error(err);
      },
    },
  );

  return { data, mutateData: mutate };
}
