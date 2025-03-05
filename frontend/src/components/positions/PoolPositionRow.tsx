import Link from "next/link";
import { MouseEvent, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import * as Sentry from "@sentry/nextjs";
import BigNumber from "bignumber.js";
import { Loader2 } from "lucide-react";

import { MAX_U64, formatPercent, formatUsd } from "@suilend/frontend-sui";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import {
  createObligationIfNoneExists,
  sendObligationToUser,
} from "@suilend/sdk";

import AprBreakdown from "@/components/AprBreakdown";
import { columnStyleMap } from "@/components/positions/PoolPositionsTable";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedUserContext } from "@/contexts/UserContext";
import { formatFeeTier, formatPair } from "@/lib/format";
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { showSuccessTxnToast } from "@/lib/toasts";
import { PoolPosition, poolTypeNameMap } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoolPositionRowProps {
  position: PoolPosition;
  isLast?: boolean;
}

export default function PoolPositionRow({
  position,
  isLast,
}: PoolPositionRowProps) {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { appData } = useLoadedAppContext();
  const { refreshRawBalancesMap, getBalance, userData, refreshUserData } =
    useLoadedUserContext();

  // Stake/unstake
  const [stakedPercentOverride, setStakedPercentOverride] = useState<
    BigNumber | undefined
  >(undefined);
  const stakedPercent = stakedPercentOverride ?? position.stakedPercent;

  // Stake
  const [isStaking, setIsStaking] = useState<boolean>(false);

  const onStakeClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (isStaking) return;
    if (!address) throw Error("Wallet not connected");

    try {
      setIsStaking(true);

      const submitAmount = new BigNumber(getBalance(position.pool.lpTokenType))
        .times(
          10 ** appData.coinMetadataMap[position.pool.lpTokenType].decimals,
        )
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const transaction = new Transaction();

      const { obligationOwnerCapId, didCreate } = createObligationIfNoneExists(
        appData.lm.suilendClient,
        transaction,
        userData.obligationOwnerCaps?.[0], // Use the first (and assumed to be the only) obligation owner cap
      );
      await appData.lm.suilendClient.depositIntoObligation(
        address,
        position.pool.lpTokenType,
        submitAmount,
        transaction,
        obligationOwnerCapId,
      );
      if (didCreate)
        sendObligationToUser(obligationOwnerCapId, address, transaction);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Staked LP tokens", txUrl);

      setStakedPercentOverride(new BigNumber(100)); // Override to prevent double-counting while refreshing
      setTimeout(() => {
        setStakedPercentOverride(undefined);
      }, 3000);
    } catch (err) {
      showErrorToast(
        "Failed to stake LP tokens",
        err as Error,
        undefined,
        true,
      );
      console.error(err);
      Sentry.captureException(err);
    } finally {
      setIsStaking(false);

      // The order of these two calls is important (refreshRawBalancesMap must be called after refreshUserData so the position doesn't disappear while the new obligations are still being fetched)
      await refreshUserData();
      await refreshRawBalancesMap();
    }
  };

  // Unstake
  const [isUnstaking, setIsUnstaking] = useState<boolean>(false);

  const onUnstakeClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (isUnstaking) return;
    if (!address) throw Error("Wallet not connected");

    try {
      setIsUnstaking(true);

      const submitAmount = MAX_U64.toString();

      const transaction = new Transaction();

      try {
        await appData.lm.suilendClient.withdrawAndSendToUser(
          address,
          userData.obligationOwnerCaps[0].id, // Assumes only one obligation owner cap
          userData.obligations[0].id, // Assumes only one obligation
          position.pool.lpTokenType,
          submitAmount,
          transaction,
        );
      } catch (err) {
        Sentry.captureException(err);
        console.error(err);
        throw err;
      }

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Unstaked LP tokens", txUrl);

      setStakedPercentOverride(new BigNumber(0)); // Override to prevent double-counting while refreshing
      setTimeout(() => {
        setStakedPercentOverride(undefined);
      }, 3000);
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

      // The order of these two calls is important (refreshUserData must be called after refreshRawBalancesMap so the position doesn't disappear while the new balances are still being fetched)
      await refreshRawBalancesMap();
      await refreshUserData();
    }
  };

  // Claim
  const onClaimRewardsClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  return (
    <Link
      className={cn(
        "group relative z-[1] flex h-[56px] w-full min-w-max shrink-0 cursor-pointer flex-row transition-colors hover:bg-tertiary",
        !isLast && "h-[calc(56px+1px)] border-b",
      )}
      href={`${POOL_URL_PREFIX}/${position.pool.id}`}
    >
      {/* Pair */}
      <div
        className="flex h-full flex-row items-center gap-3"
        style={columnStyleMap.pair}
      >
        <TokenLogos coinTypes={position.pool.coinTypes} size={24} />
        <p className="overflow-hidden text-ellipsis text-nowrap text-p1 text-foreground">
          {formatPair(
            position.pool.coinTypes.map(
              (coinType) => appData.coinMetadataMap[coinType].symbol,
            ),
          )}
        </p>
      </div>

      {/* Type */}
      <div
        className="flex h-full flex-row items-center gap-1"
        style={columnStyleMap.type}
      >
        <Tag>
          {position.pool.type ? poolTypeNameMap[position.pool.type] : "--"}
        </Tag>
        <Tag>{formatFeeTier(position.pool.feeTierPercent)}</Tag>
      </div>

      {/* APR */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.aprPercent_24h}
      >
        <AprBreakdown
          valueClassName="text-success decoration-success/50"
          pool={position.pool}
        />
      </div>

      {/* Balance */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.balanceUsd}
      >
        {position.balanceUsd === undefined ? (
          <Skeleton className="h-[24px] w-16" />
        ) : (
          <Tooltip title={formatUsd(position.balanceUsd, { exact: true })}>
            <p className="text-p1 text-foreground">
              {formatUsd(position.balanceUsd)}
            </p>
          </Tooltip>
        )}
      </div>

      {/* Staked */}
      <div
        className="flex h-full flex-row items-center gap-3"
        style={columnStyleMap.stakedPercent}
      >
        {!!appData.lm.reserveMap[position.pool.lpTokenType] ? (
          <>
            <p className="text-p1 text-foreground">
              {formatPercent(stakedPercent)}
            </p>

            <div className="flex flex-col items-end gap-1">
              {/* Stake */}
              {!stakedPercent.eq(100) && (
                <button
                  className="flex h-6 w-[48px] flex-row items-center justify-center rounded-md bg-button-1 px-2 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
                  disabled={isStaking}
                  onClick={onStakeClick}
                >
                  {isStaking ? (
                    <Loader2 className="h-4 w-4 animate-spin text-button-1-foreground" />
                  ) : (
                    <p className="text-p3 text-button-1-foreground">Stake</p>
                  )}
                </button>
              )}

              {/* Unstake */}
              {!stakedPercent.eq(0) && (
                <button
                  className="flex h-6 w-[60px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
                  disabled={isUnstaking}
                  onClick={onUnstakeClick}
                >
                  {isUnstaking ? (
                    <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
                  ) : (
                    <p className="text-p3 text-button-2-foreground">Unstake</p>
                  )}
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="text-p1 text-foreground">--</p>
        )}
      </div>
    </Link>
  );
}
