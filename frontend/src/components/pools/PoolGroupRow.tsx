import BigNumber from "bignumber.js";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";

import { formatPercent, formatUsd } from "@suilend/frontend-sui";

import PoolRow from "@/components/pools/PoolRow";
import { columnStyleMap } from "@/components/pools/PoolsTable";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { PoolGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoolGroupRowProps {
  tableId: string;
  poolGroup: PoolGroup;
  isLast?: boolean;
}

export default function PoolGroupRow({
  tableId,
  poolGroup,
  isLast,
}: PoolGroupRowProps) {
  const { appData } = useLoadedAppContext();

  // State
  const [isExpanded, setIsExpanded] = useLocalStorage<boolean>(
    `${tableId}_PoolGroupRow_isExpanded`,
    false,
  );
  const Chevron = isExpanded ? ChevronUp : ChevronDown;

  // Pair
  const formattedPair = poolGroup.coinTypes
    .map((coinType) => appData.poolCoinMetadataMap[coinType].symbol)
    .join("/");

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
          "group relative z-[1] flex h-[56px] w-full min-w-max shrink-0 cursor-pointer flex-row",
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
          <div className="-mr-3 flex h-full w-16 shrink-0 flex-col">
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

          <TokenLogos coinTypes={poolGroup.coinTypes} size={24} />
          <p className="overflow-hidden text-ellipsis text-nowrap text-p1 text-foreground">
            {formattedPair}
          </p>
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
          {poolGroup.pools.length > 1 && (
            <p className="text-p3 text-tertiary-foreground">Up to</p>
          )}
          <p className="text-p1 text-foreground">
            {formatPercent(maxAprPercent)}
          </p>
        </div>
      </div>

      {isExpanded &&
        poolGroup.pools.map((pool, index) => (
          <PoolRow
            key={pool.id}
            pool={pool}
            isLastPoolInGroup={index === poolGroup.pools.length - 1}
            isLastTableRow={isLast && index === poolGroup.pools.length - 1}
          />
        ))}
    </>
  );
}
