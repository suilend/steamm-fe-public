import Head from "next/head";
import { useCallback, useMemo, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { capitalize } from "lodash";
import { Loader2 } from "lucide-react";

import { ClaimRewardsReward, RewardSummary, Side } from "@suilend/sdk";
import {
  formatPercent,
  formatToken,
  formatUsd,
  getToken,
  isSteammPoints,
} from "@suilend/sui-fe";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import Divider from "@/components/Divider";
import TransactionHistoryTable from "@/components/pool/TransactionHistoryTable";
import PoolPositionsTable from "@/components/portfolio/PoolPositionsTable";
import SelectPopover from "@/components/SelectPopover";
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
import { SelectPopoverOption } from "@/lib/select";
import { showSuccessTxnToast } from "@/lib/toasts";
import {
  HistoryDeposit,
  HistorySwap,
  HistoryTransactionType,
  HistoryWithdraw,
  PoolPosition,
} from "@/lib/types";

export default function PortfolioPage() {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { appData } = useLoadedAppContext();
  const { userData, refresh } = useUserContext();
  const { poolPositions } = usePoolPositionsContext();

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
                                  ? (entry.coin_a_price ?? 0)
                                  : (entry.coin_b_price ?? 0),
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
                                    ? (entry.coin_a_price ?? 0)
                                    : (entry.coin_b_price ?? 0),
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
                ? poolDepositedAmountUsdMap[position.pool.id].eq(0)
                  ? null
                  : new BigNumber(
                      position.balanceUsd.minus(
                        poolDepositedAmountUsdMap[position.pool.id],
                      ),
                    )
                      .div(poolDepositedAmountUsdMap[position.pool.id])
                      .times(100)
                : undefined,
            pnlUsd:
              poolDepositedAmountUsdMap?.[position.pool.id] !== undefined
                ? position.balanceUsd.minus(
                    poolDepositedAmountUsdMap[position.pool.id],
                  )
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
    } finally {
      setIsClaiming(false);
      refresh();
    }
  };

  // Global transaction history
  const { globalTransactionHistory } = useGlobalTransactionHistory();

  const addressGlobalTransactionHistory:
    | (HistoryDeposit | HistoryWithdraw | HistorySwap)[]
    | undefined = useMemo(
    () => (address ? globalTransactionHistory : []),
    [address, globalTransactionHistory],
  );

  // Global transaction history - Filters
  const [transactionHistoryTypes, setTransactionHistoryTypes] = useState<
    HistoryTransactionType[]
  >([]);
  const onTransactionHistoryTypeChange = useCallback(
    (value: HistoryTransactionType) => {
      setTransactionHistoryTypes((prev) =>
        prev.includes(value)
          ? prev.filter((_value) => _value !== value)
          : [...prev, value],
      );
    },
    [],
  );

  const [transactionHistoryCoinTypes, setTransactionHistoryCoinTypes] =
    useState<string[]>([]);
  const onTransactionHistoryCoinTypeChange = useCallback((value: string) => {
    setTransactionHistoryCoinTypes((prev) =>
      prev.includes(value)
        ? prev.filter((_value) => _value !== value)
        : [...prev, value],
    );
  }, []);

  const getFilteredAddressGlobalTransactionHistory = useCallback(
    (
      _transactionHistoryTypes: HistoryTransactionType[],
      _transactionHistoryCoinTypes: string[],
    ): (HistoryDeposit | HistoryWithdraw | HistorySwap)[] | undefined =>
      appData === undefined || addressGlobalTransactionHistory === undefined
        ? undefined
        : addressGlobalTransactionHistory.filter((transaction) => {
            const pool = appData.pools.find(
              (pool) => pool.id === transaction.pool_id,
            );
            if (!pool) return true;

            return (
              (_transactionHistoryTypes.length === 0 ||
                _transactionHistoryTypes.includes(transaction.type)) &&
              (_transactionHistoryCoinTypes.length === 0 ||
                pool.coinTypes.some((coinType) =>
                  _transactionHistoryCoinTypes.includes(coinType),
                ))
            );
          }),
    [appData, addressGlobalTransactionHistory],
  );
  const filteredAddressGlobalTransactionHistory:
    | (HistoryDeposit | HistoryWithdraw | HistorySwap)[]
    | undefined = useMemo(
    () =>
      getFilteredAddressGlobalTransactionHistory(
        transactionHistoryTypes,
        transactionHistoryCoinTypes,
      ),
    [
      getFilteredAddressGlobalTransactionHistory,
      transactionHistoryTypes,
      transactionHistoryCoinTypes,
    ],
  );

  // Options
  const transactionHistoryTypeOptions: SelectPopoverOption[] = useMemo(
    () =>
      appData === undefined
        ? []
        : Object.values(HistoryTransactionType).map(
            (historyTransactionType) => ({
              id: historyTransactionType,
              name: capitalize(historyTransactionType),
              count: getFilteredAddressGlobalTransactionHistory(
                [historyTransactionType],
                transactionHistoryCoinTypes,
              )?.filter(
                (transaction) => transaction.type === historyTransactionType,
              ).length,
            }),
          ),
    [
      appData,
      getFilteredAddressGlobalTransactionHistory,
      transactionHistoryCoinTypes,
    ],
  );

  const transactionHistoryCoinTypeOptions: SelectPopoverOption[] = useMemo(
    () =>
      appData === undefined ||
      filteredAddressGlobalTransactionHistory === undefined
        ? []
        : Array.from(
            new Set(
              filteredAddressGlobalTransactionHistory.flatMap((transaction) => {
                const pool = appData.pools.find(
                  (pool) => pool.id === transaction.pool_id,
                );
                if (!pool) return [];

                return pool.coinTypes;
              }),
            ),
          )
            .map((coinType) => ({
              id: coinType,
              startDecorator: (
                <TokenLogo
                  token={getToken(coinType, appData.coinMetadataMap[coinType])}
                  size={16}
                />
              ),
              name: appData.coinMetadataMap[coinType].symbol,
              count: getFilteredAddressGlobalTransactionHistory(
                transactionHistoryTypes,
                [coinType],
              )?.filter((transaction) => {
                const pool = appData.pools.find(
                  (pool) => pool.id === transaction.pool_id,
                );
                if (!pool) return false;

                return pool.coinTypes.includes(coinType);
              }).length,
            }))
            .sort((a, b) => b.count! - a.count!), // Descending order
    [
      appData,
      filteredAddressGlobalTransactionHistory,
      getFilteredAddressGlobalTransactionHistory,
      transactionHistoryTypes,
    ],
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
            <div className="max-md:col-span-2 max-md:w-full md:flex-1">
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
          <div className="flex flex-row items-center justify-between gap-4">
            {/* Left */}
            <div className="flex flex-row items-center gap-3">
              <p className="text-h3 text-foreground">Transaction history</p>
              {addressGlobalTransactionHistory === undefined ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <Tag>{addressGlobalTransactionHistory.length}</Tag>
              )}
            </div>

            {/* Right */}
            <div className="flex h-[30px] flex-row items-center gap-2">
              <SelectPopover
                className="w-max min-w-32"
                align="start"
                options={[transactionHistoryTypeOptions]}
                placeholder="All actions"
                values={transactionHistoryTypes}
                onChange={(id: string) =>
                  onTransactionHistoryTypeChange(id as HistoryTransactionType)
                }
                isMultiSelect
                canClear
                onClear={() => setTransactionHistoryTypes([])}
              />

              <SelectPopover
                className="w-max min-w-32"
                align="start"
                options={[transactionHistoryCoinTypeOptions]}
                placeholder="All assets"
                values={transactionHistoryCoinTypes}
                onChange={(id: string) =>
                  onTransactionHistoryCoinTypeChange(id as string)
                }
                isMultiSelect
                canClear
                onClear={() => setTransactionHistoryCoinTypes([])}
              />
            </div>
          </div>

          <TransactionHistoryTable
            transactionHistory={
              filteredAddressGlobalTransactionHistory === undefined
                ? undefined
                : filteredAddressGlobalTransactionHistory.length === 0
                  ? []
                  : [filteredAddressGlobalTransactionHistory]
            }
            hasPoolColumn
          />
        </div>
      </div>
    </>
  );
}
