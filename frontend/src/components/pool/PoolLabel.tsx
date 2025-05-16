import { ClassValue } from "clsx";
import { BadgeCheck } from "lucide-react";

import { ParsedPool } from "@suilend/steamm-sdk";

import PoolTypeTag from "@/components/pool/PoolTypeTag";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { formatFeeTier, formatPair } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PoolLabelProps {
  className?: ClassValue;
  headingClassName?: ClassValue;
  isSmall?: boolean;
  isLarge?: boolean;
  pool: ParsedPool;
}

export default function PoolLabel({
  className,
  headingClassName,
  isSmall,
  isLarge,
  pool,
}: PoolLabelProps) {
  const { appData, verifiedPoolIds } = useLoadedAppContext();

  const Heading = isLarge ? "h1" : "p";

  return (
    <div
      className={cn("flex flex-row", isSmall ? "gap-2" : "gap-3", className)}
    >
      <div
        className={cn(
          "flex flex-row items-center",
          isSmall ? "h-[21px]" : isLarge ? "h-[36px]" : "h-[24px]",
        )}
      >
        <TokenLogos
          coinTypes={pool.coinTypes}
          size={isSmall ? 16 : isLarge ? 32 : 20}
        />
      </div>

      <div
        className={cn(
          "flex flex-row flex-wrap items-center gap-y-1",
          isSmall ? "gap-x-2" : "gap-x-3",
        )}
      >
        <div className="flex flex-row items-center gap-1.5">
          <Heading
            className={cn(
              "text-foreground",
              isSmall ? "text-p2" : isLarge ? "text-h2" : "text-p1",
              headingClassName,
            )}
          >
            {formatPair(
              pool.coinTypes.map(
                (coinType) => appData.coinMetadataMap[coinType].symbol,
              ),
            )}
          </Heading>
          {verifiedPoolIds?.includes(pool.id) && (
            <Tooltip title="Verified pool">
              <BadgeCheck className="h-4 w-4 text-verified" />
            </Tooltip>
          )}
        </div>

        <div className="flex flex-row items-center gap-px">
          <PoolTypeTag className="rounded-r-[0] pr-2" pool={pool} />
          <Tag className="rounded-l-[0] pl-2">
            {formatFeeTier(pool.feeTierPercent)}
          </Tag>
        </div>
      </div>
    </div>
  );
}
