import { useRouter } from "next/router";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
} from "react";

import { Loader2 } from "lucide-react";

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
  const poolIdWithSlug = router.query.poolId as string;

  const { poolsData } = useLoadedAppContext();

  // Pool
  const pool = useMemo(
    () =>
      poolsData === undefined
        ? undefined
        : (poolsData?.pools.find(
            (pool) => pool.id === poolIdWithSlug?.split("-")?.[0],
          ) ?? null),
    [poolsData, poolIdWithSlug],
  );

  useEffect(() => {
    if (pool === undefined) return; // Loading
    if (pool === null) router.replace(ROOT_URL); // Redirect to Pools page if poolId is not valid
  }, [pool, router]);

  // Context
  const contextValue: PoolContext = useMemo(
    () => ({
      pool: pool as ParsedPool,
    }),
    [pool],
  );

  if (pool === undefined)
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  if (pool === null) return null; // Display nothing while redirecting to Pools page
  return (
    <PoolContext.Provider value={contextValue}>{children}</PoolContext.Provider>
  );
}
