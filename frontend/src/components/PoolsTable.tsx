import { CSSProperties } from "react";

import PoolGroupRow from "@/components/PoolGroupRow";
import { PoolGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

export const poolsTableColumnStyles: Record<
  "pair" | "type" | "tvlUsd" | "volumeUsd" | "aprPercent",
  CSSProperties
> = {
  pair: {
    flex: 2,
    minWidth: "250px",
    paddingLeft: "20px",
  },
  type: {
    width: "150px",
    minWidth: "150px",
    paddingLeft: "20px",
  },
  tvlUsd: {
    flex: 1,
    minWidth: "100px",
    justifyContent: "end",
    paddingRight: "20px",
  },
  volumeUsd: {
    flex: 1,
    minWidth: "100px",
    justifyContent: "end",
    paddingRight: "20px",
  },
  aprPercent: {
    flex: 1,
    minWidth: "150px",
    justifyContent: "end",
    paddingRight: "20px",
  },
};

interface PoolsTableProps {
  poolGroups: PoolGroup[];
}

export default function PoolsTable({ poolGroups }: PoolsTableProps) {
  return (
    <div className="flex w-full flex-col overflow-x-auto rounded-md border bg-background">
      {/* Header */}
      <div className="flex h-[calc(40px+1px)] w-full min-w-max flex-row border-b bg-secondary">
        {/* Pair */}
        <div
          className="flex h-full flex-row items-center"
          style={poolsTableColumnStyles.pair}
        >
          <p className="text-p3 text-secondary-foreground">Pair</p>
        </div>

        {/* Type */}
        <div
          className="flex h-full flex-row items-center"
          style={poolsTableColumnStyles.type}
        >
          <p className="text-p3 text-secondary-foreground">Type</p>
        </div>

        {/* TVL */}
        <div
          className="flex h-full flex-row items-center"
          style={poolsTableColumnStyles.tvlUsd}
        >
          <p className="text-p3 text-secondary-foreground">TVL</p>
        </div>

        {/* Volume */}
        <div
          className="flex h-full flex-row items-center"
          style={poolsTableColumnStyles.volumeUsd}
        >
          <p className="text-p3 text-secondary-foreground">24H Volume</p>
        </div>

        {/* APR */}
        <div
          className="flex h-full flex-row items-center"
          style={poolsTableColumnStyles.aprPercent}
        >
          <p className="text-p3 text-secondary-foreground">24H APR</p>
        </div>
      </div>

      {/* Rows */}
      {poolGroups.map((poolGroup, index) => (
        <PoolGroupRow
          key={poolGroup.id}
          poolGroup={poolGroup}
          isLast={index === poolGroups.length - 1}
        />
      ))}
    </div>
  );
}
