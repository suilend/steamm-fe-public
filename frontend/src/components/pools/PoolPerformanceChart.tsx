import { API_URL, getHistoryPrice, getPrice } from "@suilend/sui-fe";

export default function PoolPerformanceChartCard() {
  // ALL TODO
  const poolId = "";
  const coinTypeA = "";
  const coinTypeB = "";
  const startTimestampS = 0;
  const useHistoricalPrices = false;
  // not todo things
  const endTimestampS = Math.floor(Date.now() / 1000 / 3_600) * 3_600;
  const intervalS = Math.floor((endTimestampS - startTimestampS) / 100);
  // this should return a set of datapoints
  const theFunction = async () => {
    const [
      historicalLPTokenRates,
      historicalCoinTypeAPrices,
      historicalCoinTypeBPrices,
      coinTypeAPrice,
      coinTypeBPrice,
    ] = await Promise.all([
      (
        await fetch(
          `${API_URL}/steamm/historical/lpTokenRates?` +
            new URLSearchParams({
              startTimestampS: startTimestampS.toString(),
              endTimestampS: endTimestampS.toString(),
              intervalS: intervalS.toString(),
              poolId,
            }).toString(),
        )
      ).json(),
      getHistoryPrice(
        coinTypeA,
        intervalS.toString(),
        startTimestampS,
        endTimestampS,
      ),
      getHistoryPrice(
        coinTypeB,
        intervalS.toString(),
        startTimestampS,
        endTimestampS,
      ),
      getPrice(coinTypeA),
      getPrice(coinTypeB),
    ]);

    // shouldn't happen ig
    // idk how to handle
    if (
      coinTypeAPrice == undefined ||
      coinTypeBPrice == undefined ||
      historicalCoinTypeAPrices == undefined ||
      historicalCoinTypeBPrices == undefined
    ) {
      return;
    }

    // get total value of lp token at each historical point
    if (useHistoricalPrices) {
      // use historical prices
      return historicalLPTokenRates.map(
        ([coinTypeAAmount, cointTypeBAmount]: number[], i: number) => {
          return (
            coinTypeAAmount * historicalCoinTypeAPrices[i].priceUsd +
            cointTypeBAmount * historicalCoinTypeBPrices[i].priceUsd
          );
        },
      );
    } else {
      // just use current price to calculate value of lp token historically
      return historicalLPTokenRates.map(
        ([coinTypeAAmount, cointTypeBAmount]: number[]) => {
          return (
            coinTypeAAmount * coinTypeAPrice + cointTypeBAmount * coinTypeBPrice
          );
        },
      );
    }
  };
}
