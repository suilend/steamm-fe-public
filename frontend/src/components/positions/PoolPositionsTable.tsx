import { CSSProperties, useMemo, useState } from "react";

import { ClassValue } from "clsx";

import PoolPositionRow from "@/components/positions/PoolPositionRow";
import HeaderColumn, { SortDirection } from "@/components/TableHeaderColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { PoolPosition } from "@/lib/types";
import { cn } from "@/lib/utils";

type Column = "pair" | "type" | "aprPercent_24h" | "balanceUsd";
// | "isStaked"
// | "claimableRewards"
// | "pnl";
type SortableColumn = "aprPercent_24h" | "balanceUsd";

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
  aprPercent_24h: {
    flex: 1,
    minWidth: 150, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
  balanceUsd: {
    flex: 1,
    minWidth: 150, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
  // isStaked: {
  //   flex: 1,
  //   minWidth: 150, // px
  //   justifyContent: "end",
  //   paddingRight: 4 * 5, // px
  // },
  // claimableRewards: {
  //   flex: 1,
  //   minWidth: 150, // px
  //   justifyContent: "end",
  //   paddingRight: 4 * 5, // px
  // },
  // pnl: {
  //   flex: 1,
  //   minWidth: 150, // px
  //   justifyContent: "end",
  //   paddingRight: 4 * 5, // px
  // },
};

interface PoolPositionsTableProps {
  className?: ClassValue;
  positions?: PoolPosition[];
}

export default function PoolPositionsTable({
  className,
  positions,
}: PoolPositionsTableProps) {
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

  const sortedPositions = useMemo(() => {
    if (positions === undefined || sortState === undefined) return positions;

    return positions.slice().sort((a, b) => {
      if (sortState.column === "aprPercent_24h") {
        return sortState.direction === SortDirection.DESC
          ? +b.pool.aprPercent_24h!.minus(a.pool.aprPercent_24h!)
          : +a.pool.aprPercent_24h!.minus(b.pool.aprPercent_24h!);
      } else if (sortState.column === "balanceUsd") {
        return sortState.direction === SortDirection.DESC
          ? +b.balanceUsd!.minus(a.balanceUsd!)
          : +a.balanceUsd!.minus(b.balanceUsd!);
      }

      return 0; // Should never reach here
    });
  }, [positions, sortState]);

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
          Type & Fee tier
        </HeaderColumn>
        <HeaderColumn<Column, SortableColumn>
          id="aprPercent_24h"
          sortState={sortState}
          toggleSortByColumn={
            !!(positions ?? []).every(
              (position) => position.pool.aprPercent_24h !== undefined,
            )
              ? toggleSortByColumn
              : undefined
          }
          style={columnStyleMap.aprPercent_24h}
        >
          APR (24H)
        </HeaderColumn>
        <HeaderColumn<Column, SortableColumn>
          id="balanceUsd"
          sortState={sortState}
          toggleSortByColumn={
            !!(positions ?? []).every(
              (position) => position.balanceUsd !== undefined,
            )
              ? toggleSortByColumn
              : undefined
          }
          style={columnStyleMap.balanceUsd}
        >
          Balance
        </HeaderColumn>
        {/* <HeaderColumn<Column, SortableColumn>
          id="isStaked"
          style={columnStyleMap.isStaked}
        >
          Staked
        </HeaderColumn>
        <HeaderColumn<Column, SortableColumn>
          id="claimableRewards"
          style={columnStyleMap.claimableRewards}
        >
          Claimable rewards
        </HeaderColumn> */}
        {/* <HeaderColumn<Column, SortableColumn>
          id="pnl"
          style={columnStyleMap.pnl}
        >
          PnL
        </HeaderColumn> */}
      </div>

      {/* Rows */}
      {sortedPositions === undefined ? (
        Array.from({ length: 3 }).map((_, index, array) => (
          <Skeleton
            key={index}
            className={cn(
              "relative z-[1] h-[56px] w-full",
              index !== array.length - 1 && "h-[calc(56px+1px)] border-b",
            )}
          />
        ))
      ) : sortedPositions.length === 0 ? (
        <div className="flex h-[56px] w-full flex-row items-center justify-center">
          <p className="text-p2 text-tertiary-foreground">No positions</p>
        </div>
      ) : (
        sortedPositions.map((position, index, array) => (
          <PoolPositionRow
            key={position.pool.id}
            position={position}
            isLast={index === array.length - 1}
          />
        ))
      )}
    </div>
  );
}
