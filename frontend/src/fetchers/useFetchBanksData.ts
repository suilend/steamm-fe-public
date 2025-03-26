import { normalizeStructTag } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import pLimit from "p-limit";
import useSWR from "swr";

import { showErrorToast } from "@suilend/frontend-sui-next";
import { SteammSDK } from "@suilend/steamm-sdk";

import { AppData, BanksData } from "@/contexts/AppContext";
import { ParsedBank } from "@/lib/types";

export default function useFetchBanksData(
  steammClient: SteammSDK,
  appData: AppData | undefined,
) {
  // Data
  const dataFetcher = async () => {
    if (!appData) return undefined as unknown as BanksData; // In practice `dataFetcher` won't be called if `appData` is falsy

    const { mainMarket, coinMetadataMap, bankInfos } = appData;
    const limit10 = pLimit(10);

    // Banks
    const bTokenTypeCoinTypeMap: Record<string, string> = {};

    for (const bankInfo of bankInfos) {
      bTokenTypeCoinTypeMap[bankInfo.btokenType] = normalizeStructTag(
        bankInfo.coinType,
      );
    }

    const banks: ParsedBank[] = await Promise.all(
      bankInfos.map((bankInfo) =>
        limit10(async () => {
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
            .times(mainMarket.reserveMap[coinType]?.cTokenExchangeRate ?? 0) // Fallback for when mainMarket does not have the corresponding reserve
            .div(10 ** coinMetadataMap[coinType].decimals);
          const totalAmount = liquidAmount.plus(depositedAmount);

          const utilizationPercent = totalAmount.gt(0)
            ? depositedAmount.div(totalAmount).times(100)
            : new BigNumber(0);
          const suilendDepositAprPercent =
            mainMarket.depositAprPercentMap[coinType] ?? new BigNumber(0);

          return {
            id,
            bank,
            bankInfo,
            coinType,
            bTokenType,

            liquidAmount,
            depositedAmount,
            totalAmount,

            utilizationPercent,
            suilendDepositAprPercent,
          };
        }),
      ),
    );
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
