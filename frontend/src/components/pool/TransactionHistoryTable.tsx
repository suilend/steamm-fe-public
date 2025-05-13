import { CSSProperties, Fragment, useMemo } from "react";

import TransactionHistoryRow from "@/components/pool/TransactionHistoryRow";
import HeaderColumn from "@/components/TableHeaderColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoryDeposit, HistorySwap, HistoryWithdraw } from "@/lib/types";

export type Column = "date" | "type" | "pool" | "amounts" | "digest";
type SortableColumn = "";

interface TransactionHistoryTableProps {
  transactionHistory?: (HistoryDeposit | HistoryWithdraw | HistorySwap)[][];
  hasPoolColumn?: boolean;
}

export default function TransactionHistoryTable({
  transactionHistory,
  hasPoolColumn,
}: TransactionHistoryTableProps) {
  // Columns
  const columnStyleMap: Record<
    Column,
    { cell: CSSProperties; children: CSSProperties }
  > = useMemo(
    () => ({
      date: {
        cell: { textAlign: "left" },
        children: {
          paddingLeft: 4 * 5, // px
          justifyContent: "start",
        },
      },
      type: {
        cell: { textAlign: "left" },
        children: {
          paddingLeft: 4 * 5, // px
          justifyContent: "start",
        },
      },
      pool: {
        cell: { textAlign: "left" },
        children: {
          paddingLeft: 4 * 5, // px
          justifyContent: "start",
        },
      },
      amounts: {
        cell: { textAlign: "left" },
        children: {
          paddingLeft: 4 * 5, // px
          paddingRight: 4 * 5, // px
          justifyContent: "start",
        },
      },
      digest: {
        cell: { textAlign: "right" },
        children: {
          paddingRight: 4 * 5, // px
          justifyContent: "end",
        },
      },
    }),
    [],
  );

  return (
    <div className="relative w-full overflow-hidden rounded-md">
      <div className="pointer-events-none absolute inset-0 z-[2] rounded-md border" />

      <div className="relative z-[1] w-full overflow-auto">
        <table className="w-full">
          {/* Header */}
          <tr className="h-[calc(1px+40px+1px)] border bg-secondary">
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
          </tr>

          {/* Rows */}
          {transactionHistory === undefined ? (
            Array.from({ length: 3 }).map((_, index) => (
              <tr key={index} className="h-[calc(45px+1px)] border-x border-b">
                <td colSpan={10}>
                  <Skeleton className="h-[45px]" />
                </td>
              </tr>
            ))
          ) : transactionHistory.length === 0 ? (
            <tr className="h-[calc(45px+1px)] border-x border-b bg-background">
              <td colSpan={10}>
                <p className="text-center text-p2 text-tertiary-foreground">
                  No transactions
                </p>
              </td>
            </tr>
          ) : (
            transactionHistory.map((poolTransactionHistory, index) => (
              <Fragment key={index}>
                {poolTransactionHistory.map((transaction, transactionIndex) => (
                  <TransactionHistoryRow
                    key={transaction.timestamp}
                    columnStyleMap={columnStyleMap}
                    prevTransaction={
                      poolTransactionHistory[transactionIndex - 1]
                    }
                    transaction={transaction}
                    nextTransaction={
                      poolTransactionHistory[transactionIndex + 1]
                    }
                    hasPoolColumn={hasPoolColumn}
                  />
                ))}
                {index !== transactionHistory.length - 1 && (
                  <tr>
                    <td className="h-[3px] bg-border" colSpan={10} />
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </table>
      </div>
    </div>
  );
}
