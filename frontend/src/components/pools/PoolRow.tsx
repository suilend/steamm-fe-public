import Link from "next/link";
import { CSSProperties } from "react";

import { formatUsd } from "@suilend/frontend-sui";

import AprBreakdown from "@/components/AprBreakdown";
import PoolTypeTag from "@/components/pool/PoolTypeTag";
import { Column } from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { formatFeeTier, formatPair } from "@/lib/format";
import { getPoolUrl } from "@/lib/pools";
import { ParsedPool } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoolRowProps {
  columnStyleMap: Record<Column, CSSProperties>;
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
    <Link
      className={cn(
        "group relative z-[1] flex h-[calc(56px+1px)] w-full min-w-max shrink-0 cursor-pointer flex-row border-x border-b bg-background transition-colors",
        isInsideGroup
          ? "shadow-[inset_2px_0_0_0px_hsl(var(--button-1))] hover:bg-tertiary/50"
          : "hover:bg-tertiary",
      )}
      href={getPoolUrl(appData, pool)}
    >
      {/* Pool */}
      <div
        className="flex h-full flex-row items-center gap-3"
        style={columnStyleMap.pool}
      >
        {isInsideGroup && (
          <div className="h-full w-[50px] shrink-0 pl-4">
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

        <TokenLogos coinTypes={pool.coinTypes} size={20} />
        <p className="text-p1 text-foreground">
          {formatPair(
            pool.coinTypes.map(
              (coinType) => appData.coinMetadataMap[coinType].symbol,
            ),
          )}
        </p>

        <div className="flex flex-row items-center gap-px">
          <PoolTypeTag className="rounded-r-[0] pr-2" pool={pool} />
          <Tag className="rounded-l-[0] pl-2">
            {formatFeeTier(pool.feeTierPercent)}
          </Tag>
        </div>
      </div>

      {/* TVL */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.tvlUsd}
      >
        <Tooltip title={formatUsd(pool.tvlUsd, { exact: true })}>
          <p className="text-p1 text-foreground">{formatUsd(pool.tvlUsd)}</p>
        </Tooltip>
      </div>

      {/* Volume */}
      {!isTvlOnly && (
        <div
          className="flex h-full flex-row items-center"
          style={columnStyleMap.volumeUsd_24h}
        >
          {pool.volumeUsd_24h === undefined ? (
            <Skeleton className="h-[24px] w-16" />
          ) : (
            <Tooltip title={formatUsd(pool.volumeUsd_24h, { exact: true })}>
              <p className="text-p1 text-foreground">
                {formatUsd(pool.volumeUsd_24h)}
              </p>
            </Tooltip>
          )}
        </div>
      )}

      {/* APR */}
      {!isTvlOnly && (
        <div
          className="flex h-full flex-row items-center"
          style={columnStyleMap.aprPercent_24h}
        >
          <AprBreakdown pool={pool} />
        </div>
      )}
    </Link>
  );
}
