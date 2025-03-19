import Link from "next/link";

import { formatUsd } from "@suilend/frontend-sui";

import AprBreakdown from "@/components/AprBreakdown";
import { columnStyleMap } from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { formatFeeTier, formatPair } from "@/lib/format";
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { ParsedPool, QUOTER_ID_NAME_MAP } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoolRowProps {
  pool: ParsedPool;
  isLastPoolInGroup?: boolean;
  isLastTableRow?: boolean;
}

export default function PoolRow({
  pool,
  isLastPoolInGroup,
  isLastTableRow,
}: PoolRowProps) {
  const { appData } = useLoadedAppContext();

  return (
    <Link
      className={cn(
        "group relative z-[1] flex h-[56px] w-full min-w-max shrink-0 cursor-pointer flex-row transition-colors hover:bg-tertiary/50",
        isLastPoolInGroup && !isLastTableRow && "h-[calc(56px+1px)] border-b",
      )}
      href={`${POOL_URL_PREFIX}/${pool.id}`}
    >
      {/* Pair */}
      <div
        className="flex h-full flex-row items-center gap-3"
        style={columnStyleMap.pair}
      >
        <div className="relative ml-2.5 h-full w-5 shrink-0">
          {!isLastPoolInGroup && (
            <div className="absolute bottom-0 left-0 top-0 w-px bg-tertiary-foreground" />
          )}
          <div className="absolute bottom-1/2 left-0 right-0 top-0 rounded-bl-md border-b border-l border-b-tertiary-foreground border-l-tertiary-foreground" />
        </div>

        <TokenLogos coinTypes={pool.coinTypes} size={24} />
        <p className="overflow-hidden text-ellipsis text-nowrap text-p1 text-foreground">
          {formatPair(
            pool.coinTypes.map(
              (coinType) => appData.coinMetadataMap[coinType].symbol,
            ),
          )}
        </p>
      </div>

      {/* Type */}
      <div
        className="flex h-full flex-row items-center gap-1"
        style={columnStyleMap.type}
      >
        <Tag>{QUOTER_ID_NAME_MAP[pool.quoterId]}</Tag>
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
