import { useCallback, useEffect, useRef, useState } from "react";

import BigNumber from "bignumber.js";

import { getPrice as fetchBirdeyePrice } from "@suilend/frontend-sui";

const useBirdeyeUsdPrices = (initialCoinTypes: string[]) => {
  const [birdeyeUsdPricesMap, setBirdeyeUsdPriceMap] = useState<
    Record<string, BigNumber>
  >({});

  const fetchBirdeyeUsdPrice = useCallback(async (coinType: string) => {
    console.log(
      "useBirdeyeUsdPrices - fetchBirdeyeUsdPrice - coinType:",
      coinType,
    );

    try {
      const result = await fetchBirdeyePrice(coinType);
      setBirdeyeUsdPriceMap((o) => ({
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

    initialCoinTypes.forEach(fetchBirdeyeUsdPrice);
    fetchedInitialUsdPricesRef.current = true;
  }, [initialCoinTypes, fetchBirdeyeUsdPrice]);

  return { birdeyeUsdPricesMap, fetchBirdeyeUsdPrice };
};

export default useBirdeyeUsdPrices;
