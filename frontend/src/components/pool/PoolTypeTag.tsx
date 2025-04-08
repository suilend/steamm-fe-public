import Image from "next/image";

import Tag from "@/components/Tag";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { SUILEND_ASSETS_URL } from "@/lib/constants";
import { OracleType } from "@/lib/oracles";
import { ParsedPool, QUOTER_ID_NAME_MAP, QuoterId } from "@/lib/types";

interface PoolTypeTagProps {
  pool: ParsedPool;
}

export default function PoolTypeTag({ pool }: PoolTypeTagProps) {
  const { oraclesData, poolsData } = useLoadedAppContext();

  const isPyth = pool.coinTypes.some(
    (coinType) =>
      oraclesData?.coinTypeOracleInfoPriceMap[coinType]?.oracleInfo
        .oracleType === OracleType.PYTH,
  );
  const isSwitchboard = pool.coinTypes.some(
    (coinType) =>
      oraclesData?.coinTypeOracleInfoPriceMap[coinType]?.oracleInfo
        .oracleType === OracleType.SWITCHBOARD,
  );

  return (
    <Tag
      tooltip={
        [QuoterId.ORACLE, QuoterId.STABLE].includes(pool.quoterId)
          ? poolsData === undefined
            ? undefined
            : [
                "Powered by",
                [isPyth ? "Pyth" : null, isSwitchboard ? "Switchboard" : null]
                  .filter(Boolean)
                  .join(" and "),
              ].join(" ")
          : undefined
      }
      endDecorator={
        [QuoterId.ORACLE, QuoterId.STABLE].includes(pool.quoterId) ? (
          poolsData === undefined ? (
            <Skeleton className="h-3 w-3 bg-tertiary-foreground" />
          ) : (
            <>
              {isPyth && (
                <Image
                  src={`${SUILEND_ASSETS_URL}/partners/Pyth.png`}
                  alt="Pyth logo"
                  width={12}
                  height={12}
                  quality={100}
                />
              )}
              {isSwitchboard && (
                <Image
                  src={`${SUILEND_ASSETS_URL}/partners/Switchboard.png`}
                  alt="Switchboard logo"
                  width={12}
                  height={12}
                  quality={100}
                />
              )}
            </>
          )
        ) : undefined
      }
    >
      {QUOTER_ID_NAME_MAP[pool.quoterId]}
    </Tag>
  );
}
