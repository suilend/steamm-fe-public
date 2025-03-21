import BigNumber from "bignumber.js";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";

import { formatPercent, formatUsd } from "@suilend/frontend-sui";

import PoolRow from "@/components/pools/PoolRow";
import { columnStyleMap } from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { formatPair } from "@/lib/format";
import { PoolGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoolGroupRowProps {
  tableId: string;
  poolGroup: PoolGroup;
}

export default function PoolGroupRow({
  tableId,
  poolGroup,
}: PoolGroupRowProps) {
  const { appData } = useLoadedAppContext();

  // State
  const [isExpanded, setIsExpanded] = useLocalStorage<boolean>(
    `PoolGroupRow_${tableId}_${formatPair(poolGroup.coinTypes)}_isExpanded`,
    false,
  );
  const Chevron = isExpanded ? ChevronUp : ChevronDown;

  // Calculations
  const totalTvlUsd = poolGroup.pools.reduce(
    (acc, pool) => acc.plus(pool.tvlUsd),
    new BigNumber(0),
  );

  const totalVolumeUsd_24h = poolGroup.pools.some(
    (pool) => pool.volumeUsd_24h === undefined,
  )
    ? undefined
    : poolGroup.pools.reduce(
        (acc, pool) => acc.plus(pool.volumeUsd_24h as BigNumber),
        new BigNumber(0),
      );

  const maxAprPercent_24h = poolGroup.pools.some(
    (pool) => pool.aprPercent_24h === undefined,
  )
    ? undefined
    : BigNumber.max(
        ...poolGroup.pools.map((pool) => pool.aprPercent_24h as BigNumber),
      );

  return (
    <>
      <div
        className={cn(
          "group relative z-[1] flex h-[calc(56px+1px)] w-full min-w-max shrink-0 cursor-pointer flex-row border-x border-b bg-background transition-colors hover:bg-tertiary",
          isExpanded &&
            "bg-tertiary shadow-[inset_2px_0_0_0px_hsl(var(--button-1))]",
        )}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        {/* Pair */}
        <div
          className="flex h-full flex-row items-center gap-3"
          style={columnStyleMap.pair}
        >
          <Chevron
            className={cn(
              "h-5 w-5 transition-colors",
              isExpanded
                ? "text-foreground"
                : "text-secondary-foreground group-hover:text-foreground",
            )}
          />

          <TokenLogos coinTypes={poolGroup.coinTypes} size={24} />
          <p className="overflow-hidden text-ellipsis text-nowrap text-p1 text-foreground">
            {formatPair(
              poolGroup.coinTypes.map(
                (coinType) => appData.coinMetadataMap[coinType].symbol,
              ),
            )}
          </p>

          <Tag
            className={cn("w-max", isExpanded && "bg-border")}
            labelClassName={cn(isExpanded && "text-foreground")}
          >
            {poolGroup.pools.length}
          </Tag>
        </div>

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
          style={columnStyleMap.volumeUsd_24h}
        >
          {totalVolumeUsd_24h === undefined ? (
            <Skeleton className="h-[24px] w-16" />
          ) : (
            <Tooltip title={formatUsd(totalVolumeUsd_24h, { exact: true })}>
              <p className="text-p1 text-foreground">
                {formatUsd(totalVolumeUsd_24h)}
              </p>
            </Tooltip>
          )}
        </div>

        {/* APR */}
        <div
          className="flex h-full flex-row items-center"
          style={columnStyleMap.aprPercent_24h}
        >
          {maxAprPercent_24h === undefined ? (
            <Skeleton className="h-[24px] w-16" />
          ) : (
            <p className="text-p1 text-foreground">
              {poolGroup.pools.length > 1 && "<"}
              {formatPercent(maxAprPercent_24h)}
            </p>
          )}
        </div>
      </div>

      {isExpanded &&
        poolGroup.pools.map((pool, index) => (
          <PoolRow
            key={pool.id}
            pool={pool}
            isLastPoolInGroup={index === poolGroup.pools.length - 1}
          />
        ))}
    </>
  );
}
