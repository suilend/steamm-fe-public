import Link from "next/link";
import { MouseEvent } from "react";

import { formatPercent, formatUsd } from "@suilend/frontend-sui";

import { columnStyleMap } from "@/components/positions/PoolPositionsTable";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { formatFeeTier, formatPair } from "@/lib/format";
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { PoolPosition, poolTypeNameMap } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PoolPositionRowProps {
  position: PoolPosition;
  isLast?: boolean;
}

export default function PoolPositionRow({
  position,
  isLast,
}: PoolPositionRowProps) {
  const { appData } = useLoadedAppContext();

  // Stake/Unstake
  const onStakeUnstakeClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  // Claim
  const onClaimRewardsClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  return (
    <Link
      className={cn(
        "group relative z-[1] flex h-[56px] w-full min-w-max shrink-0 cursor-pointer flex-row transition-colors hover:bg-tertiary",
        !isLast && "h-[calc(56px+1px)] border-b",
      )}
      href={`${POOL_URL_PREFIX}/${position.pool.id}`}
    >
      {/* Pair */}
      <div
        className="flex h-full flex-row items-center gap-3"
        style={columnStyleMap.pair}
      >
        <TokenLogos coinTypes={position.pool.coinTypes} size={24} />
        <p className="overflow-hidden text-ellipsis text-nowrap text-p1 text-foreground">
          {formatPair(
            position.pool.coinTypes.map(
              (coinType) => appData.coinMetadataMap[coinType].symbol,
            ),
          )}
        </p>
      </div>

      {/* Type */}
      <div
        className="flex h-full flex-row items-center gap-1"
        style={columnStyleMap.type}
      >
        <Tag>
          {position.pool.type ? poolTypeNameMap[position.pool.type] : "--"}
        </Tag>
        <Tag>{formatFeeTier(position.pool.feeTierPercent)}</Tag>
      </div>

      {/* APR */}
      <div
        className="flex h-full flex-row items-center gap-2"
        style={columnStyleMap.aprPercent_24h}
      >
        {/* <TokenLogos coinTypes={position.pool.apr.coinTypes} size={16} /> */}
        {position.pool.aprPercent_24h === undefined ? (
          <Skeleton className="h-[24px] w-16" />
        ) : (
          <p className="text-p1 text-success">
            {formatPercent(position.pool.aprPercent_24h)}
          </p>
        )}
      </div>

      {/* Balance */}
      <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.balanceUsd}
      >
        {position.balanceUsd === undefined ? (
          <Skeleton className="h-[24px] w-16" />
        ) : (
          <Tooltip title={formatUsd(position.balanceUsd, { exact: true })}>
            <p className="text-p1 text-foreground">
              {formatUsd(position.balanceUsd)}
            </p>
          </Tooltip>
        )}
      </div>

      {/* Staked */}
      {/* <div
        className="flex h-full flex-row items-center gap-3"
        style={columnStyleMap.isStaked}
      >
        <p className="text-p1 text-foreground">
          {position.isStaked ? "Yes" : "No"}
        </p>

        <button
          className={cn(
            "flex h-6 flex-row items-center rounded-md px-2 transition-colors",
            position.isStaked
              ? "bg-button-2 hover:bg-button-2/80"
              : "bg-button-1 hover:bg-button-1/80",
          )}
          onClick={onStakeUnstakeClick}
        >
          <p
            className={cn(
              "!text-p3",
              position.isStaked
                ? "text-button-2-foreground"
                : "text-button-1-foreground",
            )}
          >
            {position.isStaked ? "Unstake" : "Stake"}
          </p>
        </button>
      </div> */}

      {/* Claimable rewards */}
      {/* <div
        className="flex h-full flex-row items-center gap-3"
        style={columnStyleMap.claimableRewards}
      >
        {Object.keys(position.claimableRewards).length > 0 ? (
          <>
            <TokenLogos
              coinTypes={Object.keys(position.claimableRewards)}
              size={20}
            />

            <button
              className="flex h-6 flex-row items-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80"
              onClick={onClaimRewardsClick}
            >
              <p className="text-p3 text-button-2-foreground">Claim</p>
            </button>
          </>
        ) : (
          <p className="text-p1 text-foreground">--</p>
        )}
      </div> */}

      {/* PnL */}
      {/* <div
        className="flex h-full flex-row items-center"
        style={columnStyleMap.pnl}
      >
        <div className="flex flex-col items-end gap-0.5">
          {position.pnl.percent === undefined ? (
            <Skeleton className="h-[24px] w-16" />
          ) : (
            <p className="text-p1 text-success">
              +{formatPercent(position.pnl.percent)}
            </p>
          )}
          {position.pnl.amountUsd === undefined ? (
            <Skeleton className="h-[21px] w-16" />
          ) : (
            <Tooltip
              title={`+${formatUsd(position.pnl.amountUsd, { exact: true })}`}
            >
              <p className="text-p2 text-success">
                +{formatUsd(position.pnl.amountUsd)}
              </p>
            </Tooltip>
          )}
        </div>
      </div> */}
    </Link>
  );
}
