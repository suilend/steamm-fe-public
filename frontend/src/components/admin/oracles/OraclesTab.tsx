import { QuoterId } from "@suilend/steamm-sdk";
import { OracleQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm/structs";
import { OracleQuoterV2 } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm_v2/structs";

import AddOracleCard from "@/components/admin/oracles/AddOracleCard";
import OracleCard from "@/components/admin/oracles/OracleCard";
import { useLoadedAppContext } from "@/contexts/AppContext";

export default function OraclesTab() {
  const { appData } = useLoadedAppContext();

  const ommPools = appData.pools.filter((pool) =>
    [QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(pool.quoterId),
  );

  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
      {Object.entries(appData.oracleIndexOracleInfoPriceMap).map(
        ([oracleIndex, { oracleInfo, price }]) => (
          <OracleCard
            key={oracleIndex}
            coinTypes={Array.from(
              new Set([
                ...ommPools
                  .filter(
                    (pool) =>
                      (
                        pool.pool.quoter as OracleQuoter | OracleQuoterV2
                      ).oracleIndexA.toString() === oracleIndex,
                  )
                  .map((pool) => pool.coinTypes[0]),
                ...ommPools
                  .filter(
                    (pool) =>
                      (
                        pool.pool.quoter as OracleQuoter | OracleQuoterV2
                      ).oracleIndexB.toString() === oracleIndex,
                  )
                  .map((pool) => pool.coinTypes[1]),
              ]),
            )}
            oracleInfo={oracleInfo}
            price={price}
          />
        ),
      )}

      <AddOracleCard />
    </div>
  );
}
