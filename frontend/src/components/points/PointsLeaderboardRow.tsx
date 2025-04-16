import BigNumber from "bignumber.js";
import { Trophy, VenetianMask } from "lucide-react";

import {
  NORMALIZED_STEAMM_POINTS_COINTYPE,
  formatAddress,
  formatPoints,
  formatRank,
  getToken,
} from "@suilend/frontend-sui";
import { useSettingsContext } from "@suilend/frontend-sui-next";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import OpenUrlNewTab from "@/components/OpenUrlNewTab";
import { columnStyleMap } from "@/components/points/PointsLeaderboardTable";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { LeaderboardRowData } from "@/contexts/PointsContext";
import { PORTFOLIO_URL } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface PointsLeaderboardRowProps {
  row: LeaderboardRowData;
}

export default function PointsLeaderboardRow({
  row,
}: PointsLeaderboardRowProps) {
  const { explorer } = useSettingsContext();
  const { appData } = useLoadedAppContext();

  return (
    <div className="relative z-[1] flex min-h-[calc(53px+1px)] w-full min-w-max shrink-0 flex-row items-center border-x border-b bg-background">
      {/* Rank */}
      <div
        className="flex h-full flex-row items-center gap-2"
        style={columnStyleMap.rank}
      >
        <p
          className={cn(
            "!text-p2 text-foreground",
            row.rank === 1 && "text-gold",
            row.rank === 2 && "text-silver",
            row.rank === 3 && "text-bronze",
          )}
        >
          {row.rank === -1 ? "N/A" : formatRank(row.rank)}
        </p>
        {[1, 2, 3].includes(row.rank) && (
          <Trophy
            className={cn(
              "h-3 w-3",
              row.rank === 1 && "text-gold",
              row.rank === 2 && "text-silver",
              row.rank === 3 && "text-bronze",
            )}
          />
        )}
      </div>

      {/* Address */}
      <div
        className="flex h-full flex-row items-center gap-2"
        style={columnStyleMap.address}
      >
        <Tooltip title={row.address}>
          <p className="text-p2 text-foreground">
            {formatAddress(row.address, 12)}
          </p>
        </Tooltip>

        <div className="flex flex-row items-center gap-1">
          <CopyToClipboardButton value={row.address} />
          <OpenUrlNewTab url={explorer.buildAddressUrl(row.address)} />
          <OpenUrlNewTab
            url={`${PORTFOLIO_URL}?wallet=${row.address}`}
            Icon={VenetianMask}
            tooltip="View Portfolio as this user"
          />
        </div>
      </div>

      {/* Total points */}
      <div
        className="flex h-full flex-row items-center gap-2"
        style={columnStyleMap.totalPoints}
      >
        <TokenLogo
          token={getToken(
            NORMALIZED_STEAMM_POINTS_COINTYPE,
            appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE],
          )}
          size={16}
        />
        <Tooltip
          title={`${formatPoints(
            row.totalPoints.eq(-1) ? new BigNumber(0) : row.totalPoints,
            {
              dp: appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE]
                .decimals,
            },
          )} ${appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE].symbol}`}
        >
          <p className="text-p2 text-foreground">
            {formatPoints(
              row.totalPoints.eq(-1) ? new BigNumber(0) : row.totalPoints,
            )}
          </p>
        </Tooltip>
      </div>

      {/* Points per day */}
      <div
        className="flex h-full flex-row items-center gap-2"
        style={columnStyleMap.pointsPerDay}
      >
        <TokenLogo
          token={getToken(
            NORMALIZED_STEAMM_POINTS_COINTYPE,
            appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE],
          )}
          size={16}
        />
        <Tooltip
          title={`${formatPoints(
            row.pointsPerDay.eq(-1) ? new BigNumber(0) : row.pointsPerDay,
            {
              dp: appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE]
                .decimals,
            },
          )} ${appData.coinMetadataMap[NORMALIZED_STEAMM_POINTS_COINTYPE].symbol}`}
        >
          <p className="text-p2 text-foreground">
            {formatPoints(
              row.pointsPerDay.eq(-1) ? new BigNumber(0) : row.pointsPerDay,
            )}
          </p>
        </Tooltip>
      </div>
    </div>
  );
}
