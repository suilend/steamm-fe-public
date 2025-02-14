import Link from "next/link";

import { formatPercent, formatUsd } from "@suilend/frontend-sui";

import { columnStyleMap } from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { formatPair } from "@/lib/format";
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { ParsedPool, poolTypeNameMap } from "@/lib/types";
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
        "group relative z-[1] flex h-[56px] w-full min-w-max shrink-0 cursor-pointer flex-row transition-colors hover:bg-tertiary",
        !isLastTableRow && "h-[calc(56px+1px)] border-b",
      )}
      href={`${POOL_URL_PREFIX}/${pool.id}`}
    >
      {/* Pair */}
      <div
        className="flex h-full flex-row items-center gap-3"
        style={columnStyleMap.pair}
      >
        <div className="relative -mr-3 h-full w-16 shrink-0 pl-4">
          {!isLastPoolInGroup && <div className="h-full w-px bg-border" />}
          <div className="absolute left-4 top-0 h-1/2 w-5 rounded-bl-md border-b border-l" />
        </div>

        <TokenLogos coinTypes={pool.coinTypes} size={24} />
        <p className="overflow-hidden text-ellipsis text-nowrap text-p1 text-foreground">
          {formatPair(
            pool.coinTypes.map(
              (coinType) => appData.poolCoinMetadataMap[coinType].symbol,
            ),
          )}
        </p>
        <Tag labelClassName="transition-colors group-hover:text-foreground">
          {formatPercent(pool.feeTierPercent)}
        </Tag>
      </div>

      {/* Type */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.type}
      >
        {pool.type ? (
          <Tag labelClassName="transition-colors group-hover:text-foreground">
            {poolTypeNameMap[pool.type]}
          </Tag>
        ) : (
          <p className="text-p1 text-foreground">--</p>
        )}
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
        className="flex h-full flex-row items-center gap-2"
        style={columnStyleMap.aprPercent}
      >
        <TokenLogos coinTypes={pool.apr.coinTypes} size={16} />
        <p className="text-p1 text-foreground">
          {formatPercent(pool.apr.percent)}
        </p>
      </div>
    </Link>
  );
}
