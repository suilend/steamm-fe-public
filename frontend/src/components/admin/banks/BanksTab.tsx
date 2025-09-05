import { useCallback, useMemo, useState } from "react";

import { DynamicFieldInfo } from "@mysten/sui/client";
import BigNumber from "bignumber.js";
import pLimit from "p-limit";

import { ParsedBank } from "@suilend/steamm-sdk";
import { useSettingsContext } from "@suilend/sui-fe-next";

import BankCard from "@/components/admin/banks/BankCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { getAvgPoolPrice } from "@/lib/pools";

export default function BanksTab() {
  const { suiClient } = useSettingsContext();
  const { steammClient, appData } = useLoadedAppContext();

  const sortedInitializableBanks = useMemo(
    () =>
      appData.banks
        .filter(
          (bank) => !!appData.suilend.mainMarket.reserveMap[bank.coinType],
        )
        .sort((a, b) => {
          const priceA = getAvgPoolPrice(appData.pools, a.coinType);
          const priceB = getAvgPoolPrice(appData.pools, b.coinType);
          if (priceA === undefined || priceB === undefined) return 0;

          return +b.totalFunds.times(priceB) - +a.totalFunds.times(priceA);
        }),
    [appData.banks, appData.suilend.mainMarket.reserveMap, appData.pools],
  );

  const sortedNonInitializableBanks = useMemo(
    () =>
      appData.banks
        .filter((bank) => !appData.suilend.mainMarket.reserveMap[bank.coinType])
        .sort((a, b) => {
          const priceA = getAvgPoolPrice(appData.pools, a.coinType);
          const priceB = getAvgPoolPrice(appData.pools, b.coinType);
          if (priceA === undefined || priceB === undefined) return 0;

          return +b.totalFunds.times(priceB) - +a.totalFunds.times(priceA);
        }),
    [appData.banks, appData.suilend.mainMarket.reserveMap, appData.pools],
  );

  // Protocol fees
  const [bankProtocolFeesMap, setBankProtocolFees] = useState<
    Record<string, BigNumber | null | undefined>
  >({});

  const fetchBankProtocolFees = useCallback(
    async (bank: ParsedBank) => {
      const price =
        appData.suilend.mainMarket.reserveMap[bank.coinType]?.price ??
        getAvgPoolPrice(appData.pools, bank.coinType);

      if (bank.totalFunds.times(price ?? 0).lt(1000)) {
        setBankProtocolFees((prev) => ({
          ...prev,
          [bank.id]: new BigNumber(0), // Don't fetch if bank TVL is <$1000
        }));
        return;
      }

      const dynamicFields = (
        await steammClient.fullClient.getDynamicFieldsByPage(bank.id)
      ).data;

      const protocolFeeField = dynamicFields.find(
        (df) =>
          (df as DynamicFieldInfo).name.type ===
          "0xc04425c5585e7d0a7e49f1265983e4303180216880179cccfc894afa8afe6d50::bank::ProtocolFeeKey",
      );
      if (!protocolFeeField) {
        setBankProtocolFees((prev) => ({ ...prev, [bank.id]: null }));
        return;
      }

      const protocolFeeObj = await suiClient.getObject({
        id: (protocolFeeField as DynamicFieldInfo).objectId,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
        },
      });

      const value = new BigNumber(
        (protocolFeeObj.data?.content as any).fields.value,
      ).div(10 ** appData.coinMetadataMap[bank.coinType].decimals);
      setBankProtocolFees((prev) => ({ ...prev, [bank.id]: value }));
    },
    [
      appData.suilend.mainMarket.reserveMap,
      appData.pools,
      steammClient.fullClient,
      suiClient,
      appData.coinMetadataMap,
    ],
  );
  const limit = pLimit(10);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedInitializableBanks === undefined
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[534px] w-full rounded-md" />
            ))
          : sortedInitializableBanks.map((bank) => (
              <BankCard
                key={bank.id}
                bank={bank}
                bankProtocolFees={bankProtocolFeesMap[bank.id]}
                fetchBankProtocolFees={() =>
                  limit(() => fetchBankProtocolFees(bank))
                }
              />
            ))}
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedNonInitializableBanks === undefined
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[534px] w-full rounded-md" />
            ))
          : sortedNonInitializableBanks.map((bank) => (
              <BankCard
                key={bank.id}
                bank={bank}
                bankProtocolFees={bankProtocolFeesMap[bank.id]}
                fetchBankProtocolFees={() =>
                  limit(() => fetchBankProtocolFees(bank))
                }
              />
            ))}
      </div>
    </div>
  );
}
