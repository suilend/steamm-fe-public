import { CSSProperties, useMemo } from "react";

import BigNumber from "bignumber.js";
import { useLocalStorage } from "usehooks-ts";

import PoolGroupRow from "@/components/pools/PoolGroupRow";
import PoolRow from "@/components/pools/PoolRow";
import HeaderColumn, { SortDirection } from "@/components/TableHeaderColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { PoolGroup } from "@/lib/types";

export type Column = "pool" | "tvlUsd" | "volumeUsd_24h" | "aprPercent_24h";
type SortableColumn = "tvlUsd" | "volumeUsd_24h" | "aprPercent_24h";

interface PoolsTableProps {
  tableId: string;
  poolGroups?: PoolGroup[];
  searchString?: string;
  isFlat?: boolean;
  isTvlOnly?: boolean;
}

export default function PoolsTable({
  tableId,
  poolGroups,
  searchString,
  isFlat,
  isTvlOnly,
}: PoolsTableProps) {
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

  return (
    <div className="relative w-full overflow-hidden rounded-md">
      <div className="pointer-events-none absolute inset-0 z-[2] rounded-md border" />

      <div className="relative z-[1] w-full overflow-auto">
        <table className="w-full">
          <tbody>
            {/* Header */}
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
                toggleSortByColumn={toggleSortByColumn}
                style={columnStyleMap.tvlUsd}
              >
                TVL
              </HeaderColumn>

              {!isTvlOnly && (
                <HeaderColumn<Column, SortableColumn>
                  id="volumeUsd_24h"
                  sortState={sortState}
                  toggleSortByColumn={
                    (poolGroups ?? []).every(
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
                    (poolGroups ?? []).every(
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

            {/* Rows */}
            {sortedPoolGroups === undefined ? (
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
            ) : sortedPoolGroups.length === 0 ? (
              <tr className="h-[calc(56px+1px)] border-x border-b bg-background">
                <td colSpan={10}>
                  <p className="text-center text-p2 text-tertiary-foreground">
                    {searchString
                      ? `No matches for "${searchString}"`
                      : "No pools"}
                  </p>
                </td>
              </tr>
            ) : (
              <>
                {isFlat ? (
                  sortedPoolGroups
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
                    {sortedPoolGroups.map((poolGroup) =>
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
  );
}
