import { formatPercent, formatUsd } from "@suilend/frontend-sui";

import TokenLogos from "@/components/TokenLogos";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { formatFeeTier, formatPair } from "@/lib/format";
import { ParsedPool, poolTypeNameMap } from "@/lib/types";

import Tag from "../Tag";

interface PoolCardProps {
  pool: ParsedPool;
}

export default function PoolCard({ pool }: PoolCardProps) {
  const { appData } = useLoadedAppContext();
  const { statsData } = useStatsContext();

  return (
    <div className="group flex w-full flex-col gap-3 rounded-md border p-4 transition-colors hover:bg-border/50">
      {/* Top */}
      <div className="flex w-full flex-row items-center gap-2">
        <TokenLogos coinTypes={pool.coinTypes} size={16} />
        <p className="text-p1 text-foreground">
          {formatPair([
            appData.coinMetadataMap[pool.coinTypes[0]].symbol,
            appData.coinMetadataMap[pool.coinTypes[1]].symbol,
          ])}
        </p>

        <div className="flex flex-row items-center gap-1">
          <Tag>{pool.type ? poolTypeNameMap[pool.type] : "--"}</Tag>
          <Tag>{formatFeeTier(pool.feeTierPercent)}</Tag>
        </div>
      </div>

      {/* Bottom */}
      <div className="flex w-full flex-row items-center gap-6">
        <div className="flex flex-row items-center gap-2">
          <p className="text-p2 text-secondary-foreground">TVL</p>
          <p className="text-p2 text-foreground">{formatUsd(pool.tvlUsd)}</p>
        </div>

        <div className="flex flex-row items-center gap-2">
          <p className="text-p2 text-secondary-foreground">APR</p>
          {statsData?.poolAprPercent_24h_map?.[pool.id] === undefined ? (
            <Skeleton className="h-[21px] w-12" />
          ) : (
            <p className="text-p2 text-foreground">
              {formatPercent(statsData.poolAprPercent_24h_map[pool.id])}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
