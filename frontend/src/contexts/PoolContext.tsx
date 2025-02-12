import { useRouter } from "next/router";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
} from "react";

import { useLoadedAppContext } from "@/contexts/AppContext";
import { POOLS_URL } from "@/lib/navigation";
import { Pool } from "@/lib/types";

interface PoolContext {
  pool: Pool;
}

const PoolContext = createContext<PoolContext>({
  pool: {} as Pool,
});

export const usePoolContext = () => useContext(PoolContext);

export function PoolContextProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const poolId = router.query.poolId as string;

  const { appData } = useLoadedAppContext();

  // Pool
  const pool = useMemo(
    () =>
      appData.poolGroups
        .map((poolGroup) => poolGroup.pools)
        .flat()
        .find((pool) => pool.id === poolId),
    [appData.poolGroups, poolId],
  );

  useEffect(() => {
    if (!pool) router.replace(POOLS_URL); // Redirect to Pools page if poolId is not valid
  }, [pool, router]);

  // Context
  const contextValue: PoolContext = useMemo(
    () => ({
      pool: pool as Pool,
    }),
    [pool],
  );

  if (!pool) return null;
  return (
    <PoolContext.Provider value={contextValue}>{children}</PoolContext.Provider>
  );
}
