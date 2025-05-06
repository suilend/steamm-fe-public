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

import { PoolInfo } from "@suilend/steamm-sdk";

import { useLoadedAppContext } from "@/contexts/AppContext";
import { ROOT_URL } from "@/lib/navigation";
import { fetchPool, getParsedPool } from "@/lib/pools";
import { ParsedPool } from "@/lib/types";

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

  // Refreshed pool map
  const [refreshedPoolMap, setRefreshedPoolMap] = useState<
    Record<string, ParsedPool>
  >({});

  const fetchRefreshedPool = useCallback(
    async (_poolInfo: PoolInfo) => {
      if (!appData || !oraclesData || !banksData) return;

      try {
        const pool = await fetchPool(steammClient, _poolInfo);
        const redeemQuote = await steammClient.Pool.quoteRedeem({
          lpTokens: pool.lpSupply.value,
          poolInfo: _poolInfo,
          bankInfoA: appData.bankObjs.find(
            (bankObj) => bankObj.bankInfo.btokenType === _poolInfo.coinTypeA,
          )!.bankInfo,
          bankInfoB: appData.bankObjs.find(
            (bankObj) => bankObj.bankInfo.btokenType === _poolInfo.coinTypeB,
          )!.bankInfo,
        });

        const parsedPool = await getParsedPool(
          appData,
          oraclesData,
          banksData,
          _poolInfo,
          pool,
          redeemQuote,
        );
        if (parsedPool === undefined) return;

        setRefreshedPoolMap((prev) => ({
          ...prev,
          [_poolInfo.poolId]: parsedPool,
        }));
      } catch (err) {
        console.error(err);
      }
    },
    [appData, oraclesData, banksData, steammClient],
  );

  const hasFetchedRefreshedPoolMapRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (!appData || !oraclesData || !banksData) return;
    if (!poolInfo) return;

    if (hasFetchedRefreshedPoolMapRef.current[poolInfo.poolId]) return;
    hasFetchedRefreshedPoolMapRef.current[poolInfo.poolId] = true;

    fetchRefreshedPool(poolInfo);
  }, [appData, oraclesData, banksData, poolInfo, fetchRefreshedPool]);

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
  if (pool === null) return null; // Display nothing while redirecting to Pools page
  return (
    <PoolContext.Provider value={contextValue}>{children}</PoolContext.Provider>
  );
}
