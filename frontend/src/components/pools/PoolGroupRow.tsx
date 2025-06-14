import { CSSProperties } from "react";

import BigNumber from "bignumber.js";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSessionStorage } from "usehooks-ts";

import {
  RewardSummary,
  Side,
  getDedupedAprRewards,
  getDedupedPerDayRewards,
  getFilteredRewards,
} from "@suilend/sdk";
import { formatPercent, formatUsd } from "@suilend/sui-fe";

import PoolRow from "@/components/pools/PoolRow";
import { Column } from "@/components/pools/PoolsTable";
import SteammLaunchTokenBadge from "@/components/SteammLaunchTokenBadge";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { formatPair } from "@/lib/format";
import { PoolGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoolGroupRowProps {
  columnStyleMap: Record<
    Column,
    { cell: CSSProperties; children: CSSProperties }
  >;
  tableId: string;
  poolGroup: PoolGroup;
  isTvlOnly?: boolean;
}

export default function PoolGroupRow({
  columnStyleMap,
  tableId,
  poolGroup,
  isTvlOnly,
}: PoolGroupRowProps) {
  const { appData, verifiedCoinTypes } = useLoadedAppContext();

  const isVerified = poolGroup.coinTypes.every((coinType) =>
    verifiedCoinTypes?.includes(coinType),
  );
  const isSteammLaunchToken = (coinType: string) =>
    appData.steammLaunchCoinTypes.includes(coinType);

  // State
  const [isExpanded, setIsExpanded] = useSessionStorage<boolean>(
    `PoolGroupRow_${tableId}_${formatPair(
      poolGroup.coinTypes.map(
        (coinType) => appData.coinMetadataMap[coinType].symbol,
      ),
    )}_isExpanded`,
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
      ...(appData.normalizedPoolRewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ??
        []),
    ],
    [] as RewardSummary[],
  );
  const filteredRewards = getFilteredRewards(rewards);

  const perDayRewards = getDedupedPerDayRewards(filteredRewards);
  const aprRewards = getDedupedAprRewards(filteredRewards);

  return (
    <>
      <tr
        className={cn(
          "group h-[calc(56px+1px)] cursor-pointer border-x border-b bg-background transition-colors",
          isExpanded
            ? "bg-card/75 shadow-[inset_2px_0_0_0px_hsl(var(--button-1))]"
            : "hover:bg-tertiary",
        )}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        {/* Pool */}
        <td
          className="whitespace-nowrap align-middle"
          style={columnStyleMap.pool.cell}
        >
          <div
            className="flex min-w-max flex-row items-center"
            style={columnStyleMap.pool.children}
          >
            <div className="flex w-max flex-row items-center gap-3">
              <Tag
                className={cn(
                  "min-w-[50px] group-hover:bg-border/50",
                  isExpanded && "bg-border group-hover:bg-border",
                )}
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

              <TokenLogos coinTypes={poolGroup.coinTypes} size={20} />

              <div className="flex flex-row items-center gap-1.5">
                <p className="flex w-max flex-row items-center text-p1 text-foreground">
                  <div className="flex flex-row items-center gap-1.5">
                    {appData.coinMetadataMap[poolGroup.coinTypes[0]].symbol}
                    {isSteammLaunchToken(poolGroup.coinTypes[0]) && (
                      <SteammLaunchTokenBadge />
                    )}
                  </div>
                  {"-"}
                  <div className="flex flex-row items-center gap-1.5">
                    {appData.coinMetadataMap[poolGroup.coinTypes[1]].symbol}
                    {isSteammLaunchToken(poolGroup.coinTypes[1]) && (
                      <SteammLaunchTokenBadge />
                    )}
                  </div>
                </p>

                {isVerified && <VerifiedBadge />}
              </div>
            </div>
          </div>
        </td>

        {/* TVL */}
        <td
          className="whitespace-nowrap align-middle"
          style={columnStyleMap.tvlUsd.cell}
        >
          <div
            className="flex min-w-max flex-row items-center"
            style={columnStyleMap.tvlUsd.children}
          >
            <div className="flex w-max flex-row items-center gap-2">
              <p className="text-p3 text-tertiary-foreground">Total</p>

              <Tooltip title={formatUsd(totalTvlUsd, { exact: true })}>
                <p className="text-p1 text-foreground">
                  {formatUsd(totalTvlUsd)}
                </p>
              </Tooltip>
            </div>
          </div>
        </td>

        {/* Volume */}
        {!isTvlOnly && (
          <td
            className="whitespace-nowrap align-middle"
            style={columnStyleMap.volumeUsd_24h.cell}
          >
            <div
              className="flex min-w-max flex-row items-center"
              style={columnStyleMap.volumeUsd_24h.children}
            >
              <div className="flex w-max flex-row items-center gap-2">
                <p className="text-p3 text-tertiary-foreground">Total</p>

                {totalVolumeUsd_24h === undefined ? (
                  <Skeleton className="h-[24px] w-16" />
                ) : (
                  <Tooltip
                    title={formatUsd(totalVolumeUsd_24h, { exact: true })}
                  >
                    <p className="text-p1 text-foreground">
                      {formatUsd(totalVolumeUsd_24h)}
                    </p>
                  </Tooltip>
                )}
              </div>
            </div>
          </td>
        )}

        {/* APR */}
        {!isTvlOnly && (
          <td
            className="whitespace-nowrap align-middle"
            style={columnStyleMap.aprPercent_24h.cell}
          >
            <div
              className="flex min-w-max flex-row items-center"
              style={columnStyleMap.aprPercent_24h.children}
            >
              <div className="flex w-max flex-row items-center gap-2">
                <p className="w-max whitespace-nowrap align-middle text-p3 text-tertiary-foreground">
                  Up to
                </p>

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
          </td>
        )}
      </tr>

      {isExpanded &&
        poolGroup.pools.map((pool, index) => (
          <PoolRow
            key={pool.id}
            columnStyleMap={columnStyleMap}
            pool={pool}
            isTvlOnly={isTvlOnly}
            isInsideGroup
            isLastPoolInGroup={index === poolGroup.pools.length - 1}
          />
        ))}
    </>
  );
}
