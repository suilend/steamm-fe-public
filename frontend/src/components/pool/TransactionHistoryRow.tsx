import Link from "next/link";
import { CSSProperties, Fragment } from "react";

import BigNumber from "bignumber.js";
import { formatDate } from "date-fns";
import { ArrowRight, ExternalLink, Plus } from "lucide-react";

import { formatToken, getToken } from "@suilend/sui-fe";
import { useSettingsContext } from "@suilend/sui-fe-next";

import PoolLabel from "@/components/pool/PoolLabel";
import { Column } from "@/components/pool/TransactionHistoryTable";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { getPoolUrl } from "@/lib/pools";
import {
  HistoryDeposit,
  HistorySwap,
  HistoryTransactionType,
  HistoryWithdraw,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface TransactionHistoryRowProps {
  columnStyleMap: Record<
    Column,
    { cell: CSSProperties; children: CSSProperties }
  >;
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
  const { appData } = useLoadedAppContext();

  const pool = appData.pools.find((_pool) => _pool.id === transaction.pool_id);

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
    <tr
      className={cn(
        "border-x border-b bg-background",
        transaction.timestamp === nextTransaction?.timestamp &&
          "border-b-border/25",
        prevTransaction?.timestamp === transaction.timestamp && "",
      )}
    >
      {/* Date */}
      <td
        className="whitespace-nowrap align-middle"
        style={columnStyleMap.date.cell}
      >
        <div
          className="flex min-w-max flex-row items-center py-3"
          style={columnStyleMap.date.children}
        >
          <div className="w-max">
            <p className="text-p2 text-secondary-foreground">
              {prevTransaction?.timestamp !== transaction.timestamp &&
                formatDate(
                  new Date(+transaction.timestamp * 1000),
                  "yyyy-MM-dd HH:mm:ss",
                )}
            </p>
          </div>
        </div>
      </td>

      {/* Type */}
      <td
        className="whitespace-nowrap align-middle"
        style={columnStyleMap.type.cell}
      >
        <div
          className="flex min-w-max flex-row items-center py-3"
          style={columnStyleMap.type.children}
        >
          <div className="w-max">
            <p className="text-p2 text-foreground">
              {transaction.type === HistoryTransactionType.DEPOSIT ? (
                "Deposit"
              ) : transaction.type === HistoryTransactionType.WITHDRAW ? (
                "Withdraw"
              ) : (
                <>
                  {prevTransaction?.timestamp !== transaction.timestamp &&
                    "Swap"}
                </>
              )}
            </p>
          </div>
        </div>
      </td>

      {/* Pool */}
      {hasPoolColumn && (
        <td
          className="whitespace-nowrap align-middle"
          style={columnStyleMap.pool.cell}
        >
          <div
            className="flex min-w-max flex-row items-center py-3"
            style={columnStyleMap.pool.children}
          >
            <div className="flex w-max flex-row items-center gap-3">
              <PoolLabel isSmall pool={pool} />

              <Link
                className="block flex flex-col justify-center text-secondary-foreground transition-colors hover:text-foreground"
                href={getPoolUrl(appData, pool)}
                target="_blank"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </td>
      )}

      {/* Amounts */}
      <td
        className="whitespace-nowrap align-middle"
        style={columnStyleMap.amounts.cell}
      >
        <div
          className="flex min-w-max flex-row items-center py-3"
          style={columnStyleMap.amounts.children}
        >
          <div className="w-max">
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
                          title={`${formatToken(amount, {
                            dp: appData.coinMetadataMap[coinType].decimals,
                          })} ${appData.coinMetadataMap[coinType].symbol}`}
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
                            {formatToken(amount, { exact: false })}{" "}
                            {token.symbol}
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
        </div>
      </td>

      {/* Digest */}
      <td
        className="whitespace-nowrap align-middle"
        style={columnStyleMap.digest.cell}
      >
        <div
          className="flex min-w-max flex-row items-center py-3"
          style={columnStyleMap.digest.children}
        >
          <div className="w-max">
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
      </td>
    </tr>
  );
}
