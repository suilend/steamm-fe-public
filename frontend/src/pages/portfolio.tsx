import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import * as Sentry from "@sentry/nextjs";
import BigNumber from "bignumber.js";
import { Loader2 } from "lucide-react";

import {
  NORMALIZED_STEAMM_POINTS_COINTYPE,
  formatPercent,
  formatPoints,
  formatToken,
  formatUsd,
  getToken,
  isSteammPoints,
} from "@suilend/frontend-sui";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import {
  ClaimRewardsReward,
  RewardSummary,
  Side,
  getFilteredRewards,
  getStakingYieldAprPercent,
} from "@suilend/sdk";

import Divider from "@/components/Divider";
import PoolPositionsTable from "@/components/positions/PoolPositionsTable";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { useLoadedUserContext } from "@/contexts/UserContext";
import { getTotalAprPercent } from "@/lib/liquidityMining";
import { API_URL } from "@/lib/navigation";
import {
  getIndexOfObligationWithDeposit,
  getObligationDepositedAmount,
} from "@/lib/obligation";
import { showSuccessTxnToast } from "@/lib/toasts";
import {
  HistoryDeposit,
  HistoryRedeem,
  HistoryTransactionType,
  PoolPosition,
} from "@/lib/types";

export default function PortfolioPage() {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData, lstData } = useLoadedAppContext();
  const { getBalance, userData, refresh } = useLoadedUserContext();
  const { poolStats } = useStatsContext();

  // Pools - rewards (across all obligations)
  const poolRewardsMap: Record<string, Record<string, BigNumber>> = useMemo(
    () =>
      appData.pools.reduce(
        (acc, pool) => ({
          ...acc,
          [pool.lpTokenType]: (
            userData.rewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? []
          ).reduce(
            (acc2, r) => {
              for (let i = 0; i < userData.obligations.length; i++) {
                const obligation = userData.obligations[i];

                const minAmount = 10 ** (-1 * r.stats.mintDecimals);
                if (
                  !r.obligationClaims[obligation.id] ||
                  r.obligationClaims[obligation.id].claimableAmount.lt(
                    minAmount,
                  ) // This also covers the 0 case
                )
                  continue;

                acc2[r.stats.rewardCoinType] = new BigNumber(
                  acc2[r.stats.rewardCoinType] ?? 0,
                ).plus(r.obligationClaims[obligation.id].claimableAmount);
              }

              return acc2;
            },
            {} as Record<string, BigNumber>,
          ),
        }),
        {} as Record<string, Record<string, BigNumber>>,
      ),
    [appData.pools, userData.obligations, userData.rewardMap],
  );

  // Positions
  const positions: PoolPosition[] | undefined = useMemo(
    () =>
      appData.pools
        .map((pool) => {
          const obligationIndex = getIndexOfObligationWithDeposit(
            userData.obligations,
            pool.lpTokenType,
          ); // Assumes up to one obligation has deposits of the LP token type

          const balance = getBalance(pool.lpTokenType);
          const depositedAmount = getObligationDepositedAmount(
            userData.obligations[obligationIndex],
            pool.lpTokenType,
          );
          const totalAmount = balance.plus(depositedAmount);

          // Same code as in frontend/src/components/AprBreakdown.tsx
          const rewards =
            userData.rewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? [];
          const filteredRewards = getFilteredRewards(rewards);

          const stakingYieldAprPercent: BigNumber | undefined =
            lstData !== undefined
              ? pool.tvlUsd.gt(0)
                ? pool.coinTypes
                    .reduce(
                      (acc, coinType, index) =>
                        acc.plus(
                          new BigNumber(
                            getStakingYieldAprPercent(
                              Side.DEPOSIT,
                              coinType,
                              lstData.aprPercentMap,
                            ) ?? 0,
                          ).times(
                            pool.prices[index].times(pool.balances[index]),
                          ),
                        ),
                      new BigNumber(0),
                    )
                    .div(pool.tvlUsd)
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
            deposited: undefined, // Fetched below (BE)
            depositedUsd: undefined, // Fetched below (BE)
            balances: undefined, // Fetched below (on-chain)
            balanceUsd: undefined, // Fetched below (on-chain)
            stakedPercent: depositedAmount.div(totalAmount).times(100),
            claimableRewards: Object.fromEntries(
              Object.entries(poolRewardsMap[pool.lpTokenType] ?? {}).filter(
                ([coinType, amount]) => !isSteammPoints(coinType),
              ),
            ),
            points:
              poolRewardsMap[pool.lpTokenType]?.[
                NORMALIZED_STEAMM_POINTS_COINTYPE
              ] ?? new BigNumber(0),
          };
        })
        .filter(Boolean) as PoolPosition[],
    [
      appData.pools,
      getBalance,
      userData.obligations,
      userData.rewardMap,
      lstData,
      poolStats.aprPercent_24h,
      poolRewardsMap,
    ],
  );

  // Positions - Deposited (BE)
  const [poolDepositedMapMap, setPoolDepositedMapMap] = useState<
    Record<
      string,
      Record<string, { a: BigNumber; b: BigNumber; usd: BigNumber }>
    >
  >({});
  const poolDepositedMap = useMemo(
    () => (!address ? {} : poolDepositedMapMap[address]),
    [address, poolDepositedMapMap],
  );

  const fetchPoolDepositedMap = useCallback(async () => {
    try {
      const result: Record<
        string,
        { a: BigNumber; b: BigNumber; usd: BigNumber }
      > = {};

      const transactionHistories = await Promise.all(
        positions!.map((position) =>
          (async () => {
            const res = await fetch(
              `${API_URL}/steamm/historical/lp?${new URLSearchParams({
                user: address!, // Checked in useEffect below
                poolId: position.pool.id,
              })}`,
            );
            const json: {
              deposits: Omit<HistoryDeposit, "type">[];
              redeems: Omit<HistoryRedeem, "type">[];
            } = await res.json();
            if ((json as any)?.statusCode === 500) return;

            return [
              ...(json.deposits.map((entry) => ({
                ...entry,
                type: HistoryTransactionType.DEPOSIT,
              })) as HistoryDeposit[]),
              ...(json.redeems.map((entry) => ({
                ...entry,
                type: HistoryTransactionType.REDEEM,
              })) as HistoryRedeem[]),
            ].sort((a, b) => +b.timestamp - +a.timestamp);
          })(),
        ),
      );

      for (let i = 0; i < positions!.length; i++) {
        const pool = positions![i].pool;

        const transactionHistory = transactionHistories[i];
        if (!transactionHistory) continue;

        const depositedA = transactionHistory.reduce(
          (acc, entry) =>
            entry.type === HistoryTransactionType.DEPOSIT
              ? acc.plus(
                  new BigNumber(entry.deposit_a).div(
                    10 ** appData.coinMetadataMap[pool.coinTypes[0]].decimals,
                  ),
                )
              : acc.minus(
                  new BigNumber(entry.withdraw_a).div(
                    10 ** appData.coinMetadataMap[pool.coinTypes[0]].decimals,
                  ),
                ),
          new BigNumber(0),
        );
        const depositedB = transactionHistory.reduce(
          (acc, entry) =>
            entry.type === HistoryTransactionType.DEPOSIT
              ? acc.plus(
                  new BigNumber(entry.deposit_b).div(
                    10 ** appData.coinMetadataMap[pool.coinTypes[1]].decimals,
                  ),
                )
              : acc.minus(
                  new BigNumber(entry.withdraw_b).div(
                    10 ** appData.coinMetadataMap[pool.coinTypes[1]].decimals,
                  ),
                ),
          new BigNumber(0),
        );

        result[pool.id] = {
          a: depositedA,
          b: depositedB,
          usd: new BigNumber(depositedA.times(pool.prices[0])).plus(
            depositedB.times(pool.prices[1]),
          ),
        };
      }

      setPoolDepositedMapMap((prev) => ({
        ...prev,
        [address!]: result,
      }));
    } catch (err) {
      showErrorToast("Failed to fetch pool deposits", err as Error);
      console.error(err);
      Sentry.captureException(err);
    }
  }, [positions, appData.coinMetadataMap, address]);

  const hasFetchedPoolDepositedMapMapRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (!address) return;
    if (positions === undefined) return;

    if (!hasFetchedPoolDepositedMapMapRef.current[address])
      hasFetchedPoolDepositedMapMapRef.current[address] = true;

    fetchPoolDepositedMap();
  }, [address, positions, fetchPoolDepositedMap]);

  // Positions - Balances (on-chain)
  const [poolBalancesMapMap, setPoolBalancesMap] = useState<
    Record<
      string,
      Record<string, { a: BigNumber; b: BigNumber; usd: BigNumber }>
    >
  >({});
  const poolBalancesMap = useMemo(
    () => (!address ? {} : poolBalancesMapMap[address]),
    [address, poolBalancesMapMap],
  );

  const fetchPoolBalancesMap = useCallback(async () => {
    try {
      const result: Record<
        string,
        { a: BigNumber; b: BigNumber; usd: BigNumber }
      > = {};

      const redeemQuotes = await Promise.all(
        positions.map((position) => {
          const obligationIndex = getIndexOfObligationWithDeposit(
            userData.obligations,
            position.pool.lpTokenType,
          ); // Assumes up to one obligation has deposits of the LP token type

          const balance = getBalance(position.pool.lpTokenType);
          const depositedAmount = getObligationDepositedAmount(
            userData.obligations[obligationIndex],
            position.pool.lpTokenType,
          );
          const totalAmount = balance.plus(depositedAmount);

          return steammClient.Pool.quoteRedeem({
            lpTokens: BigInt(
              totalAmount
                .times(
                  10 **
                    appData.coinMetadataMap[position.pool.lpTokenType].decimals,
                )
                .integerValue(BigNumber.ROUND_DOWN)
                .toString(),
            ),
            poolInfo: position.pool.poolInfo,
            bankInfoA: appData.bankMap[position.pool.coinTypes[0]].bankInfo,
            bankInfoB: appData.bankMap[position.pool.coinTypes[1]].bankInfo,
          });
        }),
      );

      for (let i = 0; i < positions.length; i++) {
        const pool = positions[i].pool;

        const balanceA = new BigNumber(
          redeemQuotes[i].withdrawA.toString(),
        ).div(10 ** appData.coinMetadataMap[pool.coinTypes[0]].decimals);
        const balanceB = new BigNumber(
          redeemQuotes[i].withdrawB.toString(),
        ).div(10 ** appData.coinMetadataMap[pool.coinTypes[1]].decimals);

        result[pool.id] = {
          a: balanceA,
          b: balanceB,
          usd: new BigNumber(balanceA.times(pool.prices[0])).plus(
            balanceB.times(pool.prices[1]),
          ),
        };
      }

      setPoolBalancesMap((prev) => ({
        ...prev,
        [address!]: result,
      }));
    } catch (err) {
      showErrorToast("Failed to fetch pool balances", err as Error);
      console.error(err);
      Sentry.captureException(err);
    }
  }, [
    positions,
    getBalance,
    userData.obligations,
    steammClient,
    appData.coinMetadataMap,
    appData.bankMap,
    address,
  ]);

  const hasFetchedPoolBalancesMapMapRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (!address) return;

    if (!hasFetchedPoolBalancesMapMapRef.current[address])
      hasFetchedPoolBalancesMapMapRef.current[address] = true;

    fetchPoolBalancesMap();
  }, [address, fetchPoolBalancesMap]);

  // Positions - Extra data
  const positionsWithExtraData: PoolPosition[] | undefined = useMemo(
    () =>
      positions === undefined
        ? undefined
        : positions.map((position) => ({
            ...position,
            deposited:
              poolDepositedMap?.[position.pool.id] !== undefined
                ? [
                    poolDepositedMap[position.pool.id].a,
                    poolDepositedMap[position.pool.id].b,
                  ]
                : undefined,
            depositedUsd:
              poolDepositedMap?.[position.pool.id] !== undefined
                ? poolDepositedMap[position.pool.id].usd
                : undefined,
            balances:
              poolBalancesMap?.[position.pool.id] !== undefined
                ? [
                    poolBalancesMap[position.pool.id].a,
                    poolBalancesMap[position.pool.id].b,
                  ]
                : undefined,
            balanceUsd:
              poolBalancesMap?.[position.pool.id] !== undefined
                ? poolBalancesMap[position.pool.id].usd
                : undefined,
          })),
    [positions, poolDepositedMap, poolBalancesMap],
  );

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
      Object.entries(poolRewardsMap).reduce(
        (acc, [, rewards]) => {
          Object.entries(rewards).forEach(([coinType, amount]) => {
            if (isSteammPoints(coinType)) return;
            acc[coinType] = new BigNumber(acc[coinType] ?? 0).plus(amount);
          });

          return acc;
        },
        {} as Record<string, BigNumber>,
      ),
    [poolRewardsMap],
  );

  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  const onClaimRewardsClick = async () => {
    try {
      if (isClaiming) return;
      if (!address) throw Error("Wallet not connected");

      setIsClaiming(true);

      const transaction = new Transaction();

      for (let i = 0; i < userData.obligations.length; i++) {
        const obligationOwnerCap = userData.obligationOwnerCaps[i];
        const obligation = userData.obligations[i];
        if (!obligationOwnerCap || !obligation)
          throw Error("Obligation not found");

        const rewardsMap: Record<string, RewardSummary[]> = {};
        Object.values(userData.rewardMap).flatMap((rewards) =>
          rewards.deposit.forEach((r) => {
            if (isSteammPoints(r.stats.rewardCoinType)) return;

            const minAmount = 10 ** (-1 * r.stats.mintDecimals);
            if (
              !r.obligationClaims[obligation.id] ||
              r.obligationClaims[obligation.id].claimableAmount.lt(minAmount) // This also covers the 0 case
            )
              return;

            if (!rewardsMap[r.stats.rewardCoinType])
              rewardsMap[r.stats.rewardCoinType] = [];
            rewardsMap[r.stats.rewardCoinType].push(r);
          }),
        );

        const rewards: ClaimRewardsReward[] = Object.values(rewardsMap)
          .flat()
          .map((r) => ({
            reserveArrayIndex:
              r.obligationClaims[obligation.id].reserveArrayIndex,
            rewardIndex: BigInt(r.stats.rewardIndex),
            rewardCoinType: r.stats.rewardCoinType,
            side: Side.DEPOSIT,
          }));

        appData.lm.suilendClient.claimRewardsAndSendToUser(
          address,
          obligationOwnerCap.id,
          rewards,
          transaction,
        );
      }

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Claimed rewards", txUrl);
    } catch (err) {
      showErrorToast("Failed to claim rewards", err as Error, undefined, true);
      console.error(err);
      Sentry.captureException(err);
    } finally {
      setIsClaiming(false);
      refresh();
    }
  };

  // Summary - Points
  const points: BigNumber | undefined = useMemo(
    () =>
      Object.entries(poolRewardsMap).reduce((acc, [, rewards]) => {
        Object.entries(rewards).forEach(([coinType, amount]) => {
          if (!isSteammPoints(coinType)) return;
          acc = acc.plus(amount);
        });

        return acc;
      }, new BigNumber(0)),
    [poolRewardsMap],
  );

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

            {/* Claimable rewards */}
            <div className="max-md:w-full max-md:border-r md:flex-1">
              <div className="flex w-full flex-col gap-1 p-5">
                <p className="text-p2 text-secondary-foreground">
                  Claimable rewards
                </p>

                {claimableRewards === undefined ? (
                  <Skeleton className="h-[30px] w-20" />
                ) : (
                  <>
                    {Object.keys(claimableRewards).length > 0 ? (
                      <div className="flex min-h-[30px] flex-row flex-wrap items-center gap-3">
                        <Tooltip
                          content={
                            <div className="flex flex-col gap-1">
                              {Object.entries(claimableRewards).map(
                                ([coinType, amount]) => {
                                  const coinMetadata =
                                    appData.coinMetadataMap[coinType];

                                  return (
                                    <div
                                      key={coinType}
                                      className="flex flex-row items-center gap-2"
                                    >
                                      <TokenLogo
                                        token={getToken(coinType, coinMetadata)}
                                        size={16}
                                      />
                                      <p className="text-p2 text-foreground">
                                        {formatToken(amount, {
                                          dp: coinMetadata.decimals,
                                        })}{" "}
                                        {coinMetadata.symbol}
                                      </p>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          }
                        >
                          <div className="flex h-[24px] w-max flex-row items-center">
                            <TokenLogos
                              coinTypes={Object.keys(claimableRewards)}
                              size={20}
                            />
                          </div>
                        </Tooltip>

                        <button
                          className="flex h-6 w-[48px] flex-row items-center justify-center rounded-md bg-button-1 px-2 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
                          disabled={isClaiming}
                          onClick={onClaimRewardsClick}
                        >
                          {isClaiming ? (
                            <Loader2 className="h-4 w-4 animate-spin text-button-1-foreground" />
                          ) : (
                            <p className="text-p3 text-button-1-foreground">
                              Claim
                            </p>
                          )}
                        </button>
                      </div>
                    ) : (
                      <p className="text-h3 text-foreground">--</p>
                    )}
                  </>
                )}
              </div>
            </div>

            <Divider className="h-auto w-px max-md:hidden" />

            {/* Points */}
            <div className="max-md:w-full md:flex-1">
              <div className="flex w-full flex-col gap-1 p-5">
                <p className="text-p2 text-secondary-foreground">Points</p>

                {points === undefined ? (
                  <Skeleton className="h-[30px] w-20" />
                ) : (
                  <Tooltip
                    title={`${formatPoints(points, { dp: appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE].decimals })} ${appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE].symbol}`}
                  >
                    <div className="flex w-max flex-row items-center gap-2">
                      <TokenLogo
                        token={getToken(
                          NORMALIZED_STEAMM_POINTS_COINTYPE,
                          appData.coinMetadataMap[
                            NORMALIZED_STEAMM_POINTS_COINTYPE
                          ],
                        )}
                        size={20}
                      />
                      <p className="text-h3 text-foreground">
                        {formatPoints(points)}
                      </p>
                    </div>
                  </Tooltip>
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
