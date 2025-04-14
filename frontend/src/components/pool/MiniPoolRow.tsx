import Link from "next/link";

import { formatUsd } from "@suilend/frontend-sui";

import AprBreakdown from "@/components/AprBreakdown";
import { columnStyleMap } from "@/components/pool/MiniPoolsTable";
import PoolTypeTag from "@/components/pool/PoolTypeTag";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { formatPair } from "@/lib/format";
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { getPoolSlug } from "@/lib/pools";
import { ParsedPool } from "@/lib/types";

interface MiniPoolRowProps {
  pool: ParsedPool;
  tvlOnly?: boolean;
}

export default function MiniPoolRow({ pool, tvlOnly }: MiniPoolRowProps) {
  const { appData } = useLoadedAppContext();

  return (
    <Link
      className="group relative z-[1] flex h-[calc(56px+1px)] w-full min-w-max shrink-0 cursor-pointer flex-row border-x border-b bg-background transition-colors hover:bg-tertiary"
      href={`${POOL_URL_PREFIX}/${pool.id}-${getPoolSlug(appData, pool)}`}
    >
      {/* Pool */}
      <div
        className="flex h-full flex-row items-center gap-3"
        style={columnStyleMap.pool}
      >
        <TokenLogos coinTypes={pool.coinTypes} size={24} />
        <p className="overflow-hidden text-ellipsis text-nowrap text-p1 text-foreground">
          {formatPair(
            pool.coinTypes.map(
              (coinType) => appData.coinMetadataMap[coinType].symbol,
            ),
          )}
        </p>

        <PoolTypeTag pool={pool} />
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
      {!tvlOnly && (
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
      {!tvlOnly && (
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
