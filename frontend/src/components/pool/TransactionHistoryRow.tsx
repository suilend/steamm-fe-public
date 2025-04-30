import Link from "next/link";
import { CSSProperties, Fragment } from "react";

import BigNumber from "bignumber.js";
import { format } from "date-fns";
import { ArrowRight, ExternalLink, Plus } from "lucide-react";

import { formatToken, getToken } from "@suilend/frontend-sui";
import { useSettingsContext } from "@suilend/frontend-sui-next";

import PoolTypeTag from "@/components/pool/PoolTypeTag";
import { Column } from "@/components/pool/TransactionHistoryTable";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { formatFeeTier, formatPair } from "@/lib/format";
import { getPoolUrl } from "@/lib/pools";
import {
  HistoryDeposit,
  HistorySwap,
  HistoryTransactionType,
  HistoryWithdraw,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface TransactionHistoryRowProps {
  columnStyleMap: Record<Column, CSSProperties>;
  prevTransaction?: HistoryDeposit | HistoryWithdraw | HistorySwap;
  transaction: HistoryDeposit | HistoryWithdraw | HistorySwap;
  nextTransaction?: HistoryDeposit | HistoryWithdraw | HistorySwap;
  hasPoolColumn?: boolean;
}

export default function TransactionHistoryRow({
  columnStyleMap,
  prevTransaction,
  transaction,
  nextTransaction,
  hasPoolColumn,
}: TransactionHistoryRowProps) {
  const { explorer } = useSettingsContext();
  const { appData, poolsData } = useLoadedAppContext();

  const pool =
    poolsData === undefined
      ? undefined
      : poolsData.pools.find((_pool) => _pool.id === transaction.pool_id);

  // Swap
  const getSwapTransactionTokens = () => {
    if (!pool) throw new Error("Pool not found");

    const inToken = getToken(
      (transaction as HistorySwap).a_to_b
        ? pool.coinTypes[0]
        : pool.coinTypes[1],
      appData.coinMetadataMap[
        (transaction as HistorySwap).a_to_b
          ? pool.coinTypes[0]
          : pool.coinTypes[1]
      ],
    );
    const outToken = getToken(
      (transaction as HistorySwap).a_to_b
        ? pool.coinTypes[1]
        : pool.coinTypes[0],
      appData.coinMetadataMap[
        (transaction as HistorySwap).a_to_b
          ? pool.coinTypes[1]
          : pool.coinTypes[0]
      ],
    );

    return [inToken, outToken];
  };

  const getSwapTransactionAmounts = () => {
    const tokens = getSwapTransactionTokens();

    const inAmount = new BigNumber((transaction as HistorySwap).amount_in).div(
      10 ** appData.coinMetadataMap[tokens[0].coinType].decimals,
    );
    const outAmount = new BigNumber(
      (transaction as HistorySwap).amount_out,
    ).div(10 ** appData.coinMetadataMap[tokens[1].coinType].decimals);

    return [inAmount, outAmount];
  };

  if (!pool) return null; // Should not happen
  return (
    <div
      className={cn(
        "relative z-[1] flex w-full min-w-max shrink-0 flex-row items-center border-x border-b bg-background py-3",
        transaction.timestamp === nextTransaction?.timestamp &&
          "border-b-[transparent] pb-1",
        prevTransaction?.timestamp === transaction.timestamp && "pt-1",
      )}
    >
      {/* Date */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.date}
      >
        <p className="text-p2 text-secondary-foreground">
          {prevTransaction?.timestamp !== transaction.timestamp &&
            format(
              new Date(+transaction.timestamp * 1000),
              "yyyy-MM-dd hh:mm:ss",
            )}
        </p>
      </div>

      {/* Type */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.type}
      >
        <p className="text-p2 text-foreground">
          {transaction.type === HistoryTransactionType.DEPOSIT ? (
            "Deposit"
          ) : transaction.type === HistoryTransactionType.WITHDRAW ? (
            "Withdraw"
          ) : (
            <>
              {prevTransaction?.timestamp !== transaction.timestamp && "Swap"}
            </>
          )}
        </p>
      </div>

      {/* Pool */}
      {hasPoolColumn && (
        <div
          className="flex h-full flex-row items-center gap-3"
          style={columnStyleMap.pool}
        >
          <TokenLogos coinTypes={pool.coinTypes} size={20} />
          <p className="text-p2 text-foreground">
            {formatPair(
              pool.coinTypes.map(
                (coinType) => appData.coinMetadataMap[coinType].symbol,
              ),
            )}
          </p>

          <div className="flex flex-row items-center gap-px">
            <PoolTypeTag className="rounded-r-[0] pr-2" pool={pool} />
            <Tag className="rounded-l-[0] pl-2">
              {formatFeeTier(pool.feeTierPercent)}
            </Tag>
          </div>

          <Link
            className="block flex flex-col justify-center text-secondary-foreground transition-colors hover:text-foreground"
            href={getPoolUrl(appData, pool)}
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Amounts */}
      <div
        className="flex h-full flex-row items-center gap-3"
        style={columnStyleMap.amounts}
      >
        {transaction.type === HistoryTransactionType.DEPOSIT ||
        transaction.type === HistoryTransactionType.WITHDRAW ? (
          <div className="flex flex-row items-center gap-2">
            {pool.coinTypes.map((coinType, index) => {
              const amount =
                transaction.type === HistoryTransactionType.DEPOSIT
                  ? new BigNumber(
                      index === 0
                        ? transaction.deposit_a
                        : transaction.deposit_b,
                    ).div(10 ** appData.coinMetadataMap[coinType].decimals)
                  : new BigNumber(
                      index === 0
                        ? transaction.withdraw_a
                        : transaction.withdraw_b,
                    ).div(10 ** appData.coinMetadataMap[coinType].decimals);

              return (
                <Fragment key={coinType}>
                  <div className="flex flex-row items-center gap-2">
                    <TokenLogo
                      token={getToken(
                        coinType,
                        appData.coinMetadataMap[coinType],
                      )}
                      size={16}
                    />
                    <Tooltip
                      title={formatToken(amount, {
                        dp: appData.coinMetadataMap[coinType].decimals,
                      })}
                    >
                      <p className="text-p2 text-foreground">
                        {formatToken(amount, { exact: false })}{" "}
                        {appData.coinMetadataMap[coinType].symbol}
                      </p>
                    </Tooltip>
                  </div>

                  {index === 0 && (
                    <Plus className="h-4 w-4 text-tertiary-foreground" />
                  )}
                </Fragment>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-row items-center gap-2">
            {[0, 1].map((index) => {
              const token = getSwapTransactionTokens()[index];
              const amount = getSwapTransactionAmounts()[index];

              return (
                <Fragment key={index}>
                  <div className="flex flex-row items-center gap-2">
                    <TokenLogo token={token} size={16} />
                    <Tooltip
                      title={formatToken(amount, { dp: token.decimals })}
                    >
                      <p className="text-p2 text-foreground">
                        {formatToken(amount, { exact: false })} {token.symbol}
                      </p>
                    </Tooltip>
                  </div>

                  {index === 0 && (
                    <ArrowRight className="h-4 w-4 text-tertiary-foreground" />
                  )}
                </Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Digest */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.digest}
      >
        {prevTransaction?.timestamp !== transaction.timestamp && (
          <Link
            className="block flex flex-col justify-center text-secondary-foreground transition-colors hover:text-foreground"
            href={explorer.buildTxUrl(transaction.digest)}
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
