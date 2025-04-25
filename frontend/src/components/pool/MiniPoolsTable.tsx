import { CSSProperties, useMemo } from "react";

import { ClassValue } from "clsx";
import { useLocalStorage } from "usehooks-ts";

import MiniPoolRow from "@/components/pool/MiniPoolRow";
import HeaderColumn, { SortDirection } from "@/components/TableHeaderColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { ParsedPool } from "@/lib/types";
import { cn } from "@/lib/utils";

type Column = "pool" | "tvlUsd" | "volumeUsd_24h" | "aprPercent_24h";
type SortableColumn = "tvlUsd" | "volumeUsd_24h" | "aprPercent_24h";

export const columnStyleMap: Record<Column, CSSProperties> = {
  pool: {
    flex: 2,
    minWidth: 250, // px
    paddingLeft: 4 * 5, // px
  },
  tvlUsd: {
    flex: 1,
    width: 150, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
  volumeUsd_24h: {
    flex: 1,
    minWidth: 150, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
  aprPercent_24h: {
    flex: 1,
    minWidth: 175, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
};

interface MiniPoolsTableProps {
  className?: ClassValue;
  tableId: string;
  pools?: ParsedPool[];
  tvlOnly?: boolean;
}

export default function MiniPoolsTable({
  className,
  tableId,
  pools,
  tvlOnly,
}: MiniPoolsTableProps) {
  // Sort
  type SortState = { column: SortableColumn; direction: SortDirection };

  const [sortState, setSortState] = useLocalStorage<SortState | undefined>(
    `MiniPoolsTable_${tableId}_sortState`,
    { column: "tvlUsd", direction: SortDirection.DESC },
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

  const sortedPools = useMemo(() => {
    if (pools === undefined || sortState === undefined) return pools;

    const sortedPools = pools
      .slice()
      .sort((a, b) =>
        sortState.direction === SortDirection.DESC
          ? +b[sortState.column]! - +a[sortState.column]!
          : +a[sortState.column]! - +b[sortState.column]!,
      );

    return sortedPools;
  }, [pools, sortState]);

  return (
    <div className="relative w-full overflow-hidden rounded-md">
      <div className="pointer-events-none absolute inset-0 z-[2] rounded-md border" />

      <div className={cn("relative z-[1] w-full overflow-auto", className)}>
        {/* Header */}
        <div className="sticky left-0 top-0 z-[2] flex h-[calc(1px+40px+1px)] w-full min-w-max shrink-0 flex-row border bg-secondary">
          <HeaderColumn<Column, SortableColumn>
            id="pool"
            style={columnStyleMap.pool}
          >
            Pool
          </HeaderColumn>

          <HeaderColumn<Column, SortableColumn>
            id="tvlUsd"
            sortState={sortState}
            toggleSortByColumn={toggleSortByColumn}
            style={columnStyleMap.tvlUsd}
          >
            TVL
          </HeaderColumn>

          {!tvlOnly && (
            <HeaderColumn<Column, SortableColumn>
              id="volumeUsd_24h"
              sortState={sortState}
              toggleSortByColumn={
                (pools ?? []).every(
                  (pool) => !!pool.volumeUsd_24h !== undefined,
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

          {!tvlOnly && (
            <HeaderColumn<Column, SortableColumn>
              id="aprPercent_24h"
              sortState={sortState}
              toggleSortByColumn={
                (pools ?? []).every(
                  (pool) => !!pool.aprPercent_24h !== undefined,
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
        </div>

        {/* Rows */}
        {sortedPools === undefined ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              className="relative z-[1] h-[calc(56px+1px)] w-full border-x border-b"
            />
          ))
        ) : sortedPools.length === 0 ? (
          <div className="flex h-[calc(56px+1px)] w-full flex-row items-center justify-center border-x border-b bg-background">
            <p className="text-p2 text-tertiary-foreground">No pools</p>
          </div>
        ) : (
          sortedPools.map((pool) => (
            <MiniPoolRow key={pool.id} pool={pool} tvlOnly={tvlOnly} />
          ))
        )}
      </div>
    </div>
  );
}
