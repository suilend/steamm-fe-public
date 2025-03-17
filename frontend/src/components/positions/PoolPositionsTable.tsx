import { CSSProperties, useMemo } from "react";

import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";
import { useLocalStorage } from "usehooks-ts";

import PoolPositionRow from "@/components/positions/PoolPositionRow";
import HeaderColumn, { SortDirection } from "@/components/TableHeaderColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { PoolPosition } from "@/lib/types";
import { cn } from "@/lib/utils";

type Column =
  | "pair"
  | "type"
  | "aprPercent_24h"
  | "deposited"
  | "balance"
  | "stakedPercent"
  | "claimableRewards"
  | "points";
type SortableColumn = "aprPercent_24h" | "deposited" | "balance";

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
  deposited: {
    flex: 1,
    minWidth: 150, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
  balance: {
    flex: 1,
    minWidth: 250, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
  stakedPercent: {
    flex: 1,
    minWidth: 200, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
  claimableRewards: {
    flex: 1,
    minWidth: 200, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
  points: {
    flex: 1,
    minWidth: 150, // px
    justifyContent: "end",
    paddingRight: 4 * 5, // px
  },
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
  const [sortState, setSortState] = useLocalStorage<SortState | undefined>(
    `PoolPositionsTable_sortState`,
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

  const sortedPositions = useMemo(() => {
    if (positions === undefined || sortState === undefined) return positions;

    if (
      (sortState.column === "aprPercent_24h" &&
        !positions.every(
          (position) => position.pool.aprPercent_24h !== undefined,
        )) ||
      (sortState.column === "deposited" &&
        !positions.every((position) => position.depositedUsd !== undefined)) ||
      (sortState.column === "balance" &&
        !positions.every((position) => position.balanceUsd !== undefined))
    )
      return positions;

    return positions.slice().sort((a, b) => {
      if (sortState.column === "aprPercent_24h") {
        return sortState.direction === SortDirection.DESC
          ? +(b.pool.aprPercent_24h as BigNumber).minus(
              a.pool.aprPercent_24h as BigNumber,
            )
          : +(a.pool.aprPercent_24h as BigNumber).minus(
              b.pool.aprPercent_24h as BigNumber,
            );
      } else if (sortState.column === "deposited") {
        return sortState.direction === SortDirection.DESC
          ? +(b.depositedUsd as BigNumber).minus(a.depositedUsd as BigNumber)
          : +(a.depositedUsd as BigNumber).minus(b.depositedUsd as BigNumber);
      } else if (sortState.column === "balance") {
        return sortState.direction === SortDirection.DESC
          ? +(b.balanceUsd as BigNumber).minus(a.balanceUsd as BigNumber)
          : +(a.balanceUsd as BigNumber).minus(b.balanceUsd as BigNumber);
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
          APR
        </HeaderColumn>

        <HeaderColumn<Column, SortableColumn>
          id="deposited"
          sortState={sortState}
          toggleSortByColumn={
            !!(positions ?? []).every(
              (position) => position.depositedUsd !== undefined,
            )
              ? toggleSortByColumn
              : undefined
          }
          style={columnStyleMap.deposited}
        >
          Deposited
        </HeaderColumn>

        <HeaderColumn<Column, SortableColumn>
          id="balance"
          sortState={sortState}
          toggleSortByColumn={
            !!(positions ?? []).every(
              (position) => position.balanceUsd !== undefined,
            )
              ? toggleSortByColumn
              : undefined
          }
          style={columnStyleMap.balance}
        >
          Balance
        </HeaderColumn>

        <HeaderColumn<Column, SortableColumn>
          id="stakedPercent"
          style={columnStyleMap.stakedPercent}
        >
          Staked
        </HeaderColumn>

        <HeaderColumn<Column, SortableColumn>
          id="claimableRewards"
          style={columnStyleMap.claimableRewards}
        >
          Claimable rewards
        </HeaderColumn>

        <HeaderColumn<Column, SortableColumn>
          id="points"
          style={columnStyleMap.points}
        >
          Points
        </HeaderColumn>
      </div>

      {/* Rows */}
      {sortedPositions === undefined ? (
        Array.from({ length: 3 }).map((_, index, array) => (
          <Skeleton
            key={index}
            className={cn(
              "relative z-[1] h-[106px] w-full",
              index !== array.length - 1 && "h-[calc(106px+1px)] border-b",
            )}
          />
        ))
      ) : sortedPositions.length === 0 ? (
        <div className="flex h-[106px] w-full flex-row items-center justify-center">
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
