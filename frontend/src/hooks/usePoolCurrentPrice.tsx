import { useCallback, useEffect, useRef, useState } from "react";

import * as Sentry from "@sentry/nextjs";
import { BigNumber } from "bignumber.js";

import { showErrorToast } from "@suilend/frontend-sui-next";
import { QuoterId, SwapQuote } from "@suilend/steamm-sdk";
import { CpQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/cpmm/structs";

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
              if (pool.tvlUsd.eq(0)) {
                setPoolCurrentPriceQuoteMap((prev) => ({
                  ...prev,
                  [pool.id]: {
                    a2b: true,
                    amountIn: BigInt(1),
                    amountOut: BigInt(0),
                    outputFees: {
                      protocolFees: BigInt(0),
                      poolFees: BigInt(0),
                    },
                  },
                }));
                return;
              }

              const isCpmmOffsetPool =
                pool.quoterId === QuoterId.CPMM &&
                (pool.pool.quoter as CpQuoter).offset.toString() !== "0"; // 0+ quote assets

              const submitAmount = (
                isCpmmOffsetPool
                  ? new BigNumber(1).div(pool.prices[1]) // $1 of quote token
                  : BigNumber.min(
                      pool.balances[0].times(0.1), // 10% of pool balanceA
                      new BigNumber(1).div(pool.prices[0]), // $1 of base token
                    )
              )
                .times(
                  10 **
                    appData.coinMetadataMap[
                      pool.coinTypes[isCpmmOffsetPool ? 1 : 0]
                    ].decimals,
                )
                .integerValue(BigNumber.ROUND_DOWN)
                .toString();

              const swapQuote = await steammClient.Pool.quoteSwap({
                a2b: !isCpmmOffsetPool,
                amountIn: BigInt(submitAmount),
                poolInfo: pool.poolInfo,
                bankInfoA: appData.bankMap[pool.coinTypes[0]].bankInfo,
                bankInfoB: appData.bankMap[pool.coinTypes[1]].bankInfo,
              });
              if (isCpmmOffsetPool) {
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
