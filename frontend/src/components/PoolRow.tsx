import { useMemo } from "react";

import { formatPercent, formatUsd, getToken } from "@suilend/frontend-sui";

import { poolsTableColumnStyles } from "@/components/PoolsTable";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { Pool, PoolGroup, poolTypeNameMap } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoolRowProps {
  poolGroup: PoolGroup;
  pool: Pool;
  isLast?: boolean;
}

export default function PoolRow({ poolGroup, pool, isLast }: PoolRowProps) {
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
        !isLast && "h-[calc(56px+1px)] border-b",
      )}
      onClick={() => {}}
    >
      {/* Pair */}
      <div
        className="flex h-full flex-row items-center gap-3"
        style={poolsTableColumnStyles.pair}
      >
        <div className="-mr-3 w-16" />

        <div
          className={cn("flex flex-row", !hasCoinMetadata && "animate-pulse")}
        >
          {poolGroup.assetCoinTypes.map((coinType, index) => (
            <TokenLogo
              key={coinType}
              className={cn(
                index !== 0 && "-ml-2 outline outline-1 outline-secondary",
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
        style={poolsTableColumnStyles.type}
      >
        <Tag labelClassName="transition-colors group-hover:text-foreground">
          {poolTypeNameMap[pool.type]}
        </Tag>
      </div>

      {/* TVL */}
      <div
        className="flex h-full flex-row items-center"
        style={poolsTableColumnStyles.tvlUsd}
      >
        <p className="text-p1 text-foreground">{formatUsd(pool.tvlUsd)}</p>
      </div>

      {/* Volume */}
      <div
        className="flex h-full flex-row items-center"
        style={poolsTableColumnStyles.volumeUsd}
      >
        <p className="text-p1 text-foreground">{formatUsd(pool.volumeUsd)}</p>
      </div>

      {/* APR */}
      <div
        className="flex h-full flex-row items-center gap-2"
        style={poolsTableColumnStyles.aprPercent}
      >
        <div
          className={cn("flex flex-row", !hasCoinMetadata && "animate-pulse")}
        >
          {pool.apr.assetCoinTypes.map((coinType, index) => (
            <TokenLogo
              key={coinType}
              className={cn(
                index !== 0 && "-ml-1 outline outline-1 outline-secondary",
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
