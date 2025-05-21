import { useRouter } from "next/router";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Loader2 } from "lucide-react";

import { ParsedPool, PoolInfo, getParsedPool } from "@suilend/steamm-sdk";

import { useLoadedAppContext } from "@/contexts/AppContext";
import { ROOT_URL } from "@/lib/navigation";
import { fetchPool } from "@/lib/pools";

interface PoolContext {
  pool: ParsedPool;
  fetchRefreshedPool: (poolInfo: PoolInfo) => Promise<void>;
}

const PoolContext = createContext<PoolContext>({
  pool: {} as ParsedPool,
  fetchRefreshedPool: async () => {
    throw Error("PoolContextProvider not initialized");
  },
});

export const usePoolContext = () => useContext(PoolContext);

export function PoolContextProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const poolIdWithSlug = router.query.poolId as string;

  const { steammClient, appData } = useLoadedAppContext();

  // Pool info
  const poolId = useMemo(
    () => poolIdWithSlug?.split("-")?.[0],
    [poolIdWithSlug],
  );

  const poolInfo = useMemo(
    () => appData.pools.find((pool) => pool.id === poolId)?.poolInfo ?? null,
    [appData.pools, poolId],
  );

  // Refreshed pool map
  const [refreshedPoolMap, setRefreshedPoolMap] = useState<
    Record<string, ParsedPool>
  >({});

  const fetchRefreshedPool = useCallback(
    async (_poolInfo: PoolInfo) => {
      try {
        const pool = await fetchPool(steammClient, _poolInfo);
        const redeemQuote =
          new BigNumber(pool.balanceA.value.toString()).eq(0) &&
          new BigNumber(pool.balanceB.value.toString()).eq(0)
            ? null
            : await steammClient.Pool.quoteRedeem({
                lpTokens: pool.lpSupply.value,
                poolInfo: _poolInfo,
                bankInfoA:
                  appData.bankMap[
                    appData.bTokenTypeCoinTypeMap[_poolInfo.coinTypeA]
                  ].bankInfo,
                bankInfoB:
                  appData.bankMap[
                    appData.bTokenTypeCoinTypeMap[_poolInfo.coinTypeB]
                  ].bankInfo,
              });

        const parsedPool = getParsedPool(appData, _poolInfo, pool, redeemQuote);
        if (parsedPool === undefined) return;

        setRefreshedPoolMap((prev) => ({
          ...prev,
          [_poolInfo.poolId]: parsedPool,
        }));
      } catch (err) {
        console.error(err);
      }
    },
    [steammClient, appData],
  );

  const hasFetchedRefreshedPoolMapRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (!poolInfo) return;

    if (hasFetchedRefreshedPoolMapRef.current[poolInfo.poolId]) return;
    hasFetchedRefreshedPoolMapRef.current[poolInfo.poolId] = true;

    fetchRefreshedPool(poolInfo);
  }, [poolInfo, fetchRefreshedPool]);

  // Pool
  const pool = useMemo(
    () =>
      poolInfo === undefined
        ? undefined
        : poolInfo === null
          ? null
          : (refreshedPoolMap[poolId] ??
            appData.pools.find((pool) => pool.id === poolId)),
    [poolInfo, refreshedPoolMap, poolId, appData.pools],
  );

  useEffect(() => {
    if (pool === undefined) return; // Loading
    if (pool === null) router.replace(ROOT_URL); // Redirect to Home page if poolId is not valid
  }, [pool, router]);

  // Context
  const contextValue: PoolContext = useMemo(
    () => ({
      pool: pool as ParsedPool,
      fetchRefreshedPool,
    }),
    [pool, fetchRefreshedPool],
  );

  if (pool === undefined)
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  if (pool === null) return null; // Display nothing while redirecting to Home page
  return (
    <PoolContext.Provider value={contextValue}>{children}</PoolContext.Provider>
  );
}
