import { useCallback, useEffect, useRef, useState } from "react";

import * as Sentry from "@sentry/nextjs";
import { BigNumber } from "bignumber.js";

import { showErrorToast } from "@suilend/frontend-sui-next";
import { QuoterId, SwapQuote } from "@suilend/steamm-sdk";

import { useLoadedAppContext } from "@/contexts/AppContext";

const usePoolCurrentPriceQuote = (poolIds: string[] | undefined) => {
  const { steammClient, appData } = useLoadedAppContext();

  const [poolCurrentPriceQuoteMap, setPoolCurrentPriceQuoteMap] = useState<
    Record<string, SwapQuote>
  >({});

  const fetchPoolCurrentPriceQuote = useCallback(
    async (_poolIds: string[]) => {
      const pools = appData.pools.filter((pool) => _poolIds.includes(pool.id));

      try {
        await Promise.all(
          pools.map((pool) =>
            (async () => {
              const hasNoQuoteAssets =
                pool.quoterId === QuoterId.CPMM && pool.balances[1].eq(0); // New tokens launched on STEAMM (CPMM with offset, 0 quote assets)

              const submitAmount = (
                hasNoQuoteAssets
                  ? new BigNumber(1).div(pool.prices[1]) // $1 of quote token
                  : BigNumber.min(
                      pool.balances[0].times(0.1), // 10% of pool balanceA
                      new BigNumber(1).div(pool.prices[0]), // $1 of base token
                    )
              )
                .times(
                  10 **
                    appData.coinMetadataMap[
                      pool.coinTypes[hasNoQuoteAssets ? 1 : 0]
                    ].decimals,
                )
                .integerValue(BigNumber.ROUND_DOWN)
                .toString();

              const swapQuote = await steammClient.Pool.quoteSwap({
                a2b: !hasNoQuoteAssets,
                amountIn: BigInt(submitAmount),
                poolInfo: pool.poolInfo,
                bankInfoA: appData.bankMap[pool.coinTypes[0]].bankInfo,
                bankInfoB: appData.bankMap[pool.coinTypes[1]].bankInfo,
              });
              if (hasNoQuoteAssets) {
                const amountIn = swapQuote.amountIn;
                const amountOut = swapQuote.amountOut;

                swapQuote.a2b = true;
                swapQuote.amountIn = amountOut;
                swapQuote.amountOut = amountIn;
              }

              setPoolCurrentPriceQuoteMap((prev) => ({
                ...prev,
                [pool.id]: swapQuote,
              }));
            })(),
          ),
        );
      } catch (err) {
        showErrorToast(
          "Failed to fetch pool current price quote",
          err as Error,
        );
        console.error(err);
        Sentry.captureException(err);
      }
    },
    [
      appData.pools,
      appData.coinMetadataMap,
      steammClient.Pool,
      appData.bankMap,
    ],
  );

  const hasFetchedPoolCurrentPriceQuoteRef = useRef<Record<string, boolean>>(
    {},
  );
  useEffect(() => {
    if (poolIds === undefined) return;

    const filteredPoolIds = poolIds.filter(
      (poolId) => !hasFetchedPoolCurrentPriceQuoteRef.current[poolId],
    );
    if (filteredPoolIds.length === 0) return;

    for (const poolId of filteredPoolIds)
      hasFetchedPoolCurrentPriceQuoteRef.current[poolId] = true;

    fetchPoolCurrentPriceQuote(filteredPoolIds);
  }, [poolIds, fetchPoolCurrentPriceQuote]);

  return { poolCurrentPriceQuoteMap, fetchPoolCurrentPriceQuote };
};

export default usePoolCurrentPriceQuote;
