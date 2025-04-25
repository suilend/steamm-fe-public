import { CSSProperties, Fragment } from "react";

import { ClassValue } from "clsx";

import TransactionHistoryRow from "@/components/pool/TransactionHistoryRow";
import HeaderColumn from "@/components/TableHeaderColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoryDeposit, HistoryRedeem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Column = "date" | "type" | "amounts" | "digest";
type SortableColumn = "";

export const columnStyleMap: Record<Column, CSSProperties> = {
  date: {
    width: 200, // px
    paddingLeft: 4 * 5, // px
  },
  type: {
    width: 125, // px
    paddingLeft: 4 * 5, // px
  },
  amounts: {
    flex: 1,
    minWidth: 300, // px
    paddingLeft: 4 * 5, // px
  },
  digest: {
    width: 50, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
};

interface TransactionHistoryTableProps {
  className?: ClassValue;
  transactionHistory?: (HistoryDeposit | HistoryRedeem)[][];
}

export default function TransactionHistoryTable({
  className,
  transactionHistory,
}: TransactionHistoryTableProps) {
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
              className="relative z-[1] h-[calc(44px+1px)] w-full border-x border-b"
            />
          ))
        ) : transactionHistory.length === 0 ? (
          <div className="flex h-[calc(44px+1px)] w-full flex-row items-center justify-center border-x border-b bg-background">
            <p className="text-p2 text-tertiary-foreground">No transactions</p>
          </div>
        ) : (
          transactionHistory.map((poolTransactionHistory, index) => (
            <Fragment key={index}>
              {poolTransactionHistory.map((transaction) => (
                <TransactionHistoryRow
                  key={transaction.id}
                  transaction={transaction}
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
