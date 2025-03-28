import { useMemo } from "react";

import BankCard from "@/components/admin/banks/BankCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";

export default function BanksTab() {
  const { appData, banksData } = useLoadedAppContext();

  const sortedBanks = useMemo(() => {
    if (banksData === undefined) return undefined;

    return banksData.banks.slice().sort(
      (a, b) =>
        appData.coinMetadataMap[a.coinType].symbol.toLowerCase() <
        appData.coinMetadataMap[b.coinType].symbol.toLowerCase()
          ? -1
          : 1, // Sort by symbol (ascending)
    );
  }, [appData, banksData]);

  return (
    <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-2">
      {sortedBanks === undefined
        ? Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[428px] w-full rounded-md" />
          ))
        : sortedBanks.map((bank) => <BankCard key={bank.id} bank={bank} />)}
    </div>
  );
}
