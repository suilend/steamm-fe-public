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

import BigNumber from "bignumber.js";

import { ParsedPool, getParsedPool } from "@suilend/steamm-sdk";

import { useLoadedAppContext } from "@/contexts/AppContext";
import { ROOT_URL } from "@/lib/navigation";
import { fetchPool } from "@/lib/pools";

interface PoolContext {
  pool: ParsedPool;
  fetchRefreshedPool: (existingPool: ParsedPool) => Promise<void>;
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

  const existingPool: ParsedPool | undefined = useMemo(
    () => appData.pools.find((pool) => pool.id === poolId),
    [appData.pools, poolId],
  );

  // Refreshed pool map
  const [refreshedPoolMap, setRefreshedPoolMap] = useState<
    Record<string, ParsedPool>
  >({});

  const fetchRefreshedPool = useCallback(
    async (_existingPool: ParsedPool) => {
      console.log("[fetchRefreshedPool] poolId:", _existingPool.id);

      try {
        const pool = await fetchPool(steammClient, _existingPool.poolInfo);
        const redeemQuote =
          new BigNumber(pool.balanceA.value.toString()).eq(0) &&
          new BigNumber(pool.balanceB.value.toString()).eq(0)
            ? null
            : await steammClient.Pool.quoteRedeem({
                lpTokens: pool.lpSupply.value,
                poolInfo: _existingPool.poolInfo,
                bankInfoA: appData.bankMap[_existingPool.coinTypes[0]].bankInfo,
                bankInfoB: appData.bankMap[_existingPool.coinTypes[1]].bankInfo,
              });

        const parsedPool = getParsedPool(appData, {
          poolInfo: _existingPool.poolInfo, // Existing poolInfo
          pool,
          redeemQuote,
          priceA: _existingPool.prices[0].toString(), // Existing prices
          priceB: _existingPool.prices[1].toString(), // Existing prices
          isInitialLpTokenBurned: _existingPool.isInitialLpTokenBurned, // Existing isInitialLpTokenBurned
        });
        if (parsedPool === undefined) return;

        setRefreshedPoolMap((prev) => ({
          ...prev,
          [_existingPool.id]: parsedPool,
        }));
      } catch (err) {
        console.error(err);
      }
    },
    [steammClient, appData],
  );

  const hasFetchedRefreshedPoolMapRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (existingPool === undefined) return;

    if (hasFetchedRefreshedPoolMapRef.current[existingPool.id]) return;
    hasFetchedRefreshedPoolMapRef.current[existingPool.id] = true;

    fetchRefreshedPool(existingPool);
  }, [existingPool, fetchRefreshedPool]);

  // Pool
  const pool = useMemo(
    () => refreshedPoolMap[poolId] ?? existingPool,
    [refreshedPoolMap, poolId, existingPool],
  );

  useEffect(() => {
    if (pool === undefined) router.replace(ROOT_URL); // Redirect to Home page if poolId is not valid
  }, [pool, router]);

  // Context
  const contextValue: PoolContext = useMemo(
    () => ({
      pool: pool as ParsedPool,
      fetchRefreshedPool,
    }),
    [pool, fetchRefreshedPool],
  );

  if (pool === undefined) return null; // Display nothing while redirecting to Home page
  return (
    <PoolContext.Provider value={contextValue}>{children}</PoolContext.Provider>
  );
}
