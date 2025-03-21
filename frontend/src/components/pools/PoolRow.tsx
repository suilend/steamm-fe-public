import Link from "next/link";

import { formatUsd } from "@suilend/frontend-sui";

import AprBreakdown from "@/components/AprBreakdown";
import { columnStyleMap } from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { formatFeeTier, formatPair } from "@/lib/format";
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { ParsedPool } from "@/lib/types";

interface PoolRowProps {
  pool: ParsedPool;
  isLastPoolInGroup?: boolean;
}

export default function PoolRow({ pool, isLastPoolInGroup }: PoolRowProps) {
  const { appData } = useLoadedAppContext();

  return (
    <Link
      className="group relative z-[1] flex h-[calc(56px+1px)] w-full min-w-max shrink-0 cursor-pointer flex-row border-x border-b bg-background shadow-[inset_2px_0_0_0px_hsl(var(--button-1))] transition-colors hover:bg-tertiary"
      href={`${POOL_URL_PREFIX}/${pool.id}`}
    >
      {/* Pair */}
      <div
        className="flex h-full flex-row items-center gap-3"
        style={columnStyleMap.pair}
      >
        <div
          className="relative h-full w-7 shrink-0"
          style={{ marginLeft: (20 - 1) / 2 }}
        >
          {!isLastPoolInGroup && (
            <div className="absolute bottom-0 left-0 top-0 w-px bg-border" />
          )}
          <div
            className="absolute left-0 right-0 top-0 rounded-bl-md border-b border-l"
            style={{ bottom: `calc(50% - ${1 / 2}px)` }}
          />
        </div>

        <p className="overflow-hidden text-ellipsis text-nowrap text-p1 text-foreground">
          {formatPair(
            pool.coinTypes.map(
              (coinType) => appData.coinMetadataMap[coinType].symbol,
            ),
          )}
        </p>

        <Tag>{pool.quoter.name}</Tag>
      </div>

      {/* Fee tier */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.feeTier}
      >
        <Tag>{formatFeeTier(pool.feeTierPercent)}</Tag>
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

      {/* APR */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.aprPercent_24h}
      >
        <AprBreakdown pool={pool} />
      </div>
    </Link>
  );
}
