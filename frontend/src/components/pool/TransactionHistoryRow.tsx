import Link from "next/link";
import { CSSProperties, Fragment } from "react";

import BigNumber from "bignumber.js";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

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
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { getPoolSlug } from "@/lib/pools";
import {
  HistoryDeposit,
  HistoryRedeem,
  HistoryTransactionType,
} from "@/lib/types";

interface TransactionHistoryRowProps {
  columnStyleMap: Record<Column, CSSProperties>;
  transaction: HistoryDeposit | HistoryRedeem;
  hasPoolColumn?: boolean;
}

export default function TransactionHistoryRow({
  columnStyleMap,
  transaction,
  hasPoolColumn,
}: TransactionHistoryRowProps) {
  const { explorer } = useSettingsContext();
  const { appData, poolsData } = useLoadedAppContext();

  const pool =
    poolsData === undefined
      ? undefined
      : poolsData.pools.find((_pool) => _pool.id === transaction.pool_id);

  if (!pool) return null; // Should not happen
  return (
    <div className="relative z-[1] flex min-h-[calc(44px+1px)] w-full min-w-max shrink-0 flex-row items-center border-x border-b bg-background">
      {/* Date */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.date}
      >
        <p className="text-p2 text-secondary-foreground">
          {format(
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
          {transaction.type === HistoryTransactionType.DEPOSIT
            ? "Deposit"
            : "Withdraw"}
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
            href={`${POOL_URL_PREFIX}/${pool.id}-${getPoolSlug(appData, pool)}`}
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
        {pool.coinTypes.map((coinType, index) => {
          const amount =
            transaction.type === HistoryTransactionType.DEPOSIT
              ? new BigNumber(
                  index === 0 ? transaction.deposit_a : transaction.deposit_b,
                ).div(10 ** appData.coinMetadataMap[coinType].decimals)
              : new BigNumber(
                  index === 0 ? transaction.withdraw_a : transaction.withdraw_b,
                ).div(10 ** appData.coinMetadataMap[coinType].decimals);

          return (
            <div key={coinType} className="flex flex-row items-center gap-2">
              <TokenLogo
                token={getToken(coinType, appData.coinMetadataMap[coinType])}
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
          );
        })}
      </div>

      {/* Digest */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.digest}
      >
        <Link
          className="block flex flex-col justify-center text-secondary-foreground transition-colors hover:text-foreground"
          href={explorer.buildTxUrl(transaction.digest)}
          target="_blank"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
