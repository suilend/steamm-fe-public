import BigNumber from "bignumber.js";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";

import { formatPercent, formatUsd } from "@suilend/frontend-sui";
import {
  RewardSummary,
  Side,
  getDedupedAprRewards,
  getDedupedPerDayRewards,
  getFilteredRewards,
} from "@suilend/sdk";

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
  const { appData, poolsData } = useLoadedAppContext();

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

  // Rewards
  const rewards = poolGroup.pools.reduce(
    (acc, pool) => [
      ...acc,
      ...(poolsData?.rewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? []),
    ],
    [] as RewardSummary[],
  );
  const filteredRewards = getFilteredRewards(rewards);

  const perDayRewards = getDedupedPerDayRewards(filteredRewards);
  const aprRewards = getDedupedAprRewards(filteredRewards);

  return (
    <>
      <div
        className={cn(
          "group relative z-[1] flex h-[calc(56px+1px)] w-full min-w-max shrink-0 cursor-pointer flex-row border-x border-b bg-background transition-colors",
          isExpanded
            ? "bg-card/75 shadow-[inset_2px_0_0_0px_hsl(var(--button-1))]"
            : "hover:bg-tertiary",
        )}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        {/* Pair */}
        <div
          className="flex h-full flex-row items-center gap-3"
          style={columnStyleMap.pair}
        >
          <Tag
            className={cn("min-w-[50px]", isExpanded && "bg-border")}
            labelClassName={cn("w-max", isExpanded && "text-foreground")}
            startDecorator={
              <Chevron
                className={cn(
                  "h-4 w-4 transition-colors",
                  isExpanded
                    ? "text-foreground"
                    : "text-secondary-foreground group-hover:text-foreground",
                )}
              />
            }
          >
            {poolGroup.pools.length}
          </Tag>

          <TokenLogos coinTypes={poolGroup.coinTypes} size={24} />
          <p className="overflow-hidden text-ellipsis text-nowrap text-p1 text-foreground">
            {formatPair(
              poolGroup.coinTypes.map(
                (coinType) => appData.coinMetadataMap[coinType].symbol,
              ),
            )}
          </p>
        </div>

        {/* Fee tier */}
        <div
          className="flex h-full flex-row items-center"
          style={columnStyleMap.feeTier}
        ></div>

        {/* TVL */}
        <div
          className="flex h-full flex-row items-center"
          style={columnStyleMap.tvlUsd}
        >
          <div className="flex flex-row items-center gap-2">
            <p className="text-p3 text-tertiary-foreground">Total</p>

            <Tooltip title={formatUsd(totalTvlUsd, { exact: true })}>
              <p className="text-p1 text-foreground">
                {formatUsd(totalTvlUsd)}
              </p>
            </Tooltip>
          </div>
        </div>

        {/* Volume */}
        <div
          className="flex h-full flex-row items-center"
          style={columnStyleMap.volumeUsd_24h}
        >
          <div className="flex flex-row items-center gap-2">
            <p className="text-p3 text-tertiary-foreground">Total</p>

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
        </div>

        {/* APR */}
        <div
          className="flex h-full flex-row items-center"
          style={columnStyleMap.aprPercent_24h}
        >
          <div className="flex flex-row items-center gap-2">
            <p className="w-max text-p3 text-tertiary-foreground">Up to</p>

            <TokenLogos
              coinTypes={Array.from(
                new Set(
                  [...perDayRewards, ...aprRewards].map(
                    (r) => r.stats.rewardCoinType,
                  ),
                ),
              )}
              size={16}
            />

            {maxAprPercent_24h === undefined ? (
              <Skeleton className="h-[24px] w-16" />
            ) : (
              <p
                className={cn(
                  "!text-p1",
                  [...perDayRewards, ...aprRewards].length > 0
                    ? "text-button-2-foreground"
                    : "text-foreground",
                )}
              >
                {formatPercent(maxAprPercent_24h)}
              </p>
            )}
          </div>
        </div>
      </div>

      {isExpanded &&
        poolGroup.pools.map((pool, index) => (
          <PoolRow
            key={pool.id}
            pool={pool}
            isInsideGroup
            isLastPoolInGroup={index === poolGroup.pools.length - 1}
          />
        ))}
    </>
  );
}
