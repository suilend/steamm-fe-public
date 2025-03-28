import { useMemo } from "react";

import BankCard from "@/components/admin/banks/BankCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";

export default function BanksTab() {
  const { appData, banksData } = useLoadedAppContext();

  const sortedInitializableBanks = useMemo(() => {
    if (banksData === undefined) return undefined;

    return banksData.banks
      .filter((bank) => !!appData.mainMarket.reserveMap[bank.coinType])
      .sort(
        (a, b) =>
          appData.coinMetadataMap[a.coinType].symbol.toLowerCase() <
          appData.coinMetadataMap[b.coinType].symbol.toLowerCase()
            ? -1
            : 1, // Sort by symbol (ascending)
      );
  }, [appData, banksData]);

  const sortedNonInitializableBanks = useMemo(() => {
    if (banksData === undefined) return undefined;

    return banksData.banks
      .filter((bank) => !appData.mainMarket.reserveMap[bank.coinType])
      .sort(
        (a, b) =>
          appData.coinMetadataMap[a.coinType].symbol.toLowerCase() <
          appData.coinMetadataMap[b.coinType].symbol.toLowerCase()
            ? -1
            : 1, // Sort by symbol (ascending)
      );
  }, [appData, banksData]);

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
        {sortedInitializableBanks === undefined
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[428px] w-full rounded-md" />
            ))
          : sortedInitializableBanks.map((bank) => (
              <BankCard key={bank.id} bank={bank} />
            ))}
      </div>

      <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
        {sortedNonInitializableBanks === undefined
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[428px] w-full rounded-md" />
            ))
          : sortedNonInitializableBanks.map((bank) => (
              <BankCard key={bank.id} bank={bank} />
            ))}
      </div>
    </div>
  );
}
