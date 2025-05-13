import Head from "next/head";
import { useMemo, useState } from "react";

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
import { ClaimRewardsReward, RewardSummary, Side } from "@suilend/sdk";

import Divider from "@/components/Divider";
import TransactionHistoryTable from "@/components/pool/TransactionHistoryTable";
import PoolPositionsTable from "@/components/portfolio/PoolPositionsTable";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolPositionsContext } from "@/contexts/PoolPositionsContext";
import { useUserContext } from "@/contexts/UserContext";
import useGlobalTransactionHistory from "@/hooks/useGlobalTransactionHistory";
import usePoolTransactionHistoryMap from "@/hooks/usePoolTransactionHistoryMap";
import { showSuccessTxnToast } from "@/lib/toasts";
import { HistoryTransactionType, PoolPosition } from "@/lib/types";

export default function PortfolioPage() {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { appData } = useLoadedAppContext();
  const { userData, refresh } = useUserContext();
  const { poolPositions, totalPoints } = usePoolPositionsContext();

  // Pool positions - Deposited USD for PnL calc. (BE)
  const { poolTransactionHistoryMap } = usePoolTransactionHistoryMap(
    poolPositions === undefined
      ? undefined
      : poolPositions.map((position) => position.pool.id),
  );

  const poolDepositedAmountUsdMap: Record<string, BigNumber> | undefined =
    useMemo(() => {
      return poolTransactionHistoryMap === undefined
        ? undefined
        : Object.fromEntries(
            Object.entries(poolTransactionHistoryMap).reduce(
              (acc, [poolId, transactionHistory]) => {
                const pool = appData.pools.find((p) => p.id === poolId);
                if (!pool) return acc; // Should not happen

                const depositedAmountsUsd = [0, 1].map((index) =>
                  // transactionHistory[0] is undefined on beta
                  (transactionHistory[0] ?? []).reduce(
                    (acc, entry) =>
                      entry.type === HistoryTransactionType.DEPOSIT
                        ? acc.plus(
                            new BigNumber(
                              index === 0 ? entry.deposit_a : entry.deposit_b,
                            )
                              .div(
                                10 **
                                  appData.coinMetadataMap[pool.coinTypes[index]]
                                    .decimals,
                              )
                              .times(
                                index === 0
                                  ? (entry.coin_a_price ?? pool.prices[0]) // Use current price if coin_a_price is missing or 0
                                  : (entry.coin_b_price ?? pool.prices[1]), // Use current price if coin_b_price is missing or 0
                              ),
                          )
                        : entry.type === HistoryTransactionType.WITHDRAW
                          ? acc.minus(
                              new BigNumber(
                                index === 0
                                  ? entry.withdraw_a
                                  : entry.withdraw_b,
                              )
                                .div(
                                  10 **
                                    appData.coinMetadataMap[
                                      pool.coinTypes[index]
                                    ].decimals,
                                )
                                .times(
                                  index === 0
                                    ? (entry.coin_a_price ?? pool.prices[0]) // Use current price if coin_a_price is missing or 0
                                    : (entry.coin_b_price ?? pool.prices[1]), // Use current price if coin_b_price is missing or 0
                                ),
                            )
                          : acc, // Swap transactions have no effect on the deposited amount
                    new BigNumber(0),
                  ),
                );

                const depositedAmountUsd = depositedAmountsUsd[0].plus(
                  depositedAmountsUsd[1],
                );

                return [...acc, [poolId, depositedAmountUsd]];
              },
              [] as [string, BigNumber][],
            ),
          );
    }, [poolTransactionHistoryMap, appData.pools, appData.coinMetadataMap]);

  // Pool positions - Extra data
  const poolPositionsWithExtraData: PoolPosition[] | undefined = useMemo(
    () =>
      poolPositions === undefined
        ? undefined
        : poolPositions.map((position) => ({
            ...position,
            pnlPercent:
              poolDepositedAmountUsdMap?.[position.pool.id] !== undefined
                ? new BigNumber(
                    position.balanceUsd.minus(
                      poolDepositedAmountUsdMap[position.pool.id],
                    ),
                  )
                    .div(poolDepositedAmountUsdMap[position.pool.id])
                    .times(100)
                : undefined,
          })),
    [poolPositions, poolDepositedAmountUsdMap],
  );

  // Summary
  // Summary - Net worth
  const netWorthUsd: BigNumber | undefined = useMemo(
    () =>
      poolPositionsWithExtraData === undefined ||
      poolPositionsWithExtraData.some(
        (position) => position.balanceUsd === undefined,
      )
        ? undefined
        : poolPositionsWithExtraData.reduce(
            (sum, position) => sum.plus(position.balanceUsd as BigNumber),
            new BigNumber(0),
          ),
    [poolPositionsWithExtraData],
  );

  // Summary - APR
  const weightedAverageAprPercent: BigNumber | undefined = useMemo(
    () =>
      poolPositionsWithExtraData === undefined ||
      poolPositionsWithExtraData.some(
        (position) =>
          position.pool.aprPercent_24h === undefined ||
          position.balanceUsd === undefined,
      )
        ? undefined
        : poolPositionsWithExtraData
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
              poolPositionsWithExtraData.length > 0
                ? poolPositionsWithExtraData.reduce(
                    (sum, position) =>
                      sum.plus(position.balanceUsd as BigNumber),
                    new BigNumber(0),
                  )
                : 1,
            ),
    [poolPositionsWithExtraData],
  );

  // Summary - Rewards
  const claimableRewards: Record<string, BigNumber> | undefined = useMemo(
    () =>
      userData === undefined
        ? undefined
        : Object.entries(userData.poolRewardMap).reduce(
            (acc, [, rewards]) => {
              Object.entries(rewards).forEach(([coinType, amount]) => {
                if (isSteammPoints(coinType)) return;
                acc[coinType] = new BigNumber(acc[coinType] ?? 0).plus(amount);
              });

              return acc;
            },
            {} as Record<string, BigNumber>,
          ),
    [userData],
  );

  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  const onClaimRewardsClick = async () => {
    if (userData === undefined) return;

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

        appData.suilend.lmMarket.suilendClient.claimRewardsAndSendToUser(
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

  // Global transaction history
  const { globalTransactionHistory } = useGlobalTransactionHistory();

  const addressGlobalTransactionHistory = useMemo(
    () => (address ? globalTransactionHistory : []),
    [address, globalTransactionHistory],
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
                  <p className="text-h3 text-foreground">
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
                                ([coinType, amount]) => (
                                  <div
                                    key={coinType}
                                    className="flex flex-row items-center gap-2"
                                  >
                                    <TokenLogo
                                      token={getToken(
                                        coinType,
                                        appData.coinMetadataMap[coinType],
                                      )}
                                      size={16}
                                    />
                                    <p className="text-p2 text-foreground">
                                      {formatToken(amount, {
                                        dp: appData.coinMetadataMap[coinType]
                                          .decimals,
                                      })}{" "}
                                      {appData.coinMetadataMap[coinType].symbol}
                                    </p>
                                    <p className="text-p2 text-secondary-foreground">
                                      {formatUsd(
                                        amount.times(
                                          appData.suilend.lmMarket
                                            .rewardPriceMap[coinType] ?? 0,
                                        ),
                                      )}
                                    </p>
                                  </div>
                                ),
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

                        {userData === undefined ? (
                          <Skeleton className="h-6 w-[48px]" />
                        ) : (
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
                        )}
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

                {totalPoints === undefined ? (
                  <Skeleton className="h-[30px] w-20" />
                ) : (
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

                    <Tooltip
                      title={`${formatPoints(totalPoints, {
                        dp: appData.coinMetadataMap[
                          NORMALIZED_STEAMM_POINTS_COINTYPE
                        ].decimals,
                      })} ${appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE].symbol}`}
                    >
                      <p className="text-h3 text-foreground">
                        {formatPoints(totalPoints)}
                      </p>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pool positions */}
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-row items-center gap-3">
            <h2 className="text-h3 text-foreground">Positions</h2>
            {poolPositionsWithExtraData === undefined ? (
              <Skeleton className="h-5 w-12" />
            ) : (
              <Tag>{poolPositionsWithExtraData.length}</Tag>
            )}
          </div>

          <PoolPositionsTable poolPositions={poolPositionsWithExtraData} />
        </div>

        {/* Global transaction history */}
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-row items-center gap-3">
            <p className="text-h3 text-foreground">Transaction history</p>
            {addressGlobalTransactionHistory === undefined ? (
              <Skeleton className="h-5 w-12" />
            ) : (
              <Tag>{addressGlobalTransactionHistory.length}</Tag>
            )}
          </div>

          <TransactionHistoryTable
            transactionHistory={
              addressGlobalTransactionHistory === undefined
                ? undefined
                : addressGlobalTransactionHistory.length === 0
                  ? []
                  : [addressGlobalTransactionHistory]
            }
            hasPoolColumn
          />
        </div>
      </div>
    </>
  );
}
