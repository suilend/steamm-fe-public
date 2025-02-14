import { CSSProperties, useMemo, useState } from "react";

import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";

import PoolGroupRow from "@/components/pools/PoolGroupRow";
import HeaderColumn, { SortDirection } from "@/components/TableHeaderColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { PoolGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

type Column = "pair" | "type" | "tvlUsd" | "volumeUsd" | "aprPercent";
type SortableColumn = "tvlUsd" | "volumeUsd" | "aprPercent";

export const columnStyleMap: Record<Column, CSSProperties> = {
  pair: {
    flex: 2,
    minWidth: 280, // px
    paddingLeft: 4 * 5, // px
  },
  type: {
    width: 150, // px
    minWidth: 150, // px
    paddingLeft: 4 * 5, // px
  },
  tvlUsd: {
    flex: 1,
    minWidth: 120, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
  volumeUsd: {
    flex: 1,
    minWidth: 120, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
  aprPercent: {
    flex: 1,
    minWidth: 120, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
};

interface PoolsTableProps {
  className?: ClassValue;
  tableId: string;
  poolGroups?: PoolGroup[];
}

export default function PoolsTable({
  className,
  tableId,
  poolGroups,
}: PoolsTableProps) {
  // Sort
  type SortState = { column: SortableColumn; direction: SortDirection };

  const [sortState, setSortState] = useState<SortState | undefined>(undefined);

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
      .sort((a, b) => {
        if (sortState.column === "aprPercent") {
          return sortState.direction === SortDirection.DESC
            ? +b.apr.percent.minus(a.apr.percent)
            : +a.apr.percent.minus(b.apr.percent);
        }

        return sortState.direction === SortDirection.DESC
          ? +b[sortState.column].minus(a[sortState.column])
          : +a[sortState.column].minus(b[sortState.column]);
      });

    return poolGroups
      .map((poolGroup) => ({
        ...poolGroup,
        pools: sortedPools.filter(
          (pool) =>
            pool.coinTypes[0] === poolGroup.coinTypes[0] &&
            pool.coinTypes[1] === poolGroup.coinTypes[1],
        ),
      }))
      .sort((a, b) => {
        if (sortState.column === "aprPercent") {
          const aMaxAprPercent = BigNumber.max(
            ...a.pools.map((pool) => pool.apr.percent),
          );
          const bMaxAprPercent = BigNumber.max(
            ...b.pools.map((pool) => pool.apr.percent),
          );

          return sortState.direction === SortDirection.DESC
            ? +bMaxAprPercent.minus(aMaxAprPercent)
            : +aMaxAprPercent.minus(bMaxAprPercent);
        }

        const aTotal = a.pools.reduce(
          (acc, pool) => acc.plus(pool.tvlUsd),
          new BigNumber(0),
        );
        const bTotal = b.pools.reduce(
          (acc, pool) => acc.plus(pool.tvlUsd),
          new BigNumber(0),
        );

        return sortState.direction === SortDirection.DESC
          ? +bTotal.minus(aTotal)
          : +aTotal.minus(bTotal);
      });
  }, [poolGroups, sortState]);

  return (
    <div
      className={cn(
        "relative w-full overflow-auto rounded-md border bg-background",
        className,
      )}
    >
      {/* Header */}
      <div className="sticky left-0 top-0 z-[2] flex h-[calc(40px+1px)] w-full min-w-max shrink-0 flex-row border-b bg-secondary">
        <HeaderColumn<Column, SortableColumn>
          id="pair"
          style={columnStyleMap.pair}
        >
          Pair
        </HeaderColumn>
        <HeaderColumn<Column, SortableColumn>
          id="type"
          style={columnStyleMap.type}
        >
          Type
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
          id="volumeUsd"
          sortState={sortState}
          toggleSortByColumn={toggleSortByColumn}
          style={columnStyleMap.volumeUsd}
        >
          Volume (24H)
        </HeaderColumn>
        <HeaderColumn<Column, SortableColumn>
          id="aprPercent"
          sortState={sortState}
          toggleSortByColumn={toggleSortByColumn}
          style={columnStyleMap.aprPercent}
        >
          APR (24H)
        </HeaderColumn>
      </div>

      {/* Rows */}
      {sortedPoolGroups === undefined ? (
        Array.from({ length: 3 }).map((_, index, array) => (
          <Skeleton
            key={index}
            className={cn(
              "relative z-[1] h-[56px] w-full",
              index !== array.length - 1 && "h-[calc(56px+1px)] border-b",
            )}
          />
        ))
      ) : sortedPoolGroups.length === 0 ? (
        <div className="flex h-[56px] w-full flex-row items-center justify-center">
          <p className="text-p2 text-tertiary-foreground">No pools</p>
        </div>
      ) : (
        sortedPoolGroups.map((poolGroup, index, array) => (
          <PoolGroupRow
            key={poolGroup.id}
            tableId={tableId}
            poolGroup={poolGroup}
            isLast={index === array.length - 1}
          />
        ))
      )}
    </div>
  );
}
