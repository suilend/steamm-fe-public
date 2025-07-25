import { CSSProperties } from "react";

import BigNumber from "bignumber.js";
import { Trophy, VenetianMask } from "lucide-react";

import {
  NORMALIZED_STEAMM_POINTS_COINTYPE,
  formatAddress,
  formatPoints,
  formatRank,
  getToken,
} from "@suilend/sui-fe";
import { useSettingsContext } from "@suilend/sui-fe-next";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import OpenUrlNewTab from "@/components/OpenUrlNewTab";
import { Column } from "@/components/points/PointsLeaderboardTable";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { PointsLeaderboardRowData } from "@/contexts/LeaderboardContext";
import { PORTFOLIO_URL } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface PointsLeaderboardRowProps {
  columnStyleMap: Record<
    Column,
    { cell: CSSProperties; children: CSSProperties }
  >;
  row: PointsLeaderboardRowData;
}

export default function PointsLeaderboardRow({
  columnStyleMap,
  row,
}: PointsLeaderboardRowProps) {
  const { explorer } = useSettingsContext();
  const { appData } = useLoadedAppContext();

  return (
    <tr className="h-[calc(45px+1px)] border-x border-b bg-background">
      {/* Rank */}
      <td
        className="whitespace-nowrap align-middle"
        style={columnStyleMap.rank.cell}
      >
        <div
          className="flex min-w-max flex-row items-center"
          style={columnStyleMap.rank.children}
        >
          <div className="flex w-max flex-row items-center gap-2">
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
        </div>
      </td>

      {/* Address */}
      <td
        className="whitespace-nowrap align-middle"
        style={columnStyleMap.address.cell}
      >
        <div
          className="flex min-w-max flex-row items-center"
          style={columnStyleMap.address.children}
        >
          <div className="flex w-max flex-row items-center gap-2">
            <Tooltip title={row.address}>
              <p className="text-p2 text-foreground">
                {formatAddress(row.address, 12)}
              </p>
            </Tooltip>

            <div className="flex flex-row items-center gap-1">
              <CopyToClipboardButton value={row.address} />
              <OpenUrlNewTab
                url={explorer.buildAddressUrl(row.address)}
                tooltip={`Open on ${explorer.name}`}
              />
              <OpenUrlNewTab
                url={`${PORTFOLIO_URL}?wallet=${row.address}`}
                Icon={VenetianMask}
                tooltip="View Portfolio as this user"
              />
            </div>
          </div>
        </div>
      </td>

      {/* Total points */}
      <td
        className="whitespace-nowrap align-middle"
        style={columnStyleMap.totalPoints.cell}
      >
        <div
          className="flex min-w-max flex-row items-center"
          style={columnStyleMap.totalPoints.children}
        >
          <div className="flex w-max flex-row items-center gap-2">
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
        </div>
      </td>
    </tr>
  );
}
