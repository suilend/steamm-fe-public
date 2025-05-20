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
  wrap?: boolean;
  isSmall?: boolean;
  isLarge?: boolean;
  pool: ParsedPool;
}

export default function PoolLabel({
  className,
  headingClassName,
  wrap,
  isSmall,
  isLarge,
  pool,
}: PoolLabelProps) {
  const { appData, verifiedPoolIds } = useLoadedAppContext();

  const Heading = isLarge ? "h1" : "p";
  const isVerified = verifiedPoolIds?.includes(pool.id);

  return (
    <div
      className={cn(
        "flex flex-row",
        !wrap && "w-max shrink-0",
        isSmall ? "gap-2" : "gap-3",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 flex-row items-center",
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
          "flex flex-row items-center gap-y-1",
          wrap && "flex-wrap",
          isSmall ? "gap-x-2" : "gap-x-3",
        )}
      >
        <div
          className={cn(
            "flex flex-row items-center",
            isLarge ? "gap-2" : "gap-1.5",
          )}
        >
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
          {isVerified && (
            <Tooltip title="Verified pool">
              <BadgeCheck
                className={cn(
                  "text-verified",
                  isSmall ? "h-3.5 w-3.5" : isLarge ? "h-6 w-6" : "h-4 w-4",
                )}
              />
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
