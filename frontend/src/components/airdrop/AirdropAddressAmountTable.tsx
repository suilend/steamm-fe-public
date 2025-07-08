import { CSSProperties, useMemo, useState } from "react";

import { useLocalStorage } from "usehooks-ts";

import { Token } from "@suilend/sui-fe";

import AirdropAddressAmountRow from "@/components/airdrop/AirdropAddressAmountRow";
import HeaderColumn, { SortDirection } from "@/components/TableHeaderColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { AirdropRow } from "@/lib/airdrop";
import { cn } from "@/lib/utils";

export type Column = "number" | "address" | "amount";
type SortableColumn = "amount";

interface AirdropAddressAmountTableProps {
  token: Token;
  rows?: AirdropRow[];
}

export default function AirdropAddressAmountTable({
  token,
  rows,
}: AirdropAddressAmountTableProps) {
  // Columns
  const columnStyleMap: Record<
    Column,
    { cell: CSSProperties; children: CSSProperties }
  > = useMemo(
    () => ({
      number: {
        cell: { textAlign: "left" },
        children: {
          paddingLeft: 4 * 5, // px
          justifyContent: "start",
        },
      },
      address: {
        cell: { textAlign: "left" },
        children: {
          paddingLeft: 4 * 5, // px
          paddingRight: 4 * 5, // px
          justifyContent: "start",
        },
      },
      amount: {
        cell: { textAlign: "right" },
        children: {
          paddingRight: 4 * 5, // px
          justifyContent: "end",
        },
      },
    }),
    [],
  );

  // Sort
  type SortState = { column: SortableColumn; direction: SortDirection };

  const [sortState, setSortState] = useLocalStorage<SortState | undefined>(
    "AirdropAddressAmountTable_sortState",
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

  const sortedRows = useMemo(() => {
    if (rows === undefined || sortState === undefined) return rows;

    return rows.slice().sort((a, b) => {
      if (sortState.column === "amount") {
        return sortState.direction === SortDirection.DESC
          ? +b.amount - +a.amount
          : +a.amount - +b.amount;
      }

      return 0; // Should never reach here
    });
  }, [rows, sortState]);

  // Pagination
  const pageSize = 5;

  const [pageIndex, setPageIndex] = useState<number>(0);
  const pageIndexes: number[] | undefined = useMemo(() => {
    if (sortedRows === undefined) return undefined;

    const pageCount = Math.ceil(sortedRows.length / pageSize);
    const lastPageIndex = pageCount - 1;

    if (pageCount < 7)
      return Array.from({ length: pageCount }).map((_, index) => index);

    // First three pages
    if (pageIndex <= 2) return [0, 1, 2, 3, 4, 5, lastPageIndex];

    // Last three pages
    if (pageIndex >= lastPageIndex - 2)
      return [
        0,
        lastPageIndex - 5,
        lastPageIndex - 4,
        lastPageIndex - 3,
        lastPageIndex - 2,
        lastPageIndex - 1,
        lastPageIndex,
      ];

    return [
      0,
      pageIndex - 2,
      pageIndex - 1,
      pageIndex,
      pageIndex + 1,
      pageIndex + 2,
      lastPageIndex,
    ];
  }, [sortedRows, pageIndex]);

  const pageRows = useMemo(
    () =>
      sortedRows === undefined
        ? undefined
        : sortedRows.slice(
            pageSize * pageIndex,
            pageSize * pageIndex + pageSize,
          ),
    [sortedRows, pageIndex],
  );

  return (
    <div className="pointer-events-auto relative w-full">
      {/* Table */}
      <div className="relative z-[2] w-full overflow-hidden rounded-md">
        <div className="pointer-events-none absolute inset-0 z-[2] rounded-md border" />

        <div className="relative z-[1] w-full overflow-auto">
          <table className="w-full">
            <tbody>
              {/* Header */}
              <tr className="h-[calc(1px+40px+1px)] border bg-secondary">
                <HeaderColumn<Column, SortableColumn>
                  id="number"
                  style={columnStyleMap.number}
                >
                  #
                </HeaderColumn>

                <HeaderColumn<Column, SortableColumn>
                  id="address"
                  style={columnStyleMap.address}
                >
                  Address
                </HeaderColumn>

                <HeaderColumn<Column, SortableColumn>
                  id="amount"
                  sortState={sortState}
                  toggleSortByColumn={toggleSortByColumn}
                  style={columnStyleMap.amount}
                >
                  Amount
                </HeaderColumn>
              </tr>

              {/* Rows */}
              {pageRows === undefined ? (
                Array.from({ length: pageSize }).map((_, index) => (
                  <tr
                    key={index}
                    className="h-[calc(45px+1px)] border-x border-b"
                  >
                    <td colSpan={10}>
                      <Skeleton className="h-[45px]" />
                    </td>
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr className="h-[calc(45px+1px)] border-x border-b bg-background">
                  <td colSpan={10}>
                    <p className="text-center text-p2 text-tertiary-foreground">
                      No data
                    </p>
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <AirdropAddressAmountRow
                    key={row.address}
                    columnStyleMap={columnStyleMap}
                    token={token}
                    row={row}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pageIndexes && pageIndexes.length > 1 && (
        <div className="relative z-[1] mt-4 flex w-full flex-row items-center justify-center gap-2">
          {pageIndexes.map((_pageIndex) => (
            <button
              key={_pageIndex}
              className={cn(
                "flex h-10 min-w-10 flex-row items-center justify-center rounded-md border px-2.5 transition-colors",
                _pageIndex === pageIndex
                  ? "cursor-default border-button-1 bg-button-1/25"
                  : "hover:bg-border/50",
              )}
              onClick={
                _pageIndex === pageIndex
                  ? undefined
                  : () => setPageIndex(_pageIndex)
              }
            >
              <p className="text-p2 text-foreground">{_pageIndex + 1}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
