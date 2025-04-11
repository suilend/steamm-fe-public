import { CSSProperties, useMemo, useState } from "react";

import { ClassValue } from "clsx";
import { useLocalStorage } from "usehooks-ts";

import PointsLeaderboardRow from "@/components/points/PointsLeaderboardRow";
import HeaderColumn, { SortDirection } from "@/components/TableHeaderColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardRowData } from "@/contexts/PointsContext";
import { cn } from "@/lib/utils";

type Column = "rank" | "address" | "totalPoints" | "pointsPerDay";
type SortableColumn = "totalPoints" | "pointsPerDay";

export const columnStyleMap: Record<Column, CSSProperties> = {
  rank: {
    width: 100, // px
    paddingLeft: 4 * 5, // px
  },
  address: {
    flex: 1,
    minWidth: 350, // px
    paddingLeft: 4 * 5, // px
  },
  totalPoints: {
    width: 150, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
  pointsPerDay: {
    width: 150, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
};

interface PointsLeaderboardTableProps {
  className?: ClassValue;
  tableId: string;
  rows?: LeaderboardRowData[];
  skeletonRows?: number;
  disableSorting?: boolean;
}

export default function PointsLeaderboardTable({
  className,
  tableId,
  rows,
  skeletonRows,
  disableSorting,
}: PointsLeaderboardTableProps) {
  // Sort
  type SortState = { column: SortableColumn; direction: SortDirection };

  const [sortState, setSortState] = useLocalStorage<SortState | undefined>(
    `PointsLeaderboardTable_${tableId}_sortState`,
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
    if (disableSorting) return rows;

    return rows.slice().sort((a, b) => {
      if (sortState.column === "totalPoints") {
        return sortState.direction === SortDirection.DESC
          ? +b.totalPoints.minus(a.totalPoints)
          : +a.totalPoints.minus(b.totalPoints);
      } else if (sortState.column === "pointsPerDay") {
        return sortState.direction === SortDirection.DESC
          ? +b.pointsPerDay.minus(a.pointsPerDay)
          : +a.pointsPerDay.minus(b.pointsPerDay);
      }

      return 0; // Should never reach here
    });
  }, [rows, disableSorting, sortState]);

  // Pagination
  const pageSize = 100;

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
    <>
      {/* Table */}
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-0 z-[2] border" />

        <div className={cn("relative z-[1] w-full overflow-auto", className)}>
          {/* Header */}
          <div className="sticky left-0 top-0 z-[2] flex h-[calc(1px+40px+1px)] w-full min-w-max shrink-0 flex-row border bg-secondary">
            <HeaderColumn<Column, SortableColumn>
              id="rank"
              style={columnStyleMap.rank}
            >
              Rank
            </HeaderColumn>

            <HeaderColumn<Column, SortableColumn>
              id="address"
              style={columnStyleMap.address}
            >
              Address
            </HeaderColumn>

            <HeaderColumn<Column, SortableColumn>
              id="totalPoints"
              sortState={disableSorting ? undefined : sortState}
              toggleSortByColumn={
                disableSorting ? undefined : toggleSortByColumn
              }
              style={columnStyleMap.totalPoints}
            >
              Total points
            </HeaderColumn>

            <HeaderColumn<Column, SortableColumn>
              id="pointsPerDay"
              sortState={disableSorting ? undefined : sortState}
              toggleSortByColumn={
                disableSorting ? undefined : toggleSortByColumn
              }
              style={columnStyleMap.pointsPerDay}
            >
              Points per day
            </HeaderColumn>
          </div>

          {/* Rows */}
          {pageRows === undefined ? (
            Array.from({ length: skeletonRows ?? 3 }).map((_, index) => (
              <Skeleton
                key={index}
                className="relative z-[1] h-[calc(53px+1px)] w-full border-x border-b"
              />
            ))
          ) : pageRows.length === 0 ? (
            <div className="flex h-[calc(53px+1px)] w-full flex-row items-center justify-center border-x border-b bg-background">
              <p className="text-p2 text-tertiary-foreground">No data</p>
            </div>
          ) : (
            pageRows.map((row) => (
              <PointsLeaderboardRow key={row.address} row={row} />
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {pageIndexes && pageIndexes.length > 1 && (
        <div className="flex w-full flex-row items-center justify-center gap-2">
          {pageIndexes.map((_pageIndex) => (
            <button
              key={_pageIndex}
              className={cn(
                "flex h-10 w-10 flex-row items-center justify-center rounded-md border transition-colors",
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
    </>
  );
}
