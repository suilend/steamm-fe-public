import { useState } from "react";

import BigNumber from "bignumber.js";
import { Trophy } from "lucide-react";

import {
  NORMALIZED_STEAMM_POINTS_COINTYPE,
  formatDuration,
  formatPoints,
  formatRank,
  getToken,
} from "@suilend/sui-fe";

import Popover from "@/components/Popover";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/contexts/AppContext";
import { usePointsContext } from "@/contexts/PointsContext";
import { usePoolPositionsContext } from "@/contexts/PoolPositionsContext";
import { cn, hoverUnderlineClassName } from "@/lib/utils";

export default function NavPointsPopover() {
  const { appData } = useAppContext();

  const { totalPoints, pointsPerDay } = usePoolPositionsContext();
  const { updatedAt, addressRow } = usePointsContext();

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
            "group flex h-10 flex-row items-center justify-center gap-2 rounded-md border px-3 transition-colors",
            isOpen ? "bg-border/50" : "hover:bg-border/50",
          )}
        >
          <TokenLogo
            token={
              appData === undefined
                ? undefined
                : getToken(
                    NORMALIZED_STEAMM_POINTS_COINTYPE,
                    appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE],
                  )
            }
            size={16}
          />
          {totalPoints === undefined ? (
            <Skeleton className="h-[21px] w-8" />
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
            token={
              appData === undefined
                ? undefined
                : getToken(
                    NORMALIZED_STEAMM_POINTS_COINTYPE,
                    appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE],
                  )
            }
            size={16}
          />
          <p className="text-p1 text-foreground">STEAMM Points</p>
        </div>

        <div className="flex w-full flex-col gap-2">
          {/* Rank */}
          <div className="flex flex-row items-center justify-between gap-4">
            <p className="text-p2 text-secondary-foreground">Rank</p>
            {addressRow === undefined || updatedAt === undefined ? (
              <Skeleton className="h-[21px] w-12" />
            ) : (
              <Tooltip
                title={`Last updated ${formatDuration(
                  new BigNumber(
                    (new Date().getTime() - updatedAt.getTime()) / 1000,
                  ),
                )} ago`}
              >
                <div className="flex h-full flex-row items-center gap-2">
                  <p
                    className={cn(
                      "!text-p2 text-foreground",
                      cn("decoration-foreground/50", hoverUnderlineClassName),
                      addressRow.rank === 1 && "text-gold",
                      addressRow.rank === 2 && "text-silver",
                      addressRow.rank === 3 && "text-bronze",
                    )}
                  >
                    {addressRow.rank === -1
                      ? "N/A"
                      : formatRank(addressRow.rank)}
                  </p>
                  {[1, 2, 3].includes(addressRow.rank) && (
                    <Trophy
                      className={cn(
                        "h-3 w-3",
                        addressRow.rank === 1 && "text-gold",
                        addressRow.rank === 2 && "text-silver",
                        addressRow.rank === 3 && "text-bronze",
                      )}
                    />
                  )}
                </div>
              </Tooltip>
            )}
          </div>

          {/* Total points */}
          <div className="flex flex-row items-center justify-between gap-4">
            <p className="text-p2 text-secondary-foreground">Total points</p>
            <div className="flex flex-row items-center gap-2">
              {totalPoints === undefined ? (
                <Skeleton className="h-[21px] w-12" />
              ) : (
                <>
                  <TokenLogo
                    token={
                      appData === undefined
                        ? undefined
                        : getToken(
                            NORMALIZED_STEAMM_POINTS_COINTYPE,
                            appData.coinMetadataMap[
                              NORMALIZED_STEAMM_POINTS_COINTYPE
                            ],
                          )
                    }
                    size={16}
                  />
                  <Tooltip
                    title={
                      appData === undefined
                        ? undefined
                        : `${formatPoints(totalPoints, {
                            dp: appData.coinMetadataMap[
                              NORMALIZED_STEAMM_POINTS_COINTYPE
                            ].decimals,
                          })} ${appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE].symbol}`
                    }
                  >
                    <p className="!text-p2 text-foreground">
                      {formatPoints(totalPoints)}
                    </p>
                  </Tooltip>
                </>
              )}
            </div>
          </div>

          {/* Points per day */}
          <div className="flex flex-row items-center justify-between gap-4">
            <p className="text-p2 text-secondary-foreground">Points per day</p>
            <div className="flex flex-row items-center gap-2">
              {pointsPerDay === undefined ? (
                <Skeleton className="h-[21px] w-12" />
              ) : (
                <>
                  <TokenLogo
                    token={
                      appData === undefined
                        ? undefined
                        : getToken(
                            NORMALIZED_STEAMM_POINTS_COINTYPE,
                            appData.coinMetadataMap[
                              NORMALIZED_STEAMM_POINTS_COINTYPE
                            ],
                          )
                    }
                    size={16}
                  />
                  <Tooltip
                    title={
                      appData === undefined
                        ? undefined
                        : `${formatPoints(pointsPerDay, {
                            dp: appData.coinMetadataMap[
                              NORMALIZED_STEAMM_POINTS_COINTYPE
                            ].decimals,
                          })} ${appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE].symbol}`
                    }
                  >
                    <p className="!text-p2 text-foreground">
                      {formatPoints(pointsPerDay)}
                    </p>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Popover>
  );
}
