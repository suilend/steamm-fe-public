import { useMemo } from "react";

import PoolCard from "@/components/admin/pools/PoolCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";

export default function PoolsTab() {
  const { appData } = useLoadedAppContext();

  const sortedPools = useMemo(
    () => appData.pools.slice().sort((a, b) => +b.tvlUsd - +a.tvlUsd),
    [appData.pools],
  );

  return (
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
  );
}
