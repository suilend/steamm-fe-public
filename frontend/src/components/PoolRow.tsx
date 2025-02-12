import Link from "next/link";
import { useMemo } from "react";

import { formatPercent, formatUsd, getToken } from "@suilend/frontend-sui";

import { columnStyleMap } from "@/components/PoolsTable";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { POOLS_URL } from "@/lib/navigation";
import { Pool, poolTypeNameMap } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoolRowProps {
  pool: Pool;
  isLastPoolInGroup?: boolean;
  isLastTableRow?: boolean;
}

export default function PoolRow({
  pool,
  isLastPoolInGroup,
  isLastTableRow,
}: PoolRowProps) {
  const { coinMetadataMap } = useLoadedAppContext();

  // CoinMetadata
  const coinTypes = useMemo(
    () => [...pool.assetCoinTypes, ...pool.apr.assetCoinTypes],
    [pool.assetCoinTypes, pool.apr.assetCoinTypes],
  );
  const hasCoinMetadata = coinTypes
    .map((coinType) => coinMetadataMap?.[coinType])
    .every(Boolean);

  // Pair
  const formattedPair = hasCoinMetadata
    ? pool.assetCoinTypes
        .map((coinType) => coinMetadataMap![coinType].symbol)
        .join("/")
    : undefined;

  return (
    <Link
      className={cn(
        "group relative z-[1] flex h-[56px] w-full min-w-max shrink-0 cursor-pointer flex-row transition-colors hover:bg-tertiary",
        !isLastTableRow && "h-[calc(56px+1px)] border-b",
      )}
      href={`${POOLS_URL}/${pool.id}`}
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

        <div
          className={cn(
            "flex shrink-0 flex-row",
            !hasCoinMetadata && "animate-pulse",
          )}
        >
          {pool.assetCoinTypes.map((coinType, index) => (
            <TokenLogo
              key={coinType}
              className={cn(
                index !== 0 && "-ml-2 outline outline-1 outline-secondary",
                !hasCoinMetadata ? "animate-none" : "bg-secondary",
              )}
              token={
                hasCoinMetadata
                  ? getToken(coinType, coinMetadataMap![coinType])
                  : undefined
              }
              size={24}
            />
          ))}
        </div>

        {!hasCoinMetadata ? (
          <Skeleton className="h-[24px] w-20 animate-none" />
        ) : (
          <p className="overflow-hidden text-ellipsis text-nowrap text-p1 text-foreground">
            {formattedPair}
          </p>
        )}
      </div>

      {/* Type */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.type}
      >
        <Tag labelClassName="transition-colors group-hover:text-foreground">
          {poolTypeNameMap[pool.type]}
        </Tag>
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
        style={columnStyleMap.volumeUsd}
      >
        <Tooltip title={formatUsd(pool.volumeUsd, { exact: true })}>
          <p className="text-p1 text-foreground">{formatUsd(pool.volumeUsd)}</p>
        </Tooltip>
      </div>

      {/* APR */}
      <div
        className="flex h-full flex-row items-center gap-2"
        style={columnStyleMap.aprPercent}
      >
        <div
          className={cn("flex flex-row", !hasCoinMetadata && "animate-pulse")}
        >
          {pool.apr.assetCoinTypes.map((coinType, index) => (
            <TokenLogo
              key={coinType}
              className={cn(
                index !== 0 && "-ml-1 outline outline-1 outline-secondary",
                !hasCoinMetadata ? "animate-none" : "bg-secondary",
              )}
              token={
                hasCoinMetadata
                  ? getToken(coinType, coinMetadataMap![coinType])
                  : undefined
              }
              size={16}
            />
          ))}
        </div>

        <p className="text-p1 text-foreground">
          {formatPercent(pool.apr.percent)}
        </p>
      </div>
    </Link>
  );
}
