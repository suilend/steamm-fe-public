import Link from "next/link";
import { CSSProperties } from "react";

import { ParsedPool } from "@suilend/steamm-sdk";
import { formatUsd } from "@suilend/sui-fe";

import AprBreakdown from "@/components/AprBreakdown";
import PoolLabel from "@/components/pool/PoolLabel";
import { Column } from "@/components/pools/PoolsTable";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { getPoolUrl } from "@/lib/pools";
import { cn } from "@/lib/utils";

interface PoolRowProps {
  columnStyleMap: Record<
    Column,
    { cell: CSSProperties; children: CSSProperties }
  >;
  pool: ParsedPool;
  isTvlOnly?: boolean;
  isInsideGroup?: boolean;
  isLastPoolInGroup?: boolean;
}

export default function PoolRow({
  columnStyleMap,
  pool,
  isTvlOnly,
  isInsideGroup,
  isLastPoolInGroup,
}: PoolRowProps) {
  const { appData } = useLoadedAppContext();

  return (
    <Link href={getPoolUrl(appData, pool)} className="contents">
      <tr
        className={cn(
          "group h-[calc(56px+1px)] cursor-pointer border-x border-b bg-background transition-colors",
          isInsideGroup
            ? "shadow-[inset_2px_0_0_0px_hsl(var(--button-1))] hover:bg-tertiary/50"
            : "hover:bg-tertiary",
        )}
      >
        {/* Pool */}
        <td
          className="whitespace-nowrap align-middle"
          style={columnStyleMap.pool.cell}
        >
          <div
            className="flex min-w-max flex-row items-center"
            style={columnStyleMap.pool.children}
          >
            <div className="flex w-max flex-row items-center gap-3">
              {isInsideGroup && (
                <div className="h-14 w-[50px] shrink-0 pl-4">
                  <div className="relative h-full w-6">
                    {!isLastPoolInGroup && (
                      <div className="absolute bottom-0 left-0 top-0 w-px bg-border" />
                    )}
                    <div
                      className="absolute left-0 right-0 top-0 rounded-bl-md border-b border-l"
                      style={{ bottom: `calc(50% - ${1 / 2}px)` }}
                    />
                  </div>
                </div>
              )}

              <PoolLabel pool={pool} />
            </div>
          </div>
        </td>

        {/* TVL */}
        <td
          className="whitespace-nowrap align-middle"
          style={columnStyleMap.tvlUsd.cell}
        >
          <div
            className="flex min-w-max flex-row items-center"
            style={columnStyleMap.tvlUsd.children}
          >
            <div className="w-max">
              <Tooltip title={formatUsd(pool.tvlUsd, { exact: true })}>
                <p className="text-p1 text-foreground">
                  {formatUsd(pool.tvlUsd)}
                </p>
              </Tooltip>
            </div>
          </div>
        </td>

        {/* Volume */}
        {!isTvlOnly && (
          <td
            className="whitespace-nowrap align-middle"
            style={columnStyleMap.volumeUsd_24h.cell}
          >
            <div
              className="flex min-w-max flex-row items-center"
              style={columnStyleMap.volumeUsd_24h.children}
            >
              <div className="w-max">
                {pool.volumeUsd_24h === undefined ? (
                  <Skeleton className="h-[24px] w-16" />
                ) : (
                  <Tooltip
                    title={formatUsd(pool.volumeUsd_24h, { exact: true })}
                  >
                    <p className="text-p1 text-foreground">
                      {formatUsd(pool.volumeUsd_24h)}
                    </p>
                  </Tooltip>
                )}
              </div>
            </div>
          </td>
        )}

        {/* APR */}
        {!isTvlOnly && (
          <td
            className="whitespace-nowrap align-middle"
            style={columnStyleMap.aprPercent_24h.cell}
          >
            <div
              className="flex min-w-max flex-row items-center"
              style={columnStyleMap.aprPercent_24h.children}
            >
              <div className="w-max">
                <AprBreakdown pool={pool} />
              </div>
            </div>
          </td>
        )}
      </tr>
    </Link>
  );
}
