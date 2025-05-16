import { CSSProperties, useMemo } from "react";

import BigNumber from "bignumber.js";
import { useLocalStorage } from "usehooks-ts";

import PoolPositionRow from "@/components/portfolio/PoolPositionRow";
import HeaderColumn, { SortDirection } from "@/components/TableHeaderColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { PoolPosition } from "@/lib/types";

export type Column =
  | "pool"
  | "aprPercent_24h"
  | "balance"
  | "pnlPercent"
  | "stakedPercent"
  | "claimableRewards"
  | "points";
type SortableColumn = "aprPercent_24h" | "balance" | "pnlPercent";

interface PoolPositionsTableProps {
  poolPositions?: PoolPosition[];
}

export default function PoolPositionsTable({
  poolPositions,
}: PoolPositionsTableProps) {
  // Columns
  const columnStyleMap: Record<
    Column,
    { cell: CSSProperties; children: CSSProperties }
  > = useMemo(
    () => ({
      pool: {
        cell: {
          textAlign: "left",
        },
        children: {
          paddingLeft: 4 * 5, // px
          paddingRight: 4 * 5, // px
        },
      },
      aprPercent_24h: {
        cell: {
          textAlign: "right",
        },
        children: {
          justifyContent: "end",
          paddingRight: 4 * 5, // px
        },
      },
      balance: {
        cell: {
          textAlign: "right",
        },
        children: {
          justifyContent: "end",
          paddingRight: 4 * 5, // px
        },
      },
      pnlPercent: {
        cell: {
          textAlign: "right",
        },
        children: {
          justifyContent: "end",
          paddingRight: 4 * 5, // px
        },
      },
      stakedPercent: {
        cell: {
          textAlign: "right",
        },
        children: {
          justifyContent: "end",
          paddingRight: 4 * 5, // px
        },
      },
      claimableRewards: {
        cell: {
          textAlign: "right",
        },
        children: {
          justifyContent: "end",
          paddingRight: 4 * 5, // px
        },
      },
      points: {
        cell: {
          textAlign: "right",
        },
        children: {
          justifyContent: "end",
          paddingRight: 4 * 5, // px
        },
      },
    }),
    [],
  );

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

  const sortedPoolPositions = useMemo(() => {
    if (poolPositions === undefined || sortState === undefined)
      return poolPositions;

    if (
      (sortState.column === "aprPercent_24h" &&
        !poolPositions.every(
          (position) => position.pool.aprPercent_24h !== undefined,
        )) ||
      (sortState.column === "balance" &&
        !poolPositions.every(
          (position) => position.balanceUsd !== undefined,
        )) ||
      (sortState.column === "pnlPercent" &&
        !poolPositions.every((position) => position.pnlPercent !== undefined))
    )
      return poolPositions;

    return poolPositions.slice().sort((a, b) => {
      if (sortState.column === "aprPercent_24h") {
        return sortState.direction === SortDirection.DESC
          ? +(b.pool.aprPercent_24h as BigNumber).minus(
              a.pool.aprPercent_24h as BigNumber,
            )
          : +(a.pool.aprPercent_24h as BigNumber).minus(
              b.pool.aprPercent_24h as BigNumber,
            );
      } else if (sortState.column === "balance") {
        return sortState.direction === SortDirection.DESC
          ? +(b.balanceUsd as BigNumber).minus(a.balanceUsd as BigNumber)
          : +(a.balanceUsd as BigNumber).minus(b.balanceUsd as BigNumber);
      } else if (sortState.column === "pnlPercent") {
        return sortState.direction === SortDirection.DESC
          ? +(b.pnlPercent as BigNumber).minus(a.pnlPercent as BigNumber)
          : +(a.pnlPercent as BigNumber).minus(b.pnlPercent as BigNumber);
      }

      return 0; // Should never reach here
    });
  }, [poolPositions, sortState]);

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
                id="aprPercent_24h"
                sortState={sortState}
                toggleSortByColumn={
                  !!(poolPositions ?? []).every(
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
                id="balance"
                sortState={sortState}
                toggleSortByColumn={
                  !!(poolPositions ?? []).every(
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
                id="pnlPercent"
                tooltip="PnL is the difference between your current balance and the net amount deposited."
                sortState={sortState}
                toggleSortByColumn={
                  !!(poolPositions ?? []).every(
                    (position) => position.pnlPercent !== undefined,
                  )
                    ? toggleSortByColumn
                    : undefined
                }
                style={columnStyleMap.pnlPercent}
              >
                PnL
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
            </tr>

            {/* Rows */}
            {sortedPoolPositions === undefined ? (
              Array.from({ length: 3 }).map((_, index) => (
                <tr
                  key={index}
                  className="h-[calc(84px+1px)] border-x border-b"
                >
                  <td colSpan={10}>
                    <Skeleton className="h-[84px]" />
                  </td>
                </tr>
              ))
            ) : sortedPoolPositions.length === 0 ? (
              <tr className="h-[calc(84px+1px)] border-x border-b bg-background">
                <td colSpan={10}>
                  <p className="text-center text-p2 text-tertiary-foreground">
                    No positions
                  </p>
                </td>
              </tr>
            ) : (
              sortedPoolPositions.map((position) => (
                <PoolPositionRow
                  key={position.pool.id}
                  columnStyleMap={columnStyleMap}
                  poolPosition={position}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
