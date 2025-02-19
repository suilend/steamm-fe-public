import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import * as Sentry from "@sentry/nextjs";
import BigNumber from "bignumber.js";

import { formatPercent, formatUsd } from "@suilend/frontend-sui";
import { showErrorToast } from "@suilend/frontend-sui-next";

import Divider from "@/components/Divider";
import PoolPositionsTable from "@/components/positions/PoolPositionsTable";
import Tag from "@/components/Tag";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import useFetchObligations from "@/fetchers/useFetchObligations";
import { PoolPosition } from "@/lib/types";

export default function PortfolioPage() {
  const {
    steammClient,
    appData,
    rawBalancesMap,
    balancesCoinMetadataMap,
    getBalance,
  } = useLoadedAppContext();
  const { statsData } = useStatsContext();

  // LP token balances
  const lpTokenBalanceMap = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(rawBalancesMap ?? {})
          .filter((coinType) => balancesCoinMetadataMap?.[coinType])
          .filter((coinType) =>
            balancesCoinMetadataMap![coinType].name
              .toLowerCase()
              .includes("STEAMM LP".toLowerCase()),
          )
          .map((coinType) => [
            coinType,
            {
              coinMetadata: balancesCoinMetadataMap![coinType],
              balance: getBalance(coinType),
            },
          ]),
      ),
    [rawBalancesMap, balancesCoinMetadataMap, getBalance],
  );

  // Obligations
  const { data: obligationsData, mutateData: mutateObligationsData } =
    useFetchObligations();
  console.log("XXX obligationsData", obligationsData);

  // Positions
  const positions: PoolPosition[] = useMemo(
    () =>
      appData.pools
        .filter((pool) =>
          Object.keys(lpTokenBalanceMap).includes(pool.lpTokenType),
        )
        .map((pool) => ({
          pool: {
            ...pool,
            aprPercent_24h: statsData?.poolAprPercent_24h_map?.[pool.id],
          },
          balanceUsd: undefined, // Fetched below
          // depositedAmountUsd: undefined, // TODO
          // isStaked: false, // TODO - FETCH
          // claimableRewards: {
          //   [NORMALIZED_SUI_COINTYPE]: new BigNumber(5.1), // TODO
          //   [NORMALIZED_DEEP_COINTYPE]: new BigNumber(1.051), // TODO
          // }, // TODO - FETCH
          // pnl: {
          //   percent: undefined, // TODO
          //   amountUsd: undefined, // TODO
          // },
        })),
    [appData.pools, lpTokenBalanceMap, statsData?.poolAprPercent_24h_map],
  );

  // Positions - Balances in USD (on-chain)
  const [poolBalancesUsd, setPoolBalancesUsd] = useState<
    Record<string, BigNumber>
  >({});

  useEffect(() => {
    (async () => {
      try {
        const result: Record<string, BigNumber> = {};

        const redeemQuotes = await Promise.all(
          positions.map((position) =>
            steammClient.Pool.quoteRedeem({
              pool: position.pool.id,
              lpTokens: BigInt(
                lpTokenBalanceMap[position.pool.lpTokenType].balance
                  .times(
                    10 **
                      lpTokenBalanceMap[position.pool.lpTokenType].coinMetadata
                        .decimals,
                  )
                  .integerValue(BigNumber.ROUND_DOWN)
                  .toString(),
              ),
            }),
          ),
        );

        for (let i = 0; i < positions.length; i++) {
          const pool = positions[i].pool;

          const balanceUsdA = new BigNumber(
            redeemQuotes[i].withdrawA.toString(),
          )
            .div(10 ** appData.coinMetadataMap[pool.coinTypes[0]].decimals)
            .times(pool.prices[0]);
          const balanceUsdB = new BigNumber(
            redeemQuotes[i].withdrawB.toString(),
          )
            .div(10 ** appData.coinMetadataMap[pool.coinTypes[1]].decimals)
            .times(pool.prices[1]);

          result[pool.id] = balanceUsdA.plus(balanceUsdB);
        }

        setPoolBalancesUsd(result);
      } catch (err) {
        showErrorToast("Failed to fetch pool balances", err as Error);
        console.error(err);
        Sentry.captureException(err);
      }
    })();
  }, [positions, steammClient, lpTokenBalanceMap, appData.coinMetadataMap]);

  const positionsWithFetchedData = useMemo(
    () =>
      positions.map((position) => ({
        ...position,
        balanceUsd: poolBalancesUsd[position.pool.id],
      })),
    [positions, poolBalancesUsd],
  );

  // Positions - depositedAmountUsd (backend)

  // Positions - PnL (backend)

  // Summary
  const netWorthUsd: BigNumber | undefined = useMemo(
    () =>
      positionsWithFetchedData.some(
        (position) => position.balanceUsd === undefined,
      )
        ? undefined
        : positionsWithFetchedData.reduce(
            (sum, position) => sum.plus(position.balanceUsd),
            new BigNumber(0),
          ),
    [positionsWithFetchedData],
  );

  // const totalDepositedUsd = useMemo(
  //   () =>
  //     positionsWithFetchedData.some(
  //       (position) => position.depositedAmountUsd === undefined,
  //     )
  //       ? undefined
  //       : positionsWithFetchedData.reduce(
  //           (sum, position) =>
  //             sum.plus(position.depositedAmountUsd as BigNumber),
  //           new BigNumber(0),
  //         ),
  //   [positionsWithFetchedData],
  // );

  // const totalPnlUsd = useMemo(
  //   () =>
  //     positionsWithFetchedData.some(
  //       (position) => position.pnl.amountUsd === undefined,
  //     )
  //       ? undefined
  //       : positionsWithFetchedData.reduce(
  //           (sum, position) => sum.plus(position.pnl.amountUsd as BigNumber),
  //           new BigNumber(0),
  //         ),
  //   [positionsWithFetchedData],
  // );

  const weightedAverageAprPercent = useMemo(
    () =>
      positionsWithFetchedData.some(
        (position) =>
          position.pool.aprPercent_24h === undefined ||
          position.balanceUsd === undefined,
      )
        ? undefined
        : positionsWithFetchedData
            .reduce(
              (acc, position) =>
                acc.plus(
                  position.balanceUsd.times(position.pool.aprPercent_24h!),
                ),
              new BigNumber(0),
            )
            .div(
              positionsWithFetchedData.length > 0
                ? positionsWithFetchedData.reduce(
                    (sum, position) => sum.plus(position.balanceUsd),
                    new BigNumber(0),
                  )
                : 1,
            ),
    [positionsWithFetchedData],
  );

  // const claimableRewards = useMemo(
  //   () =>
  //     positionsWithFetchedData.reduce(
  //       (acc, position) => {
  //         Object.entries(position.claimableRewards).forEach(
  //           ([coinType, amount]) => {
  //             if (acc[coinType]) acc[coinType] = acc[coinType].plus(amount);
  //             else acc[coinType] = amount;
  //           },
  //         );

  //         return acc;
  //       },
  //       {} as Record<string, BigNumber>,
  //     ),
  //   [positionsWithFetchedData],
  // );

  // Summary - claim
  const onClaimRewardsClick = () => {};

  return (
    <>
      <Head>
        <title>STEAMM | Portfolio</title>
      </Head>

      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <h1 className="text-h1 text-foreground">Portfolio</h1>

          {/* Stats */}
          <div className="grid w-full grid-cols-2 rounded-md border md:flex md:flex-row md:items-stretch">
            {/* Net worth */}
            <div className="max-md:w-full max-md:border-b max-md:border-r md:flex-1">
              <div className="flex w-full flex-col gap-1 p-5">
                <p className="text-p2 text-secondary-foreground">Net worth</p>

                {netWorthUsd === undefined ? (
                  <Skeleton className="h-[30px] w-20" />
                ) : (
                  <Tooltip title={formatUsd(netWorthUsd, { exact: true })}>
                    <p className="w-max text-h3 text-foreground">
                      {formatUsd(netWorthUsd)}
                    </p>
                  </Tooltip>
                )}
              </div>
            </div>

            <Divider className="h-auto w-px max-md:hidden" />

            {/* Deposited */}
            {/* <div className="max-md:w-full max-md:border-b md:flex-1">
              <div className="flex w-full flex-col gap-1 p-5">
                <p className="text-p2 text-secondary-foreground">
                  Total deposited
                </p>

                {totalDepositedUsd === undefined ? (
                  <Skeleton className="h-[30px] w-20" />
                ) : (
                  <Tooltip
                    title={formatUsd(totalDepositedUsd, { exact: true })}
                  >
                    <p className="w-max text-h3 text-foreground">
                      {formatUsd(totalDepositedUsd)}
                    </p>
                  </Tooltip>
                )}
              </div>
            </div> */}

            {/* <Divider className="h-auto w-px max-md:hidden" /> */}

            {/* PnL */}
            {/* <div className="max-md:w-full max-md:border-b max-md:border-r md:flex-1">
              <div className="flex w-full flex-col gap-1 p-5">
                <p className="text-p2 text-secondary-foreground">Total PnL</p>

                {totalPnlUsd === undefined ? (
                  <Skeleton className="h-[30px] w-20" />
                ) : (
                  <Tooltip title={formatUsd(totalPnlUsd, { exact: true })}>
                    <p className="w-max text-h3 text-success">
                      {formatUsd(totalPnlUsd)}
                    </p>
                  </Tooltip>
                )}
              </div>
            </div> */}

            {/* <Divider className="h-auto w-px max-md:hidden" /> */}

            {/* APR */}
            <div className="max-md:w-full max-md:border-b md:flex-1">
              <div className="flex w-full flex-col gap-1 p-5">
                <p className="text-p2 text-secondary-foreground">Average APR</p>

                {weightedAverageAprPercent === undefined ? (
                  <Skeleton className="h-[30px] w-20" />
                ) : (
                  <p className="text-h3 text-success">
                    {formatPercent(weightedAverageAprPercent)}
                  </p>
                )}
              </div>
            </div>

            <Divider className="h-auto w-px max-md:hidden" />

            {/* Rewards */}
            {/* <div className="max-md:w-full md:flex-1">
              <div className="flex w-full flex-col gap-1 p-5">
                <p className="text-p2 text-secondary-foreground">
                  Claimable rewards
                </p>

                {Object.keys(claimableRewards).length > 0 ? (
                  <div className="flex h-[30px] flex-row items-center gap-3">
                    <TokenLogos
                      coinTypes={Object.keys(claimableRewards)}
                      size={20}
                    />

                    <button
                      className="flex h-6 flex-row items-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80"
                      onClick={onClaimRewardsClick}
                    >
                      <p className="text-p3 text-button-2-foreground">Claim</p>
                    </button>
                  </div>
                ) : (
                  <p className="text-h3 text-foreground">--</p>
                )}
              </div>
            </div> */}
          </div>
        </div>

        {/* Positions */}
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-row items-center gap-3">
            <h2 className="text-h3 text-foreground">Positions</h2>
            <Tag>{positions.length}</Tag>
          </div>

          <PoolPositionsTable positions={positionsWithFetchedData} />
        </div>
      </div>
    </>
  );
}
