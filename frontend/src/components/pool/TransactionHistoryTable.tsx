import { CSSProperties, useMemo } from "react";

import { ClassValue } from "clsx";
import { useLocalStorage } from "usehooks-ts";

import TransactionHistoryRow from "@/components/pool/TransactionHistoryRow";
import HeaderColumn, { SortDirection } from "@/components/TableHeaderColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoryDeposit, HistoryRedeem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Column = "date" | "type" | "amounts" | "digest";
type SortableColumn = "date";

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

interface PoolsTableProps {
  className?: ClassValue;
  transactionHistory?: (HistoryDeposit | HistoryRedeem)[];
}

export default function TransactionHistoryTable({
  className,
  transactionHistory,
}: PoolsTableProps) {
  // Sort
  type SortState = { column: SortableColumn; direction: SortDirection };

  const [sortState, setSortState] = useLocalStorage<SortState | undefined>(
    `TransactionHistoryTable_sortState`,
    undefined,
  );

  const toggleSortByColumn = (column: SortableColumn) => {
    setSortState((prev) => {
      if (prev === undefined || prev.column !== column)
        return { column, direction: SortDirection.DESC };

      if (prev.direction === SortDirection.DESC)
        return { column, direction: SortDirection.ASC };
      else return undefined;
    });
  };

  const sortedTransactionHistory = useMemo(() => {
    if (transactionHistory === undefined || sortState === undefined)
      return transactionHistory;

    return transactionHistory.slice().sort((a, b) => {
      if (["date"].includes(sortState.column)) {
        return sortState.direction === SortDirection.DESC
          ? new Date(+b.timestamp * 1000).getTime() -
              new Date(+a.timestamp * 1000).getTime()
          : new Date(+a.timestamp * 1000).getTime() -
              new Date(+b.timestamp * 1000).getTime();
      }

      return 0; // Should never reach here
    });
  }, [transactionHistory, sortState]);

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-0 z-[2] border" />

      <div className={cn("relative z-[1] w-full overflow-auto", className)}>
        {/* Header */}
        <div className="sticky left-0 top-0 z-[2] flex h-[calc(1px+40px+1px)] w-full min-w-max shrink-0 flex-row border bg-secondary">
          <HeaderColumn<Column, SortableColumn>
            id="date"
            sortState={sortState}
            toggleSortByColumn={toggleSortByColumn}
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
        {sortedTransactionHistory === undefined ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              className="relative z-[1] h-[calc(44px+1px)] w-full border-x border-b"
            />
          ))
        ) : sortedTransactionHistory.length === 0 ? (
          <div className="flex h-[calc(44px+1px)] w-full flex-row items-center justify-center border-x border-b bg-background">
            <p className="text-p2 text-tertiary-foreground">No transactions</p>
          </div>
        ) : (
          sortedTransactionHistory.map((transaction) => (
            <TransactionHistoryRow
              key={transaction.id}
              transaction={transaction}
            />
          ))
        )}
      </div>
    </div>
  );
}
