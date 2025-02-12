import { CSSProperties, PropsWithChildren, useMemo, useState } from "react";

import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";
import { ArrowDown, ArrowUp } from "lucide-react";

import PoolGroupRow from "@/components/PoolGroupRow";
import { Skeleton } from "@/components/ui/skeleton";
import { PoolGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

type Column = "pair" | "type" | "tvlUsd" | "volumeUsd" | "aprPercent";
export const columnStyleMap: Record<Column, CSSProperties> = {
  pair: {
    flex: 2,
    minWidth: 250, // px
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

type SortableColumn = "tvlUsd" | "volumeUsd" | "aprPercent";
enum SortDirection {
  ASC = "asc",
  DESC = "desc",
}
type SortState = { column: SortableColumn; direction: SortDirection };

interface HeaderColumnProps extends PropsWithChildren {
  id: Column;
  sortState?: SortState;
  toggleSortByColumn?: (column: SortableColumn) => void;
}

function HeaderColumn({
  id,
  sortState,
  toggleSortByColumn,
  children,
}: HeaderColumnProps) {
  const isSortable = toggleSortByColumn !== undefined;

  return (
    <div
      className={cn(
        "flex h-full flex-row items-center",
        isSortable && "group cursor-pointer gap-1.5",
      )}
      style={columnStyleMap[id]}
      onClick={
        isSortable ? () => toggleSortByColumn(id as SortableColumn) : undefined
      }
    >
      {sortState?.column === id &&
        (sortState.direction === SortDirection.DESC ? (
          <ArrowDown className="h-4 w-4 text-button-2-foreground" />
        ) : (
          <ArrowUp className="h-4 w-4 text-button-2-foreground" />
        ))}
      <p
        className={cn(
          "!text-p2 text-secondary-foreground transition-colors",
          sortState?.column === id
            ? "text-foreground"
            : "group-hover:text-foreground",
        )}
      >
        {children}
      </p>
    </div>
  );
}

interface PoolsTableProps {
  className?: ClassValue;
  poolGroups?: PoolGroup[];
}

export default function PoolsTable({ className, poolGroups }: PoolsTableProps) {
  // Sort
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
        pools: sortedPools.filter((pool) => pool.poolGroupId === poolGroup.id),
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
        <HeaderColumn id="pair">Pair</HeaderColumn>
        <HeaderColumn id="type">Type</HeaderColumn>
        <HeaderColumn
          id="tvlUsd"
          sortState={sortState}
          toggleSortByColumn={toggleSortByColumn}
        >
          TVL
        </HeaderColumn>
        <HeaderColumn
          id="volumeUsd"
          sortState={sortState}
          toggleSortByColumn={toggleSortByColumn}
        >
          24H Volume
        </HeaderColumn>
        <HeaderColumn
          id="aprPercent"
          sortState={sortState}
          toggleSortByColumn={toggleSortByColumn}
        >
          24H APR
        </HeaderColumn>
      </div>

      {/* Rows */}
      {sortedPoolGroups === undefined
        ? Array.from({ length: 3 }).map((_, index, array) => (
            <Skeleton
              key={index}
              className={cn(
                "relative z-[1] h-[56px] w-full",
                index !== array.length - 1 && "h-[calc(56px+1px)] border-b",
              )}
            />
          ))
        : sortedPoolGroups.map((poolGroup, index, array) => (
            <PoolGroupRow
              key={poolGroup.id}
              poolGroup={poolGroup}
              isLast={index === array.length - 1}
            />
          ))}
    </div>
  );
}
