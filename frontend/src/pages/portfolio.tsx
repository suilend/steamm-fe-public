import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import * as Sentry from "@sentry/nextjs";
import BigNumber from "bignumber.js";

import { formatPercent, formatUsd } from "@suilend/frontend-sui";
import { showErrorToast } from "@suilend/frontend-sui-next";
import {
  Side,
  getFilteredRewards,
  getStakingYieldAprPercent,
} from "@suilend/sdk";

import Divider from "@/components/Divider";
import PoolPositionsTable from "@/components/positions/PoolPositionsTable";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { useLoadedUserContext } from "@/contexts/UserContext";
import { getTotalAprPercent } from "@/lib/liquidityMining";
import { PoolPosition } from "@/lib/types";

export default function PortfolioPage() {
  const { steammClient, appData, lstData } = useLoadedAppContext();
  const { getBalance, userData } = useLoadedUserContext();
  const { poolStats } = useStatsContext();

  // Pool LP token balances
  const poolLpTokenBalanceMap = useMemo(
    () =>
      appData.pools.reduce(
        (acc, pool) => ({ ...acc, [pool.id]: getBalance(pool.lpTokenType) }),
        {} as Record<string, BigNumber>,
      ),
    [appData.pools, getBalance],
  );

  // Positions
  const positions: PoolPosition[] | undefined = useMemo(
    () =>
      appData.pools
        .map((pool) => {
          const balance = poolLpTokenBalanceMap[pool.id] ?? new BigNumber(0);
          const depositedAmount = userData.obligations.reduce(
            (acc, o) =>
              acc.plus(
                o.deposits.find((d) => d.coinType === pool.lpTokenType)
                  ?.depositedAmount ?? 0,
              ),
            new BigNumber(0),
          ); // Handles multiple obligations (there should be only one)
          const totalAmount = balance.plus(depositedAmount);

          // Same code as in frontend/src/components/AprBreakdown.tsx
          const rewards =
            userData.rewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? [];
          const filteredRewards = getFilteredRewards(rewards);

          const stakingYieldAprPercent: BigNumber | undefined =
            lstData !== undefined
              ? appData.lm.reserveMap[pool.lpTokenType] !== undefined
                ? (getStakingYieldAprPercent(
                    Side.DEPOSIT,
                    appData.lm.reserveMap[pool.lpTokenType],
                    lstData.aprPercentMap,
                  ) ?? new BigNumber(0))
                : new BigNumber(0)
              : undefined;

          const totalAprPercent: BigNumber | undefined =
            poolStats.aprPercent_24h[pool.id] !== undefined &&
            stakingYieldAprPercent !== undefined
              ? getTotalAprPercent(
                  poolStats.aprPercent_24h[pool.id].feesAprPercent,
                  pool.suilendWeightedAverageDepositAprPercent,
                  filteredRewards,
                  stakingYieldAprPercent,
                )
              : undefined;

          if (balance.eq(0) && depositedAmount.eq(0)) return undefined;
          return {
            pool: {
              ...pool,
              aprPercent_24h: totalAprPercent,
            },
            balanceUsd: undefined, // Fetched below
            stakedPercent: depositedAmount.div(totalAmount).times(100),
            claimableRewards: {}, // TODO
          };
        })
        .filter(Boolean) as PoolPosition[],
    [
      appData.pools,
      poolLpTokenBalanceMap,
      userData.obligations,
      userData.rewardMap,
      lstData,
      appData.lm.reserveMap,
      poolStats.aprPercent_24h,
    ],
  );

  // Positions - Balances in USD (on-chain)
  const [poolBalancesUsd, setPoolBalancesUsd] = useState<
    Record<string, BigNumber>
  >({});

  useEffect(() => {
    if (positions === undefined) return;

    (async () => {
      try {
        const result: Record<string, BigNumber> = {};

        const redeemQuotes = await Promise.all(
          positions.map((position) => {
            const balance =
              poolLpTokenBalanceMap[position.pool.id] ?? new BigNumber(0);
            const depositedAmount = userData.obligations.reduce(
              (acc, o) =>
                acc.plus(
                  o.deposits.find(
                    (d) => d.coinType === position.pool.lpTokenType,
                  )?.depositedAmount ?? 0,
                ),
              new BigNumber(0),
            ); // Handles multiple obligations (there should be only one)
            const totalAmount = balance.plus(depositedAmount);

            return steammClient.Pool.quoteRedeem({
              pool: position.pool.id,
              lpTokens: BigInt(
                totalAmount
                  .times(
                    10 **
                      appData.coinMetadataMap[position.pool.lpTokenType]
                        .decimals,
                  )
                  .integerValue(BigNumber.ROUND_DOWN)
                  .toString(),
              ),
            });
          }),
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
  }, [
    positions,
    poolLpTokenBalanceMap,
    userData.obligations,
    steammClient,
    appData.coinMetadataMap,
  ]);

  const positionsWithExtraData: PoolPosition[] | undefined = useMemo(
    () =>
      positions === undefined
        ? undefined
        : positions.map((position) => ({
            ...position,
            balanceUsd: poolBalancesUsd[position.pool.id],
          })),
    [positions, poolBalancesUsd],
  );

  // Positions - depositedAmountUsd (backend)

  // Positions - PnL (backend)

  // Summary
  // Summary - Net worth
  const netWorthUsd: BigNumber | undefined = useMemo(
    () =>
      positionsWithExtraData === undefined ||
      positionsWithExtraData.some(
        (position) => position.balanceUsd === undefined,
      )
        ? undefined
        : positionsWithExtraData.reduce(
            (sum, position) => sum.plus(position.balanceUsd as BigNumber),
            new BigNumber(0),
          ),
    [positionsWithExtraData],
  );

  // Summary - APR
  const weightedAverageAprPercent: BigNumber | undefined = useMemo(
    () =>
      positionsWithExtraData === undefined ||
      positionsWithExtraData.some(
        (position) =>
          position.pool.aprPercent_24h === undefined ||
          position.balanceUsd === undefined,
      )
        ? undefined
        : positionsWithExtraData
            .reduce(
              (acc, position) =>
                acc.plus(
                  (position.balanceUsd as BigNumber).times(
                    position.pool.aprPercent_24h as BigNumber,
                  ),
                ),
              new BigNumber(0),
            )
            .div(
              positionsWithExtraData.length > 0
                ? positionsWithExtraData.reduce(
                    (sum, position) =>
                      sum.plus(position.balanceUsd as BigNumber),
                    new BigNumber(0),
                  )
                : 1,
            ),
    [positionsWithExtraData],
  );

  // Summary - Rewards
  const claimableRewards: Record<string, BigNumber> | undefined = useMemo(
    () =>
      positionsWithExtraData === undefined
        ? undefined
        : positionsWithExtraData.reduce(
            (acc, position) => {
              Object.entries(position.claimableRewards).forEach(
                ([coinType, amount]) => {
                  if (acc[coinType]) acc[coinType] = acc[coinType].plus(amount);
                  else acc[coinType] = amount;
                },
              );

              return acc;
            },
            {} as Record<string, BigNumber>,
          ),
    [positionsWithExtraData],
  );

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
            <div className="max-md:w-full md:flex-1">
              <div className="flex w-full flex-col gap-1 p-5">
                <p className="text-p2 text-secondary-foreground">
                  Claimable rewards
                </p>

                {claimableRewards === undefined ? (
                  <Skeleton className="h-[30px] w-20" />
                ) : (
                  <>
                    {Object.keys(claimableRewards).length > 0 ? (
                      <div className="flex h-[30px] flex-row items-center gap-3">
                        <TokenLogos
                          coinTypes={Object.keys(claimableRewards)}
                          size={16}
                        />
                        <button
                          className="flex h-6 flex-row items-center rounded-md bg-button-1 px-2 transition-colors hover:bg-button-1/80"
                          onClick={onClaimRewardsClick}
                        >
                          <p className="text-p3 text-button-1-foreground">
                            Claim
                          </p>
                        </button>
                      </div>
                    ) : (
                      <p className="text-h3 text-foreground">--</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Positions */}
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-row items-center gap-3">
            <h2 className="text-h3 text-foreground">Positions</h2>
            {positionsWithExtraData === undefined ? (
              <Skeleton className="h-[22px] w-12" />
            ) : (
              <Tag>{positionsWithExtraData.length}</Tag>
            )}
          </div>

          <PoolPositionsTable positions={positionsWithExtraData} />
        </div>
      </div>
    </>
  );
}
