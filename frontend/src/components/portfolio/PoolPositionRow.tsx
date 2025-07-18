import Link from "next/link";
import { CSSProperties, MouseEvent, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import * as Sentry from "@sentry/nextjs";
import BigNumber from "bignumber.js";
import { Loader2 } from "lucide-react";

import {
  MAX_U64,
  formatPercent,
  formatToken,
  formatUsd,
  getToken,
} from "@suilend/sui-fe";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import AprBreakdown from "@/components/AprBreakdown";
import PoolLabel from "@/components/pool/PoolLabel";
import { Column } from "@/components/portfolio/PoolPositionsTable";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import useStake from "@/hooks/useStake";
import { formatPair } from "@/lib/format";
import { getIndexesOfObligationsWithDeposit } from "@/lib/obligation";
import { getPoolUrl } from "@/lib/pools";
import { showSuccessTxnToast } from "@/lib/toasts";
import { PoolPosition } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoolPositionRowProps {
  columnStyleMap: Record<
    Column,
    { cell: CSSProperties; children: CSSProperties }
  >;
  poolPosition: PoolPosition;
}

export default function PoolPositionRow({
  columnStyleMap,
  poolPosition,
}: PoolPositionRowProps) {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { appData } = useLoadedAppContext();
  const { refreshRawBalancesMap, userData, refreshUserData } = useUserContext();

  // Stake/unstake
  const [stakedPercentOverride, setStakedPercentOverride] = useState<
    BigNumber | undefined
  >(undefined);
  const stakedPercent = stakedPercentOverride ?? poolPosition.stakedPercent;

  // Stake
  const { isStaking, onStakeClick } = useStake(
    poolPosition,
    setStakedPercentOverride,
  );

  // Unstake
  const [isUnstaking, setIsUnstaking] = useState<boolean>(false);

  const onUnstakeClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (userData === undefined) return;

    try {
      if (isUnstaking) return;
      if (!address) throw Error("Wallet not connected");

      setIsUnstaking(true);

      const submitAmount = MAX_U64.toString();

      const transaction = new Transaction();

      try {
        const obligationIndexes = getIndexesOfObligationsWithDeposit(
          userData.obligations,
          poolPosition.pool.lpTokenType,
        );
        if (obligationIndexes.length === 0) throw Error("Obligation not found"); // Should never happen as you can't unstake if you don't have any staked
        console.log("XXX obligationIndexes:", obligationIndexes);

        for (const obligationIndex of obligationIndexes) {
          await appData.suilend.lmMarket.suilendClient.withdrawAndSendToUser(
            address,
            userData.obligationOwnerCaps[obligationIndex].id,
            userData.obligations[obligationIndex].id,
            poolPosition.pool.lpTokenType,
            submitAmount,
            transaction,
          );
        }
      } catch (err) {
        Sentry.captureException(err);
        console.error(err);
        throw err;
      }

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast(
        [
          "Unstaked",
          formatPair(
            poolPosition.pool.coinTypes.map(
              (coinType) => appData.coinMetadataMap[coinType].symbol,
            ),
          ),
          "LP tokens",
        ].join(" "),
        txUrl,
      );

      setStakedPercentOverride(new BigNumber(0)); // Override to prevent double-counting while refreshing
      setTimeout(() => {
        setStakedPercentOverride(undefined);
      }, 5000);
    } catch (err) {
      showErrorToast(
        "Failed to unstake LP tokens",
        err as Error,
        undefined,
        true,
      );
      console.error(err);
      Sentry.captureException(err);
    } finally {
      setIsUnstaking(false);

      // The order of these two calls is important (refreshUserData must be called after refreshRawBalancesMap so the pool position doesn't disappear while the new balances are still being fetched)
      await refreshRawBalancesMap();
      await refreshUserData();
    }
  };

  return (
    <Link href={getPoolUrl(appData, poolPosition.pool)} className="contents">
      <tr className="group cursor-pointer border-x border-b bg-background transition-colors hover:bg-tertiary">
        {/* Pool */}
        <td
          className="whitespace-nowrap align-middle"
          style={columnStyleMap.pool.cell}
        >
          <div
            className="flex min-w-max flex-row items-center py-4"
            style={columnStyleMap.pool.children}
          >
            <div className="w-max">
              <PoolLabel pool={poolPosition.pool} />
            </div>
          </div>
        </td>

        {/* APR */}
        <td
          className="whitespace-nowrap align-middle"
          style={columnStyleMap.aprPercent_24h.cell}
        >
          <div
            className="flex min-w-max flex-row items-center py-4"
            style={columnStyleMap.aprPercent_24h.children}
          >
            <div className="w-max">
              <AprBreakdown pool={poolPosition.pool} />
            </div>
          </div>
        </td>

        {/* Balance */}
        <td
          className="whitespace-nowrap align-middle"
          style={columnStyleMap.balance.cell}
        >
          <div
            className="flex min-w-max flex-row items-center py-4"
            style={columnStyleMap.balance.children}
          >
            <div className="flex w-max flex-col items-end gap-1">
              {poolPosition.balanceUsd === undefined ? (
                <Skeleton className="h-[24px] w-16" />
              ) : (
                <Tooltip
                  title={formatUsd(poolPosition.balanceUsd, { exact: true })}
                >
                  <p className="text-p1 text-foreground">
                    {formatUsd(poolPosition.balanceUsd)}
                  </p>
                </Tooltip>
              )}

              {poolPosition.balances === undefined ? (
                <Skeleton className="h-[21px] w-40" />
              ) : (
                <div className="flex flex-row items-center gap-3">
                  {poolPosition.pool.coinTypes.map((coinType, index) => (
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
                      <Tooltip
                        title={`${formatToken(poolPosition.balances[index], { dp: appData.coinMetadataMap[coinType].decimals })} ${appData.coinMetadataMap[coinType].symbol}`}
                      >
                        <p className="text-p2 text-foreground">
                          {formatToken(poolPosition.balances[index], {
                            exact: false,
                          })}{" "}
                          {appData.coinMetadataMap[coinType].symbol}
                        </p>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </td>

        {/* PnL */}
        <td
          className="whitespace-nowrap align-middle"
          style={columnStyleMap.pnl.cell}
        >
          <div
            className="flex min-w-max flex-row items-center py-4"
            style={columnStyleMap.pnl.children}
          >
            <div className="flex w-max flex-row items-center gap-2">
              {poolPosition.pnlUsd === undefined ? (
                <Skeleton className="h-[24px] w-16" />
              ) : (
                <p
                  className={cn(
                    "!text-p1",
                    poolPosition.pnlUsd.gte(0) ? "text-success" : "text-error",
                  )}
                >
                  {poolPosition.pnlUsd.gte(0) ? "+" : "-"}
                  {formatUsd(poolPosition.pnlUsd.abs())}
                </p>
              )}

              <p className="text-p2 text-secondary-foreground">/</p>

              {poolPosition.pnlPercent === undefined ? (
                <Skeleton className="h-[24px] w-16" />
              ) : poolPosition.pnlPercent === null ? (
                <p className="text-p1 text-foreground">--</p>
              ) : (
                <p
                  className={cn(
                    "!text-p1",
                    poolPosition.pnlPercent.gte(0)
                      ? "text-success/75"
                      : "text-error/75",
                  )}
                >
                  {poolPosition.pnlPercent.gte(0) ? "+" : "-"}
                  {formatPercent(poolPosition.pnlPercent.abs())}
                </p>
              )}
            </div>
          </div>
        </td>

        {/* Staked */}
        <td
          className="whitespace-nowrap align-middle"
          style={columnStyleMap.stakedPercent.cell}
        >
          <div
            className="flex min-w-max flex-row items-center py-4"
            style={columnStyleMap.stakedPercent.children}
          >
            <div className="w-max">
              {!!appData.suilend.lmMarket.reserveMap[
                poolPosition.pool.lpTokenType
              ] ? (
                <div className="flex flex-col items-end gap-1">
                  <p className="text-p1 text-foreground">
                    {stakedPercent.eq(0)
                      ? "Not staked"
                      : stakedPercent.eq(100)
                        ? "Staked"
                        : `${formatPercent(stakedPercent)} staked`}
                  </p>

                  <div className="flex flex-row items-center gap-2">
                    {!stakedPercent.eq(100) && (
                      <button
                        className="flex h-6 w-[48px] flex-row items-center justify-center rounded-md bg-button-1 px-2 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
                        disabled={isStaking}
                        onClick={onStakeClick}
                      >
                        {isStaking ? (
                          <Loader2 className="h-4 w-4 animate-spin text-button-1-foreground" />
                        ) : (
                          <p className="text-p3 text-button-1-foreground">
                            Stake
                          </p>
                        )}
                      </button>
                    )}

                    {!stakedPercent.eq(0) && (
                      <button
                        className="flex h-6 w-[60px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
                        disabled={isUnstaking}
                        onClick={onUnstakeClick}
                      >
                        {isUnstaking ? (
                          <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
                        ) : (
                          <p className="text-p3 text-button-2-foreground">
                            Unstake
                          </p>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-p1 text-foreground">--</p>
              )}
            </div>
          </div>
        </td>

        {/* Claimable rewards */}
        <td
          className="whitespace-nowrap align-middle"
          style={columnStyleMap.claimableRewards.cell}
        >
          <div
            className="flex min-w-max flex-row items-center py-4"
            style={columnStyleMap.claimableRewards.children}
          >
            <div className="w-max">
              {Object.keys(poolPosition.claimableRewards).length > 0 ? (
                <div className="flex flex-col items-end gap-1">
                  {Object.entries(poolPosition.claimableRewards).map(
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
                        <Tooltip
                          title={`${formatToken(amount, { dp: appData.coinMetadataMap[coinType].decimals })} ${appData.coinMetadataMap[coinType].symbol}`}
                        >
                          <p className="text-p2 text-foreground">
                            {formatToken(amount, { exact: false })}{" "}
                            {appData.coinMetadataMap[coinType].symbol}
                          </p>
                        </Tooltip>

                        <Tooltip
                          title={formatUsd(
                            amount.times(
                              appData.suilend.lmMarket.rewardPriceMap[
                                coinType
                              ] ?? 0,
                            ),
                            { exact: true },
                          )}
                        >
                          <p className="text-p2 text-secondary-foreground">
                            {formatUsd(
                              amount.times(
                                appData.suilend.lmMarket.rewardPriceMap[
                                  coinType
                                ] ?? 0,
                              ),
                            )}
                          </p>
                        </Tooltip>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-p1 text-foreground">--</p>
              )}
            </div>
          </div>
        </td>
      </tr>
    </Link>
  );
}
