import Link from "next/link";
import { Fragment } from "react";

import BigNumber from "bignumber.js";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

import { formatToken, getToken } from "@suilend/frontend-sui";
import { useSettingsContext } from "@suilend/frontend-sui-next";

import { columnStyleMap } from "@/components/pool/TransactionHistoryTable";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import {
  HistoryDeposit,
  HistoryRedeem,
  HistoryTransactionType,
} from "@/lib/types";

interface TransactionHistoryRowProps {
  transaction: HistoryDeposit | HistoryRedeem;
}

export default function TransactionHistoryRow({
  transaction,
}: TransactionHistoryRowProps) {
  const { explorer } = useSettingsContext();
  const { appData } = useLoadedAppContext();

  const { pool } = usePoolContext();

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

      {/* Amounts */}
      <div
        className="flex h-full flex-row items-center gap-2"
        style={columnStyleMap.amounts}
      >
        {[0, 1].map((index) => {
          const coinType = pool.coinTypes[index];
          const coinMetadata = appData.coinMetadataMap[coinType];

          const amount =
            transaction.type === HistoryTransactionType.DEPOSIT
              ? new BigNumber(
                  index === 0 ? transaction.deposit_a : transaction.deposit_b,
                ).div(10 ** coinMetadata.decimals)
              : new BigNumber(
                  index === 0 ? transaction.withdraw_a : transaction.withdraw_b,
                ).div(10 ** coinMetadata.decimals);

          return (
            <Fragment key={index}>
              <TokenLogo token={getToken(coinType, coinMetadata)} size={16} />
              <Tooltip
                title={formatToken(amount, { dp: coinMetadata.decimals })}
              >
                <p className="text-p2 text-foreground">
                  {formatToken(amount, { exact: false })} {coinMetadata.symbol}
                </p>
              </Tooltip>

              {index === 0 && (
                <p className="text-p2 text-secondary-foreground">+</p>
              )}
            </Fragment>
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
