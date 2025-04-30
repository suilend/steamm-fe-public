import { CSSProperties, Fragment, useMemo } from "react";

import { ClassValue } from "clsx";

import TransactionHistoryRow from "@/components/pool/TransactionHistoryRow";
import HeaderColumn from "@/components/TableHeaderColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoryDeposit, HistorySwap, HistoryWithdraw } from "@/lib/types";
import { cn } from "@/lib/utils";

export type Column = "date" | "type" | "pool" | "amounts" | "digest";
type SortableColumn = "";

interface TransactionHistoryTableProps {
  className?: ClassValue;
  transactionHistory?: (HistoryDeposit | HistoryWithdraw | HistorySwap)[][];
  hasPoolColumn?: boolean;
}

export default function TransactionHistoryTable({
  className,
  transactionHistory,
  hasPoolColumn,
}: TransactionHistoryTableProps) {
  // Columns
  const columnStyleMap: Record<Column, CSSProperties> = useMemo(
    () => ({
      date: {
        width: 175, // px
        paddingLeft: 4 * 5, // px
      },
      type: {
        width: 150, // px
        paddingLeft: 4 * 5, // px
      },
      pool: {
        flex: 1,
        minWidth: 350, // px
        paddingLeft: 4 * 5, // px
      },
      amounts: {
        flex: 1,
        minWidth: 250, // px
        paddingLeft: 4 * 5, // px
      },
      digest: {
        width: 50, // px
        justifyContent: "end",
        paddingRight: 4 * 5, // px
      },
    }),
    [],
  );

  return (
    <div className="relative w-full overflow-hidden rounded-md">
      <div className="pointer-events-none absolute inset-0 z-[2] rounded-md border" />

      <div className={cn("relative z-[1] w-full overflow-auto", className)}>
        {/* Header */}
        <div className="sticky left-0 top-0 z-[2] flex h-[calc(1px+40px+1px)] w-full min-w-max shrink-0 flex-row border bg-secondary">
          <HeaderColumn<Column, SortableColumn>
            id="date"
            style={columnStyleMap.date}
          >
            Date
          </HeaderColumn>

          <HeaderColumn<Column, SortableColumn>
            id="type"
            style={columnStyleMap.type}
          >
            Action
          </HeaderColumn>

          {hasPoolColumn && (
            <HeaderColumn<Column, SortableColumn>
              id="pool"
              style={columnStyleMap.pool}
            >
              Pool
            </HeaderColumn>
          )}

          <HeaderColumn<Column, SortableColumn>
            id="amounts"
            style={columnStyleMap.amounts}
          >
            Details
          </HeaderColumn>

          <HeaderColumn<Column, SortableColumn>
            id="digest"
            style={columnStyleMap.digest}
          >
            Txn
          </HeaderColumn>
        </div>

        {/* Rows */}
        {transactionHistory === undefined ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              className="relative z-[1] h-[calc(45px+1px)] w-full border-x border-b"
            />
          ))
        ) : transactionHistory.length === 0 ? (
          <div className="flex h-[calc(45px+1px)] w-full flex-row items-center justify-center border-x border-b bg-background">
            <p className="text-p2 text-tertiary-foreground">No transactions</p>
          </div>
        ) : (
          transactionHistory.map((poolTransactionHistory, index) => (
            <Fragment key={index}>
              {poolTransactionHistory.map((transaction, transactionIndex) => (
                <TransactionHistoryRow
                  key={transaction.timestamp}
                  columnStyleMap={columnStyleMap}
                  prevTransaction={poolTransactionHistory[transactionIndex - 1]}
                  transaction={transaction}
                  nextTransaction={poolTransactionHistory[transactionIndex + 1]}
                  hasPoolColumn={hasPoolColumn}
                />
              ))}
              {index !== transactionHistory.length - 1 && (
                <div className="h-[3px] w-full bg-border" />
              )}
            </Fragment>
          ))
        )}
      </div>
    </div>
  );
}
