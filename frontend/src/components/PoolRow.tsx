import { useMemo } from "react";

import { formatPercent, formatUsd, getToken } from "@suilend/frontend-sui";

import { columnStyleMap } from "@/components/PoolsTable";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { Pool, PoolGroup, poolTypeNameMap } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoolRowProps {
  poolGroup: PoolGroup;
  pool: Pool;
  isLastPoolInGroup?: boolean;
  isLastTableRow?: boolean;
}

export default function PoolRow({
  poolGroup,
  pool,
  isLastPoolInGroup,
  isLastTableRow,
}: PoolRowProps) {
  const { coinMetadataMap } = useLoadedAppContext();

  // CoinMetadata
  const coinTypes = useMemo(
    () => [...poolGroup.assetCoinTypes, ...pool.apr.assetCoinTypes],
    [poolGroup.assetCoinTypes, pool.apr.assetCoinTypes],
  );
  const hasCoinMetadata = coinTypes
    .map((coinType) => coinMetadataMap?.[coinType])
    .every(Boolean);

  return (
    <div
      className={cn(
        "group flex h-[56px] w-full min-w-max cursor-pointer flex-row transition-colors hover:bg-tertiary",
        !isLastTableRow && "h-[calc(56px+1px)] border-b",
      )}
      onClick={() => {}}
    >
      {/* Pair */}
      <div
        className="flex h-full flex-row items-center gap-3"
        style={columnStyleMap.pair}
      >
        <div className="relative -mr-3 h-full w-16 pl-4">
          {!isLastPoolInGroup && <div className="h-full w-px bg-border" />}
          <div className="absolute left-4 top-0 h-1/2 w-5 rounded-bl-md border-b border-l" />
        </div>

        <div
          className={cn("flex flex-row", !hasCoinMetadata && "animate-pulse")}
        >
          {poolGroup.assetCoinTypes.map((coinType, index) => (
            <TokenLogo
              key={coinType}
              className={cn(
                index !== 0 &&
                  "-ml-2 bg-secondary outline outline-1 outline-secondary",
                !hasCoinMetadata && "animate-none",
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
          <Skeleton className="h-6 w-20 animate-none" />
        ) : (
          <p className="text-p1 text-foreground">
            {poolGroup.assetCoinTypes
              .map((coinType) => coinMetadataMap![coinType].symbol)
              .join("/")}
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
                index !== 0 &&
                  "-ml-1 bg-secondary outline outline-1 outline-secondary",
                !hasCoinMetadata && "animate-none",
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
    </div>
  );
}
