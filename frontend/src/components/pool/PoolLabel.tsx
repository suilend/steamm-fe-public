import { ClassValue } from "clsx";

import { ParsedPool, QuoterId } from "@suilend/steamm-sdk";

import PoolTypeTag from "@/components/pool/PoolTypeTag";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import VerifiedBadge from "@/components/VerifiedBadge";
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
  const { appData, verifiedCoinTypes } = useLoadedAppContext();

  const isVerified = pool.coinTypes.every((coinType) =>
    verifiedCoinTypes?.includes(coinType),
  );

  const Heading = isLarge ? "h1" : "p";

  return (
    <div
      className={cn(
        "flex h-max flex-row",
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
              "flex w-max flex-row items-center text-foreground",
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

          {isVerified && <VerifiedBadge isSmall={isSmall} isLarge={isLarge} />}
        </div>

        {/* Tags */}
        <div className="flex flex-row items-center gap-px">
          <PoolTypeTag
            className={cn(
              ![QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(pool.quoterId) &&
                "rounded-r-[0] pr-2",
            )}
            pool={pool}
          />
          {![QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(pool.quoterId) && (
            <Tag className="rounded-l-[0] pl-2">
              {formatFeeTier(pool.feeTierPercent)}
            </Tag>
          )}
        </div>
      </div>
    </div>
  );
}
