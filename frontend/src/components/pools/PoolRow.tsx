import { useRouter } from "next/router";
import { CSSProperties } from "react";

import { BadgeCheck } from "lucide-react";

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
  const router = useRouter();

  const { appData, verifiedPoolIds } = useLoadedAppContext();

  return (
    <tr
      className={cn(
        "group h-[calc(56px+1px)] cursor-pointer border-x border-b bg-background transition-colors",
        isInsideGroup
          ? "shadow-[inset_2px_0_0_0px_hsl(var(--button-1))] hover:bg-tertiary/50"
          : "hover:bg-tertiary",
      )}
      onClick={() => router.push(getPoolUrl(appData, pool))}
    >
      {/* Pool */}
      <td className="whitespace-nowrap" style={columnStyleMap.pool.cell}>
        <div
          className="flex min-w-max flex-row items-center gap-3"
          style={columnStyleMap.pool.children}
        >
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

          <TokenLogos coinTypes={pool.coinTypes} size={20} />
          <p className="text-p1 text-foreground">
            {formatPair(
              pool.coinTypes.map(
                (coinType) => appData.coinMetadataMap[coinType].symbol,
              ),
            )}
          </p>
          {verifiedPoolIds?.includes(pool.id) && (
            <Tooltip title="Verified">
              <BadgeCheck className="-ml-1.5 h-4 w-4 text-success" />
            </Tooltip>
          )}

          <div className="flex flex-row items-center gap-px">
            <PoolTypeTag className="rounded-r-[0] pr-2" pool={pool} />
            <Tag className="rounded-l-[0] pl-2">
              {formatFeeTier(pool.feeTierPercent)}
            </Tag>
          </div>
        </div>
      </td>

      {/* TVL */}
      <td className="whitespace-nowrap" style={columnStyleMap.tvlUsd.cell}>
        <div
          className="flex min-w-max flex-row items-center"
          style={columnStyleMap.tvlUsd.children}
        >
          <Tooltip title={formatUsd(pool.tvlUsd, { exact: true })}>
            <p className="text-p1 text-foreground">{formatUsd(pool.tvlUsd)}</p>
          </Tooltip>
        </div>
      </td>

      {/* Volume */}
      {!isTvlOnly && (
        <td
          className="whitespace-nowrap"
          style={columnStyleMap.volumeUsd_24h.cell}
        >
          <div
            className="flex min-w-max flex-row items-center"
            style={columnStyleMap.volumeUsd_24h.children}
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
        </td>
      )}

      {/* APR */}
      {!isTvlOnly && (
        <td
          className="whitespace-nowrap"
          style={columnStyleMap.aprPercent_24h.cell}
        >
          <div
            className="flex min-w-max flex-row items-center"
            style={columnStyleMap.aprPercent_24h.children}
          >
            <AprBreakdown pool={pool} />
          </div>
        </td>
      )}
    </tr>
  );
}
