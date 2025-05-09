import Image from "next/image";

import { ClassValue } from "clsx";

import { OracleQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm/structs";
import { OracleQuoterV2 } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm_v2/structs";

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

  const getIsOracleType = (oracleType: OracleType) => {
    if (![QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(pool.quoterId))
      return false;

    const quoter = pool.pool.quoter as OracleQuoter | OracleQuoterV2;
    const oracleIndexes = [quoter.oracleIndexA, quoter.oracleIndexB].map(
      (oracleIndex) => +oracleIndex.toString(),
    );

    return oracleIndexes.some(
      (oracleIndex) =>
        appData.oracleIndexOracleInfoPriceMap[oracleIndex].oracleInfo
          .oracleType === oracleType,
    );
  };

  return (
    <Tag
      className={className}
      tooltip={
        [QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(pool.quoterId)
          ? [
              "Powered by",
              [
                getIsOracleType(OracleType.PYTH) ? "Pyth" : null,
                getIsOracleType(OracleType.SWITCHBOARD) ? "Switchboard" : null,
              ]
                .filter(Boolean)
                .join(" and "),
            ].join(" ")
          : undefined
      }
      endDecorator={
        [QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(pool.quoterId) ? (
          <>
            {getIsOracleType(OracleType.PYTH) && (
              <Image
                src={`${SUILEND_ASSETS_URL}/partners/Pyth.png`}
                alt="Pyth logo"
                width={12}
                height={12}
                quality={100}
              />
            )}
            {getIsOracleType(OracleType.SWITCHBOARD) && (
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
