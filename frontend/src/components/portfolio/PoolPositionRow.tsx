import Link from "next/link";
import { Fragment, MouseEvent, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import * as Sentry from "@sentry/nextjs";
import BigNumber from "bignumber.js";
import { Loader2 } from "lucide-react";

import {
  MAX_U64,
  NORMALIZED_STEAMM_POINTS_COINTYPE,
  formatPercent,
  formatPoints,
  formatToken,
  formatUsd,
  getToken,
} from "@suilend/frontend-sui";
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
import { columnStyleMap } from "@/components/portfolio/PoolPositionsTable";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { formatFeeTier, formatPair } from "@/lib/format";
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { getIndexOfObligationWithDeposit } from "@/lib/obligation";
import { showSuccessTxnToast } from "@/lib/toasts";
import { PoolPosition, QUOTER_ID_NAME_MAP } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoolPositionRowProps {
  poolPosition: PoolPosition;
}

export default function PoolPositionRow({
  poolPosition,
}: PoolPositionRowProps) {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { appData } = useLoadedAppContext();
  const { refreshRawBalancesMap, getBalance, userData, refreshUserData } =
    useUserContext();

  // Stake/unstake
  const [stakedPercentOverride, setStakedPercentOverride] = useState<
    BigNumber | undefined
  >(undefined);
  const stakedPercent = stakedPercentOverride ?? poolPosition.stakedPercent;

  // Stake
  const [isStaking, setIsStaking] = useState<boolean>(false);

  const onStakeClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (userData === undefined) return;

    try {
      if (isStaking) return;
      if (!address) throw Error("Wallet not connected");

      setIsStaking(true);

      const submitAmount = new BigNumber(
        getBalance(poolPosition.pool.lpTokenType),
      )
        .times(
          10 ** appData.coinMetadataMap[poolPosition.pool.lpTokenType].decimals,
        )
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const transaction = new Transaction();

      let obligationIndex = getIndexOfObligationWithDeposit(
        userData.obligations,
        poolPosition.pool.lpTokenType,
      ); // Assumes up to one obligation has deposits of the LP token type
      if (obligationIndex === -1)
        obligationIndex = userData.obligations.findIndex(
          (obligation) => obligation.depositPositionCount < 5,
        ); // Get obligation with less than 5 deposits (if any)
      console.log("XXX obligationIndex:", obligationIndex);

      const { obligationOwnerCapId, didCreate } = createObligationIfNoneExists(
        appData.lmMarket.suilendClient,
        transaction,
        obligationIndex !== -1
          ? userData.obligationOwnerCaps[obligationIndex]
          : undefined, // Create new obligation
      );
      await appData.lmMarket.suilendClient.depositIntoObligation(
        address,
        poolPosition.pool.lpTokenType,
        submitAmount,
        transaction,
        obligationOwnerCapId,
      );
      if (didCreate)
        sendObligationToUser(obligationOwnerCapId, address, transaction);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast(
        [
          "Staked",
          formatPair(
            poolPosition.pool.coinTypes.map(
              (coinType) => appData.coinMetadataMap[coinType].symbol,
            ),
          ),
          "LP tokens",
        ].join(" "),
        txUrl,
      );

      setStakedPercentOverride(new BigNumber(100)); // Override to prevent double-counting while refreshing
      setTimeout(() => {
        setStakedPercentOverride(undefined);
      }, 5000);
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

      // The order of these two calls is important (refreshRawBalancesMap must be called after refreshUserData so the pool position doesn't disappear while the new obligations are still being fetched)
      await refreshUserData();
      await refreshRawBalancesMap();
    }
  };

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
        const obligationIndex = getIndexOfObligationWithDeposit(
          userData.obligations,
          poolPosition.pool.lpTokenType,
        ); // Assumes up to one obligation has deposits of the LP token type
        if (obligationIndex === -1) throw Error("Obligation not found"); // Should never happen as you can't unstake if you don't have any staked
        console.log("XXX obligationIndex:", obligationIndex);

        await appData.lmMarket.suilendClient.withdrawAndSendToUser(
          address,
          userData.obligationOwnerCaps[obligationIndex].id,
          userData.obligations[obligationIndex].id,
          poolPosition.pool.lpTokenType,
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
    <Link
      className="group relative z-[1] flex min-h-[calc(106px+1px)] w-full min-w-max shrink-0 cursor-pointer flex-row items-center border-x border-b bg-background py-[16px] transition-colors hover:bg-tertiary"
      href={`${POOL_URL_PREFIX}/${poolPosition.pool.id}`}
    >
      {/* Pool */}
      <div
        className="flex h-full flex-row items-center gap-3"
        style={columnStyleMap.pool}
      >
        <TokenLogos coinTypes={poolPosition.pool.coinTypes} size={24} />
        <p className="overflow-hidden text-ellipsis text-nowrap text-p1 text-foreground">
          {formatPair(
            poolPosition.pool.coinTypes.map(
              (coinType) => appData.coinMetadataMap[coinType].symbol,
            ),
          )}
        </p>

        <div className="flex flex-row items-center gap-1">
          <Tag>{QUOTER_ID_NAME_MAP[poolPosition.pool.quoterId]}</Tag>
          <Tag>{formatFeeTier(poolPosition.pool.feeTierPercent)}</Tag>
        </div>
      </div>

      {/* APR */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.aprPercent_24h}
      >
        <AprBreakdown
          valueClassName="text-success decoration-success/50"
          pool={poolPosition.pool}
        />
      </div>

      {/* Balance */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.balance}
      >
        <div className="flex flex-col items-end gap-1">
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
            <div className="flex flex-row items-center gap-2">
              {poolPosition.pool.coinTypes.map((coinType, index) => (
                <Fragment key={coinType}>
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

                  {index === 0 && (
                    <p className="text-p2 text-secondary-foreground">+</p>
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PnL */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.pnlPercent}
      >
        {poolPosition.pnlPercent === undefined ? (
          <Skeleton className="h-[24px] w-16" />
        ) : (
          <p
            className={cn(
              "!text-p1",
              poolPosition.pnlPercent.gte(0) ? "text-success" : "text-error",
            )}
          >
            {poolPosition.pnlPercent.gte(0) ? "+" : "-"}
            {formatPercent(new BigNumber(poolPosition.pnlPercent.abs()))}
          </p>
        )}
      </div>

      {/* Staked */}
      <div
        className="flex h-full flex-row items-center gap-3"
        style={columnStyleMap.stakedPercent}
      >
        {!!appData.lmMarket.reserveMap[poolPosition.pool.lpTokenType] ? (
          <>
            <p className="text-p1 text-foreground">
              {formatPercent(stakedPercent)}
            </p>

            <div className="flex flex-col items-end gap-1">
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

      {/* Claimable rewards */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.claimableRewards}
      >
        {Object.keys(poolPosition.claimableRewards).length > 0 ? (
          <div className="flex flex-col items-end gap-1">
            {Object.entries(poolPosition.claimableRewards).map(
              ([coinType, amount]) => {
                const coinMetadata = appData.coinMetadataMap[coinType];

                return (
                  <div
                    key={coinType}
                    className="flex flex-row items-center gap-2"
                  >
                    <TokenLogo
                      token={getToken(coinType, coinMetadata)}
                      size={16}
                    />
                    <Tooltip
                      title={`${formatToken(amount, { dp: coinMetadata.decimals })} ${coinMetadata.symbol}`}
                    >
                      <p className="text-p2 text-foreground">
                        {formatToken(amount, { exact: false })}{" "}
                        {coinMetadata.symbol}
                      </p>
                    </Tooltip>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <p className="text-p1 text-foreground">--</p>
        )}
      </div>

      {/* Points */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.points}
      >
        <div className="flex flex-row items-center gap-2">
          <TokenLogo
            token={getToken(
              NORMALIZED_STEAMM_POINTS_COINTYPE,
              appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE],
            )}
            size={16}
          />

          <Tooltip
            title={`${formatPoints(poolPosition.points, { dp: appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE].decimals })} ${appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE].symbol}`}
          >
            <p className="text-p2 text-foreground">
              {formatPoints(poolPosition.points)}
            </p>
          </Tooltip>
        </div>
      </div>
    </Link>
  );
}
