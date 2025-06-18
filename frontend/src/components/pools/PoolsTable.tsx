import { CSSProperties, useMemo, useState } from "react";

import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";
import { useLocalStorage } from "usehooks-ts";

import PoolGroupRow from "@/components/pools/PoolGroupRow";
import PoolRow from "@/components/pools/PoolRow";
import HeaderColumn, { SortDirection } from "@/components/TableHeaderColumn";
import { Skeleton } from "@/components/ui/skeleton";
import useBreakpoint from "@/hooks/useBreakpoint";
import { PoolGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

export type Column = "pool" | "tvlUsd" | "volumeUsd_24h" | "aprPercent_24h";
type SortableColumn = "tvlUsd" | "volumeUsd_24h" | "aprPercent_24h";

interface PoolsTableProps {
  className?: ClassValue;
  containerClassName?: ClassValue;
  tableContainerClassName?: ClassValue;
  tableId: string;
  poolGroups?: PoolGroup[];
  searchString?: string;
  isFlat?: boolean;
  isTvlOnly?: boolean;
  noDefaultSort?: boolean;
  disableSorting?: boolean;
  pageSize?: number;
}

export default function PoolsTable({
  className,
  containerClassName,
  tableContainerClassName,
  tableId,
  poolGroups,
  searchString,
  isFlat,
  isTvlOnly,
  noDefaultSort,
  disableSorting,
  pageSize = 100,
}: PoolsTableProps) {
  const { md } = useBreakpoint();

  // Columns
  const columnStyleMap: Record<
    Column,
    { cell: CSSProperties; children: CSSProperties }
  > = useMemo(
    () => ({
      pool: {
        cell: { textAlign: "left" },
        children: {
          paddingLeft: 4 * 5, // px
          paddingRight: 4 * 5, // px
          justifyContent: "start",
        },
      },
      tvlUsd: {
        cell: { textAlign: "right" },
        children: {
          paddingRight: 4 * 5, // px
          justifyContent: "end",
        },
      },
      volumeUsd_24h: {
        cell: { textAlign: "right" },
        children: {
          paddingRight: 4 * 5, // px
          justifyContent: "end",
        },
      },
      aprPercent_24h: {
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
    `PoolsTable_${tableId}_sortState`,
    noDefaultSort
      ? undefined
      : { column: "tvlUsd", direction: SortDirection.DESC },
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

  const sortedPoolGroups = useMemo(() => {
    if (poolGroups === undefined || sortState === undefined) return poolGroups;

    const sortedPoolGroups = poolGroups.map((poolGroup) => ({
      ...poolGroup,
      pools: poolGroup.pools
        .slice()
        .sort((a, b) =>
          sortState.direction === SortDirection.DESC
            ? +b[sortState.column]! - +a[sortState.column]!
            : +a[sortState.column]! - +b[sortState.column]!,
        ),
    }));
    if (
      !sortedPoolGroups.every(
        (poolGroup) =>
          !!poolGroup.pools.every(
            (pool) => pool[sortState.column] !== undefined,
          ),
      )
    )
      return sortedPoolGroups;

    return sortedPoolGroups.slice().sort((a, b) => {
      if (["tvlUsd", "volumeUsd_24h"].includes(sortState.column)) {
        const aTotal = a.pools.reduce(
          (acc, pool) => acc.plus(pool[sortState.column] as BigNumber),
          new BigNumber(0),
        );
        const bTotal = b.pools.reduce(
          (acc, pool) => acc.plus(pool[sortState.column] as BigNumber),
          new BigNumber(0),
        );

        return sortState.direction === SortDirection.DESC
          ? +bTotal.minus(aTotal)
          : +aTotal.minus(bTotal);
      } else if (sortState.column === "aprPercent_24h") {
        const aMaxAprPercent_24h = BigNumber.max(
          ...a.pools.map((pool) => pool.aprPercent_24h as BigNumber),
        );
        const bMaxAprPercent_24h = BigNumber.max(
          ...b.pools.map((pool) => pool.aprPercent_24h as BigNumber),
        );

        return sortState.direction === SortDirection.DESC
          ? +bMaxAprPercent_24h.minus(aMaxAprPercent_24h)
          : +aMaxAprPercent_24h.minus(bMaxAprPercent_24h);
      }

      return 0; // Should never reach here
    });
  }, [poolGroups, sortState]);

  // Pagination
  const [pageIndex, setPageIndex] = useState<number>(0);
  const pageIndexes: number[] | undefined = useMemo(() => {
    if (sortedPoolGroups === undefined) return undefined;

    const pageCount = Math.ceil(sortedPoolGroups.length / pageSize);
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
  }, [sortedPoolGroups, pageSize, pageIndex]);

  const pageRows = useMemo(
    () =>
      sortedPoolGroups === undefined
        ? undefined
        : sortedPoolGroups.slice(
            pageSize * pageIndex,
            pageSize * pageIndex + pageSize,
          ),
    [sortedPoolGroups, pageSize, pageIndex],
  );

  return (
    <div className={cn("relative w-full", className)}>
      {/* Table */}
      <div
        className={cn(
          "relative z-[2] w-full overflow-hidden rounded-md",
          containerClassName,
        )}
      >
        <div className="pointer-events-none absolute inset-0 z-[2] rounded-md border" />

        <div
          className={cn(
            "relative z-[1] w-full overflow-auto",
            tableContainerClassName,
          )}
        >
          <table className="w-full">
            <tbody>
              {/* Header */}
              {md && (
                <tr className="h-[calc(1px+40px+1px)] border bg-secondary">
                  <HeaderColumn<Column, SortableColumn>
                    id="pool"
                    style={columnStyleMap.pool}
                  >
                    Pool
                  </HeaderColumn>

                  <HeaderColumn<Column, SortableColumn>
                    id="tvlUsd"
                    sortState={sortState}
                    toggleSortByColumn={
                      disableSorting ? undefined : toggleSortByColumn
                    }
                    style={columnStyleMap.tvlUsd}
                  >
                    TVL
                  </HeaderColumn>

                  {!isTvlOnly && (
                    <HeaderColumn<Column, SortableColumn>
                      id="volumeUsd_24h"
                      sortState={sortState}
                      toggleSortByColumn={
                        disableSorting
                          ? undefined
                          : (poolGroups ?? []).every(
                                (poolGroup) =>
                                  !!poolGroup.pools.every(
                                    (pool) => pool.volumeUsd_24h !== undefined,
                                  ),
                              )
                            ? toggleSortByColumn
                            : undefined
                      }
                      titleEndDecorator="24H"
                      style={columnStyleMap.volumeUsd_24h}
                    >
                      Volume
                    </HeaderColumn>
                  )}

                  {!isTvlOnly && (
                    <HeaderColumn<Column, SortableColumn>
                      id="aprPercent_24h"
                      sortState={sortState}
                      toggleSortByColumn={
                        disableSorting
                          ? undefined
                          : (poolGroups ?? []).every(
                                (poolGroup) =>
                                  !!poolGroup.pools.every(
                                    (pool) => pool.aprPercent_24h !== undefined,
                                  ),
                              )
                            ? toggleSortByColumn
                            : undefined
                      }
                      titleEndDecorator="24H"
                      style={columnStyleMap.aprPercent_24h}
                    >
                      APR
                    </HeaderColumn>
                  )}
                </tr>
              )}

              {/* Rows */}
              {pageRows === undefined ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr
                    key={index}
                    className="h-[calc(56px+1px)] border-x border-b"
                  >
                    <td colSpan={10}>
                      <Skeleton className="h-[56px]" />
                    </td>
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr className="h-[calc(56px+1px)] border-x border-b bg-background">
                  <td colSpan={10}>
                    <p className="text-center text-p2 text-tertiary-foreground">
                      {searchString
                        ? `No results for "${searchString}"`
                        : "No pools"}
                    </p>
                  </td>
                </tr>
              ) : (
                <>
                  {isFlat ? (
                    pageRows
                      .map((poolGroup) => poolGroup.pools)
                      .flat()
                      .map((pool) => (
                        <PoolRow
                          key={pool.id}
                          columnStyleMap={columnStyleMap}
                          pool={pool}
                          isTvlOnly={isTvlOnly}
                        />
                      ))
                  ) : (
                    <>
                      {pageRows.map((poolGroup) =>
                        poolGroup.pools.length === 1 ? (
                          <PoolRow
                            key={poolGroup.id}
                            columnStyleMap={columnStyleMap}
                            pool={poolGroup.pools[0]}
                            isTvlOnly={isTvlOnly}
                          />
                        ) : (
                          <PoolGroupRow
                            key={poolGroup.id}
                            columnStyleMap={columnStyleMap}
                            tableId={tableId}
                            poolGroup={poolGroup}
                            isTvlOnly={isTvlOnly}
                          />
                        ),
                      )}
                    </>
                  )}
                </>
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
