import { useMemo } from "react";

import useCoinMetadataMap from "@suilend/sui-fe-next/hooks/useCoinMetadataMap";

import AddOracleCard from "@/components/admin/oracles/AddOracleCard";
import OracleCard from "@/components/admin/oracles/OracleCard";
import { useLoadedAppContext } from "@/contexts/AppContext";

export default function OraclesTab() {
  const { appData } = useLoadedAppContext();

  // CoinMetadata
  const additionalCoinTypes = useMemo(
    () =>
      Object.keys(appData.coinTypeOracleInfoPriceMap).filter(
        (coinType) => !Object.keys(appData.coinMetadataMap).includes(coinType),
      ),
    [appData.coinTypeOracleInfoPriceMap, appData.coinMetadataMap],
  );
  const additionalCoinMetadataMap = useCoinMetadataMap(additionalCoinTypes);

  const coinMetadataMap = useMemo(
    () => ({ ...appData.coinMetadataMap, ...additionalCoinMetadataMap }),
    [appData.coinMetadataMap, additionalCoinMetadataMap],
  );

  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
      {Object.entries(appData.oracleIndexOracleInfoPriceMap).map(
        ([oracleIndex, { oracleInfo, price }]) => (
          <OracleCard
            key={oracleIndex}
            coinMetadataMap={coinMetadataMap}
            coinTypes={Object.entries(appData.coinTypeOracleInfoPriceMap)
              .filter(
                ([_, value]) =>
                  value !== undefined &&
                  value.oracleInfo.oracleIndex === +oracleIndex,
              )
              .map(([coinType]) => coinType)}
            oracleInfo={oracleInfo}
            price={price}
          />
        ),
      )}

      <AddOracleCard />
    </div>
  );
}
