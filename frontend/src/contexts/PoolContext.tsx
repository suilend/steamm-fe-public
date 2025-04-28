import { useRouter } from "next/router";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Loader2 } from "lucide-react";

import { useLoadedAppContext } from "@/contexts/AppContext";
import { ROOT_URL } from "@/lib/navigation";
import { fetchPool, getParsedPool } from "@/lib/pools";
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

  const { steammClient, appData, oraclesData, banksData, poolsData } =
    useLoadedAppContext();

  // Pool info
  const poolId = useMemo(
    () => poolIdWithSlug?.split("-")?.[0],
    [poolIdWithSlug],
  );

  const poolInfo = useMemo(
    () =>
      poolsData === undefined
        ? undefined
        : (poolsData?.pools.find((pool) => pool.id === poolId)?.poolInfo ??
          null),
    [poolsData, poolId],
  );

  const isFetchingRefreshedPoolMapRef = useRef<Record<string, boolean>>({});
  const [refreshedPoolMap, setRefreshedPoolMap] = useState<
    Record<string, ParsedPool>
  >({});

  useEffect(() => {
    (async () => {
      if (!appData || !oraclesData || !banksData) return;
      if (!poolInfo) return;

      if (isFetchingRefreshedPoolMapRef.current[poolInfo.poolId]) return;
      isFetchingRefreshedPoolMapRef.current[poolInfo.poolId] = true;

      try {
        const id = poolInfo.poolId;
        const pool = await fetchPool(steammClient, poolInfo);

        const parsedPool = await getParsedPool(
          steammClient,
          appData,
          oraclesData,
          banksData,
          poolInfo,
          pool,
        );
        if (parsedPool === undefined) return;

        setRefreshedPoolMap((prev) => ({ ...prev, [id]: parsedPool }));
      } catch (err) {
        console.error(err);
      }
    })();
  }, [appData, oraclesData, banksData, poolInfo, steammClient]);

  // Pool
  const pool = useMemo(
    () =>
      poolInfo === undefined
        ? undefined
        : poolInfo === null
          ? null
          : (refreshedPoolMap[poolId] ??
            poolsData?.pools.find((pool) => pool.id === poolId)),
    [poolInfo, refreshedPoolMap, poolsData?.pools, poolId],
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
