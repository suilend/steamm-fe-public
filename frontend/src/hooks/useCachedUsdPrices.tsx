import { useCallback, useEffect, useRef, useState } from "react";

import BigNumber from "bignumber.js";

import { getPrice as fetchCachedPrice } from "@suilend/sui-fe";

const useCachedUsdPrices = (initialCoinTypes: string[]) => {
  const [cachedUsdPricesMap, setCachedUsdPriceMap] = useState<
    Record<string, BigNumber>
  >({});

  const fetchCachedUsdPrice = useCallback(async (coinType: string) => {
    console.log(
      "useCachedUsdPrices - fetchCachedUsdPrice - coinType:",
      coinType,
    );

    try {
      const result = await fetchCachedPrice(coinType);
      setCachedUsdPriceMap((o) => ({
        ...o,
        [coinType]: BigNumber(
          result === undefined || isNaN(result) ? 0 : result,
        ),
      }));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchedInitialUsdPricesRef = useRef<boolean>(false);
  useEffect(() => {
    if (fetchedInitialUsdPricesRef.current) return;

    initialCoinTypes.forEach(fetchCachedUsdPrice);
    fetchedInitialUsdPricesRef.current = true;
  }, [initialCoinTypes, fetchCachedUsdPrice]);

  return { cachedUsdPricesMap, fetchCachedUsdPrice };
};

export default useCachedUsdPrices;
