import { CSSProperties, useMemo } from "react";

import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";
import { useLocalStorage } from "usehooks-ts";

import PoolGroupRow from "@/components/pools/PoolGroupRow";
import PoolRow from "@/components/pools/PoolRow";
import HeaderColumn, { SortDirection } from "@/components/TableHeaderColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { PoolGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

type Column =
  | "pair"
  | "feeTier"
  | "tvlUsd"
  | "volumeUsd_24h"
  | "aprPercent_24h";
type SortableColumn = "tvlUsd" | "volumeUsd_24h" | "aprPercent_24h";

export const columnStyleMap: Record<Column, CSSProperties> = {
  pair: {
    flex: 2,
    minWidth: 350, // px
    paddingLeft: 4 * 5, // px
  },
  feeTier: {
    width: 100, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
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

interface PoolsTableProps {
  className?: ClassValue;
  tableId: string;
  poolGroups?: PoolGroup[];
  searchString?: string;
}

export default function PoolsTable({
  className,
  tableId,
  poolGroups,
  searchString,
}: PoolsTableProps) {
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

    const sortedPools = poolGroups
      .map((poolGroup) => poolGroup.pools)
      .flat()
      .sort((a, b) =>
        sortState.direction === SortDirection.DESC
          ? +b[sortState.column]! - +a[sortState.column]!
          : +a[sortState.column]! - +b[sortState.column]!,
      );

    const sortedPoolGroups = poolGroups.map((poolGroup) => ({
      ...poolGroup,
      pools: sortedPools.filter(
        (pool) =>
          pool.coinTypes[0] === poolGroup.coinTypes[0] &&
          pool.coinTypes[1] === poolGroup.coinTypes[1],
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
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-0 z-[2] border" />

      <div className={cn("relative z-[1] w-full overflow-auto", className)}>
        {/* Header */}
        <div className="sticky left-0 top-0 z-[2] flex h-[calc(1px+40px+1px)] w-full min-w-max shrink-0 flex-row border bg-secondary">
          <HeaderColumn<Column, SortableColumn>
            id="pair"
            style={columnStyleMap.pair}
          >
            Pair
          </HeaderColumn>

          <HeaderColumn<Column, SortableColumn>
            id="feeTier"
            style={columnStyleMap.feeTier}
          >
            Fee tier
          </HeaderColumn>

          <HeaderColumn<Column, SortableColumn>
            id="tvlUsd"
            sortState={sortState}
            toggleSortByColumn={toggleSortByColumn}
            style={columnStyleMap.tvlUsd}
          >
            TVL
          </HeaderColumn>

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
            style={columnStyleMap.aprPercent_24h}
          >
            APR
          </HeaderColumn>
        </div>

        {/* Rows */}
        {sortedPoolGroups === undefined ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              className="relative z-[1] h-[calc(56px+1px)] w-full border-x border-b"
            />
          ))
        ) : sortedPoolGroups.length === 0 ? (
          <div className="flex h-[calc(56px+1px)] w-full flex-row items-center justify-center border-x border-b bg-background">
            <p className="text-p2 text-tertiary-foreground">
              {searchString ? `No matches for "${searchString}"` : "No pools"}
            </p>
          </div>
        ) : (
          sortedPoolGroups.map((poolGroup) =>
            poolGroup.pools.length === 1 ? (
              <PoolRow
                key={poolGroup.id}
                pool={poolGroup.pools[0]}
                isLastPoolInGroup
              />
            ) : (
              <PoolGroupRow
                key={poolGroup.id}
                tableId={tableId}
                poolGroup={poolGroup}
              />
            ),
          )
        )}
      </div>
    </div>
  );
}
