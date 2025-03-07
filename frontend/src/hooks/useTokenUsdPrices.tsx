import { useCallback, useEffect, useRef, useState } from "react";

import BigNumber from "bignumber.js";

import { getPrice } from "@suilend/frontend-sui";

const useTokenUsdPrices = (initialCoinTypes: string[]) => {
  const [tokenUsdPricesMap, setTokenUsdPriceMap] = useState<
    Record<string, BigNumber>
  >({});

  const fetchTokenUsdPrice = useCallback(async (coinType: string) => {
    console.log("useTokenUsdPrices - fetchTokenUsdPrice - coinType:", coinType);

    try {
      const result = await getPrice(coinType);
      if (result === undefined || isNaN(result)) return;

      setTokenUsdPriceMap((o) => ({
        ...o,
        [coinType]: BigNumber(result),
      }));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchedInitialTokenUsdPricesRef = useRef<boolean>(false);
  useEffect(() => {
    if (fetchedInitialTokenUsdPricesRef.current) return;

    initialCoinTypes.forEach(fetchTokenUsdPrice);
    fetchedInitialTokenUsdPricesRef.current = true;
  }, [initialCoinTypes, fetchTokenUsdPrice]);

  return { tokenUsdPricesMap, fetchTokenUsdPrice };
};

export default useTokenUsdPrices;
