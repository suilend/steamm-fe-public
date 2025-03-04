import { formatUsd } from "@suilend/frontend-sui";

import AprBreakdown from "@/components/AprBreakdown";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { formatFeeTier, formatPair } from "@/lib/format";
import { ParsedPool, poolTypeNameMap } from "@/lib/types";

interface PoolCardProps {
  pool: ParsedPool;
}

export default function PoolCard({ pool }: PoolCardProps) {
  const { appData } = useLoadedAppContext();

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
          <AprBreakdown
            skeletonClassName="h-[21px] w-12"
            valueClassName="!text-p2"
            pool={pool}
          />
        </div>
      </div>
    </div>
  );
}
