import Link from "next/link";
import { CSSProperties } from "react";

import { ParsedPool } from "@suilend/steamm-sdk";
import { formatUsd } from "@suilend/sui-fe";

import AprBreakdown from "@/components/AprBreakdown";
import Parameter from "@/components/Parameter";
import PoolLabel from "@/components/pool/PoolLabel";
import { Column } from "@/components/pools/PoolsTable";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import useBreakpoint from "@/hooks/useBreakpoint";
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

  const { md } = useBreakpoint();

  return (
    <Link href={getPoolUrl(appData, pool)} className="contents">
      <tr
        className={cn(
          "group cursor-pointer border-x border-b bg-background transition-colors",
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
            className="flex w-full flex-row items-center py-4 md:min-w-max"
            style={columnStyleMap.pool.children}
          >
            <div className="flex w-full flex-row items-center gap-3 md:w-max">
              {md ? (
                <>
                  {isInsideGroup && (
                    <div className="-my-4 h-14 w-[50px] shrink-0 pl-4">
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
                </>
              ) : (
                <div className="flex w-full flex-col gap-3">
                  {/* Top */}
                  <PoolLabel className="w-full" wrap pool={pool} />

                  {/* Stats */}
                  <div className="flex w-full flex-col gap-2">
                    {/* TVL */}
                    <Parameter label="TVL" isHorizontal>
                      <Tooltip title={formatUsd(pool.tvlUsd, { exact: true })}>
                        <p className="text-p2 text-foreground">
                          {formatUsd(pool.tvlUsd)}
                        </p>
                      </Tooltip>
                    </Parameter>

                    {/* Volume */}
                    <Parameter
                      label="Volume"
                      labelEndDecorator="24H"
                      isHorizontal
                    >
                      {pool.volumeUsd_24h === undefined ? (
                        <Skeleton className="h-[21px] w-16" />
                      ) : (
                        <Tooltip
                          title={formatUsd(pool.volumeUsd_24h, { exact: true })}
                        >
                          <p className="text-p2 text-foreground">
                            {formatUsd(pool.volumeUsd_24h)}
                          </p>
                        </Tooltip>
                      )}
                    </Parameter>

                    {/* APR */}
                    <Parameter label="APR" labelEndDecorator="24H" isHorizontal>
                      <AprBreakdown valueClassName="!text-p2" pool={pool} />
                    </Parameter>
                  </div>
                </div>
              )}
            </div>
          </div>
        </td>

        {md && (
          <>
            {/* TVL */}
            <td
              className="whitespace-nowrap align-middle"
              style={columnStyleMap.tvlUsd.cell}
            >
              <div
                className="flex min-w-max flex-row items-center py-4"
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
                  className="flex min-w-max flex-row items-center py-4"
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
                  className="flex min-w-max flex-row items-center py-4"
                  style={columnStyleMap.aprPercent_24h.children}
                >
                  <div className="w-max">
                    <AprBreakdown pool={pool} />
                  </div>
                </div>
              </td>
            )}
          </>
        )}
      </tr>
    </Link>
  );
}
