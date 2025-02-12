import { useMemo } from "react";

import BigNumber from "bignumber.js";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";

import { formatPercent, formatUsd, getToken } from "@suilend/frontend-sui";

import PoolRow from "@/components/PoolRow";
import { columnStyleMap } from "@/components/PoolsTable";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { PoolGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoolGroupRowProps {
  poolGroup: PoolGroup;
  isLast?: boolean;
}

export default function PoolGroupRow({ poolGroup, isLast }: PoolGroupRowProps) {
  const { coinMetadataMap } = useLoadedAppContext();

  // State
  const [isExpanded, setIsExpanded] = useLocalStorage<boolean>(
    `PoolGroupRow_isExpanded_${poolGroup.id}`,
    false,
  );
  const Chevron = isExpanded ? ChevronUp : ChevronDown;

  // CoinMetadata
  const coinTypes = useMemo(
    () => [...poolGroup.assetCoinTypes],
    [poolGroup.assetCoinTypes],
  );
  const hasCoinMetadata = coinTypes
    .map((coinType) => coinMetadataMap?.[coinType])
    .every(Boolean);

  // Calculations
  const totalTvlUsd = poolGroup.pools.reduce(
    (acc, pool) => acc.plus(pool.tvlUsd),
    new BigNumber(0),
  );

  const totalVolumeUsd = poolGroup.pools.reduce(
    (acc, pool) => acc.plus(pool.volumeUsd),
    new BigNumber(0),
  );

  const maxAprPercent = BigNumber.max(
    ...poolGroup.pools.map((pool) => pool.apr.percent),
  );

  return (
    <>
      <div
        className={cn(
          "group flex h-[56px] w-full min-w-max cursor-pointer flex-row",
          isExpanded ? "bg-tertiary" : "transition-colors hover:bg-tertiary",
          (isExpanded || !isLast) && "h-[calc(56px+1px)] border-b",
        )}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        {/* Pair */}
        <div
          className="flex h-full flex-row items-center gap-3"
          style={columnStyleMap.pair}
        >
          <div className="-mr-3 flex h-full w-16 flex-col">
            <div className="w-full flex-1" />
            <Tag
              className="w-max"
              labelClassName={cn(
                "flex flex-row  items-center gap-1",
                isExpanded
                  ? "text-foreground"
                  : "text-secondary-foreground transition-colors group-hover:text-foreground",
              )}
            >
              <Chevron
                className={cn(
                  "-ml-0.5 h-4 w-4",
                  isExpanded
                    ? "text-foreground"
                    : "text-secondary-foreground transition-colors group-hover:text-foreground",
                )}
              />
              {poolGroup.pools.length}
            </Tag>
            <div className="relative w-full flex-1">
              {isExpanded && (
                <div className="absolute bottom-0 left-4 top-0 w-px bg-border" />
              )}
            </div>
          </div>

          <div
            className={cn("flex flex-row", !hasCoinMetadata && "animate-pulse")}
          >
            {poolGroup.assetCoinTypes.map((coinType, index) => (
              <TokenLogo
                className={cn(
                  index !== 0 && "-ml-2 outline outline-1 outline-secondary",
                  !hasCoinMetadata && "animate-none",
                )}
                key={coinType}
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
        />

        {/* TVL */}
        <div
          className="flex h-full flex-row items-center"
          style={columnStyleMap.tvlUsd}
        >
          <Tooltip title={formatUsd(totalTvlUsd, { exact: true })}>
            <p className="text-p1 text-foreground">{formatUsd(totalTvlUsd)}</p>
          </Tooltip>
        </div>

        {/* Volume */}
        <div
          className="flex h-full flex-row items-center"
          style={columnStyleMap.volumeUsd}
        >
          <Tooltip title={formatUsd(totalVolumeUsd, { exact: true })}>
            <p className="text-p1 text-foreground">
              {formatUsd(totalVolumeUsd)}
            </p>
          </Tooltip>
        </div>

        {/* APR */}
        <div
          className="flex h-full flex-row items-center gap-2"
          style={columnStyleMap.aprPercent}
        >
          <p className="text-p3 text-tertiary-foreground">Up to</p>
          <p className="text-p1 text-foreground">
            {formatPercent(maxAprPercent)}
          </p>
        </div>
      </div>

      {isExpanded &&
        poolGroup.pools.map((pool, index) => (
          <PoolRow
            key={pool.id}
            poolGroup={poolGroup}
            pool={pool}
            isLastPoolInGroup={index === poolGroup.pools.length - 1}
            isLastTableRow={isLast && index === poolGroup.pools.length - 1}
          />
        ))}
    </>
  );
}
