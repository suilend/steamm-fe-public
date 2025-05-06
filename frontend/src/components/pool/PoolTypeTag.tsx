import Image from "next/image";

import { ClassValue } from "clsx";

import Tag from "@/components/Tag";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { SUILEND_ASSETS_URL } from "@/lib/constants";
import { OracleType } from "@/lib/oracles";
import { ParsedPool, QUOTER_ID_NAME_MAP, QuoterId } from "@/lib/types";

interface PoolTypeTagProps {
  className?: ClassValue;
  pool: ParsedPool;
}

export default function PoolTypeTag({ className, pool }: PoolTypeTagProps) {
  const { appData } = useLoadedAppContext();

  const isPyth = pool.coinTypes.some(
    (coinType) =>
      appData.coinTypeOracleInfoPriceMap[coinType]?.oracleInfo.oracleType ===
      OracleType.PYTH,
  );
  const isSwitchboard = pool.coinTypes.some(
    (coinType) =>
      appData.coinTypeOracleInfoPriceMap[coinType]?.oracleInfo.oracleType ===
      OracleType.SWITCHBOARD,
  );

  return (
    <Tag
      className={className}
      tooltip={
        [QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(pool.quoterId)
          ? [
              "Powered by",
              [isPyth ? "Pyth" : null, isSwitchboard ? "Switchboard" : null]
                .filter(Boolean)
                .join(" and "),
            ].join(" ")
          : undefined
      }
      endDecorator={
        [QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(pool.quoterId) ? (
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
        ) : undefined
      }
    >
      {QUOTER_ID_NAME_MAP[pool.quoterId]}
    </Tag>
  );
}
