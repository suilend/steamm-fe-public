import { useMemo } from "react";

import { Plus } from "lucide-react";

import PoolCard from "@/components/admin/pools/PoolCard";
import CreatePoolCard from "@/components/pools/CreatePoolCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";

export default function PoolsTab() {
  const { appData } = useLoadedAppContext();

  const sortedPools = useMemo(
    () => appData.pools.slice().sort((a, b) => +b.tvlUsd - +a.tvlUsd),
    [appData.pools],
  );

  return (
    <>
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-md border p-5">
        <div className="flex flex-row items-center gap-2">
          <Plus className="h-4 w-4 text-foreground" />
          <p className="text-h3 text-foreground">Create pool</p>
        </div>

        <CreatePoolCard useWhitelist />
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        {sortedPools === undefined ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[189px] w-full rounded-md" />
          ))
        ) : (
          <>
            {sortedPools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </>
        )}
      </div>
    </>
  );
}
