import { formatUsd } from "@suilend/frontend-sui";

import AprBreakdown from "@/components/AprBreakdown";
import PoolTypeTag from "@/components/pool/PoolTypeTag";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { formatFeeTier, formatPair } from "@/lib/format";
import { ParsedPool } from "@/lib/types";

interface PoolCardProps {
  pool: ParsedPool;
}

export default function PoolCard({ pool }: PoolCardProps) {
  const { appData } = useLoadedAppContext();

  return (
    <div className="group flex w-full flex-col gap-2 rounded-md border p-4 transition-colors hover:bg-border/50">
      {/* Top */}
      <div className="flex w-full flex-row items-center gap-2">
        <TokenLogos coinTypes={pool.coinTypes} size={20} />
        <p className="text-p1 text-foreground">
          {formatPair(
            pool.coinTypes.map(
              (coinType) => appData.coinMetadataMap[coinType].symbol,
            ),
          )}
        </p>

        <div className="flex flex-row items-center gap-px">
          <PoolTypeTag className="rounded-r-[0] pr-2" pool={pool} />
          <Tag className="rounded-l-[0] pl-2">
            {formatFeeTier(pool.feeTierPercent)}
          </Tag>
        </div>
      </div>

      {/* Bottom */}
      <div className="flex w-full flex-row items-center gap-6">
        <div className="flex flex-row items-center gap-2">
          <p className="text-p2 text-secondary-foreground">TVL</p>

          <Tooltip title={formatUsd(pool.tvlUsd, { exact: true })}>
            <p className="text-p2 text-foreground">{formatUsd(pool.tvlUsd)}</p>
          </Tooltip>
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
