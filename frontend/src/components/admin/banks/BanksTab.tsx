import { useMemo } from "react";

import BankCard from "@/components/admin/banks/BankCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { getBankPrice } from "@/lib/banks";

export default function BanksTab() {
  const { appData } = useLoadedAppContext();

  const sortedInitializableBanks = useMemo(
    () =>
      appData.banks
        .filter(
          (bank) => !!appData.suilend.mainMarket.reserveMap[bank.coinType],
        )
        .sort((a, b) => {
          const priceA = getBankPrice(appData.pools, a);
          const priceB = getBankPrice(appData.pools, b);
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
          const priceA = getBankPrice(appData.pools, a);
          const priceB = getBankPrice(appData.pools, b);
          if (priceA === undefined || priceB === undefined) return 0;

          return +b.totalFunds.times(priceB) - +a.totalFunds.times(priceA);
        }),
    [appData.banks, appData.suilend.mainMarket.reserveMap, appData.pools],
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedInitializableBanks === undefined
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[534px] w-full rounded-md" />
            ))
          : sortedInitializableBanks.map((bank) => (
              <BankCard key={bank.id} bank={bank} />
            ))}
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedNonInitializableBanks === undefined
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[534px] w-full rounded-md" />
            ))
          : sortedNonInitializableBanks.map((bank) => (
              <BankCard key={bank.id} bank={bank} />
            ))}
      </div>
    </div>
  );
}
