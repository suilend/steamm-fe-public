import { useRouter } from "next/router";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
} from "react";

import { useLoadedAppContext } from "@/contexts/AppContext";
import { ROOT_URL } from "@/lib/navigation";
import { ParsedPool } from "@/lib/types";

interface PoolContext {
  pool: ParsedPool;
}

const PoolContext = createContext<PoolContext>({
  pool: {} as ParsedPool,
});

export const usePoolContext = () => useContext(PoolContext);

export function PoolContextProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const poolId = router.query.poolId as string;

  const { appData } = useLoadedAppContext();

  // Pool
  const pool = useMemo(
    () => appData.pools.find((pool) => pool.id === poolId),
    [appData.pools, poolId],
  );

  useEffect(() => {
    if (!pool) router.replace(ROOT_URL); // Redirect to Pools page if poolId is not valid
  }, [pool, router]);

  // Context
  const contextValue: PoolContext = useMemo(
    () => ({
      pool: pool as ParsedPool,
    }),
    [pool],
  );

  if (!pool) return null;
  return (
    <PoolContext.Provider value={contextValue}>{children}</PoolContext.Provider>
  );
}
