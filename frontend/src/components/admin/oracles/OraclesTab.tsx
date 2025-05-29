import { useEffect, useMemo, useRef, useState } from "react";

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

  // Pyth price identifier -> symbol map
  const [pythPriceIdentifierSymbolMap, setPythPriceIdentifierSymbolMap] =
    useState<Record<string, string> | undefined>(undefined);

  const hasFetchedPythPriceIdentifierSymbolMapRef = useRef<boolean>(false);
  useEffect(() => {
    if (hasFetchedPythPriceIdentifierSymbolMapRef.current) return;
    hasFetchedPythPriceIdentifierSymbolMapRef.current = true;

    (async () => {
      try {
        const res = await fetch(
          "https://hermes.pyth.network/v2/price_feeds?asset_type=crypto",
        );
        const json: {
          id: string;
          attributes: {
            symbol: string;
          };
        }[] = await res.json();

        setPythPriceIdentifierSymbolMap(
          json.reduce(
            (acc, d) => ({ ...acc, [d.id]: d.attributes.symbol }),
            {} as Record<string, string>,
          ),
        );
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
      {Object.entries(appData.oracleIndexOracleInfoPriceMap).map(
        ([oracleIndex, { oracleInfo, price }]) => (
          <OracleCard
            key={oracleIndex}
            pythPriceIdentifierSymbolMap={pythPriceIdentifierSymbolMap}
            coinMetadataMap={coinMetadataMap}
            coinTypes={Object.entries(appData.coinTypeOracleInfoPriceMap)
              .filter(
                ([_, { oracleInfo }]) =>
                  oracleInfo.oracleIndex === +oracleIndex,
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
