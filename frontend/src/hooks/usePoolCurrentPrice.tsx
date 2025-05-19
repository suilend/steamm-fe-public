import { useCallback, useEffect, useRef, useState } from "react";

import * as Sentry from "@sentry/nextjs";
import { BigNumber } from "bignumber.js";

import { showErrorToast } from "@suilend/frontend-sui-next";
import { QuoterId, SwapQuote } from "@suilend/steamm-sdk";
import { OracleQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm/structs";
import { OracleQuoterV2 } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm_v2/structs";

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
              let quote: SwapQuote;
              if (pool.quoterId === QuoterId.CPMM) {
                // New tokens launched on STEAMM (CPMM with offset, 0 quote assets)
                if (pool.balances[1].eq(0)) {
                  quote = {
                    a2b: true,
                    amountIn: BigInt(
                      new BigNumber(1)
                        .times(
                          10 **
                            appData.coinMetadataMap[pool.coinTypes[0]].decimals,
                        )
                        .integerValue(BigNumber.ROUND_DOWN)
                        .toString(),
                    ),
                    amountOut: BigInt(
                      BigNumber(pool.prices[0].div(pool.prices[1]))
                        .times(
                          10 **
                            appData.coinMetadataMap[pool.coinTypes[1]].decimals,
                        )
                        .integerValue(BigNumber.ROUND_DOWN)
                        .toString(),
                    ),
                    outputFees: {
                      poolFees: BigInt(0),
                      protocolFees: BigInt(0),
                    },
                  };
                } else {
                  const submitAmountA = new BigNumber(
                    new BigNumber(1).div(pool.prices[0]),
                  ) // $1 of asset A (assuming the pool is arb'd, in practice it should be very close to arb'd)
                    .times(
                      10 ** appData.coinMetadataMap[pool.coinTypes[0]].decimals,
                    )
                    .integerValue(BigNumber.ROUND_DOWN)
                    .toString();

                  quote = await steammClient.Pool.quoteSwap({
                    a2b: true,
                    amountIn: BigInt(submitAmountA),
                    poolInfo: pool.poolInfo,
                    bankInfoA: appData.bankMap[pool.coinTypes[0]].bankInfo,
                    bankInfoB: appData.bankMap[pool.coinTypes[1]].bankInfo,
                  });
                }
              } else {
                const getOraclePrice = (index: number): BigNumber => {
                  const quoter = pool.pool.quoter as
                    | OracleQuoter
                    | OracleQuoterV2;
                  const oracleIndex = +(
                    index === 0 ? quoter.oracleIndexA : quoter.oracleIndexB
                  ).toString();

                  return appData.oracleIndexOracleInfoPriceMap[oracleIndex]
                    .price;
                };

                quote = {
                  a2b: true,
                  amountIn: BigInt(
                    getOraclePrice(1)
                      .times(
                        10 **
                          appData.coinMetadataMap[pool.coinTypes[0]].decimals,
                      )
                      .integerValue(BigNumber.ROUND_DOWN)
                      .toString(),
                  ),
                  amountOut: BigInt(
                    getOraclePrice(0)
                      .times(
                        10 **
                          appData.coinMetadataMap[pool.coinTypes[1]].decimals,
                      )
                      .integerValue(BigNumber.ROUND_DOWN)
                      .toString(),
                  ),
                  outputFees: {
                    poolFees: BigInt(0),
                    protocolFees: BigInt(0),
                  },
                };
              }

              setPoolCurrentPriceQuoteMap((prev) => ({
                ...prev,
                [pool.id]: quote,
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
      appData.oracleIndexOracleInfoPriceMap,
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
