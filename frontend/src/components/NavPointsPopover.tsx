import { useState } from "react";

import {
  NORMALIZED_STEAMM_POINTS_COINTYPE,
  formatPoints,
  getToken,
} from "@suilend/frontend-sui";

import Popover from "@/components/Popover";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolPositionsContext } from "@/contexts/PoolPositionsContext";
import { cn } from "@/lib/utils";

export default function NavPointsPopover() {
  const { appData } = useLoadedAppContext();

  const { totalPoints, pointsPerDay } = usePoolPositionsContext();

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Popover
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      contentProps={{
        align: "end",
        maxWidth: 280,
      }}
      trigger={
        <button
          className={cn(
            "group flex h-8 flex-row items-center justify-center gap-2 rounded-md border px-2 transition-colors",
            isOpen ? "bg-border/50" : "hover:bg-border/50",
          )}
        >
          <TokenLogo
            token={getToken(
              NORMALIZED_STEAMM_POINTS_COINTYPE,
              appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE],
            )}
            size={16}
          />
          {totalPoints === undefined ? (
            <Skeleton className="h-[21px] w-10" />
          ) : (
            <p className="text-p2 text-foreground">
              {formatPoints(totalPoints)}
            </p>
          )}
        </button>
      }
    >
      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-row items-center gap-2">
          <TokenLogo
            token={getToken(
              NORMALIZED_STEAMM_POINTS_COINTYPE,
              appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE],
            )}
            size={16}
          />
          <p className="text-p1 text-foreground">STEAMM Points</p>
        </div>

        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-row items-center justify-between gap-4">
            <p className="text-p2 text-secondary-foreground">Total points</p>
            {totalPoints === undefined ? (
              <Skeleton className="h-[21px] w-12" />
            ) : (
              <Tooltip
                title={`${formatPoints(totalPoints, {
                  dp: appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE]
                    .decimals,
                })} ${appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE].symbol}`}
              >
                <p className="!text-p2 text-foreground">
                  {formatPoints(totalPoints)}
                </p>
              </Tooltip>
            )}
          </div>

          <div className="flex flex-row items-center justify-between gap-4">
            <p className="text-p2 text-secondary-foreground">Points per day</p>
            {pointsPerDay === undefined ? (
              <Skeleton className="h-[21px] w-12" />
            ) : (
              <Tooltip
                title={`${formatPoints(pointsPerDay, {
                  dp: appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE]
                    .decimals,
                })} ${appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE].symbol}`}
              >
                <p className="!text-p2 text-foreground">
                  {formatPoints(pointsPerDay)}
                </p>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </Popover>
  );
}
