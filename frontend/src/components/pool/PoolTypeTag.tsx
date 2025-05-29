import { ClassValue } from "clsx";

import { ParsedPool, QUOTER_ID_NAME_MAP, QuoterId } from "@suilend/steamm-sdk";
import { OracleQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm/structs";
import { OracleQuoterV2 } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm_v2/structs";

import PythLogo from "@/components/PythLogo";
import SwitchboardLogo from "@/components/SwitchboardLogo";
import Tag from "@/components/Tag";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { OracleType } from "@/lib/oracles";

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
          ? `Powered by ${[
              getIsOracleType(OracleType.PYTH) ? "Pyth" : null,
              getIsOracleType(OracleType.SWITCHBOARD) ? "Switchboard" : null,
            ]
              .filter(Boolean)
              .join(" and ")}`
          : undefined
      }
      endDecorator={
        [QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(pool.quoterId) ? (
          <div className="flex flex-row gap-1">
            {getIsOracleType(OracleType.PYTH) && <PythLogo size={12} />}
            {getIsOracleType(OracleType.SWITCHBOARD) && (
              <SwitchboardLogo size={12} />
            )}
          </div>
        ) : undefined
      }
    >
      {QUOTER_ID_NAME_MAP[pool.quoterId]}
    </Tag>
  );
}
