import { API_URL, getPrice } from "@suilend/sui-fe";

export default function PoolPerformanceChartCard() {
  // ALL TODO
  const poolId = "";
  const coinTypeA = "";
  const coinTypeB = "";
  const startTimestampS = 0;
  // not todo things
  const endTimestampS = Math.floor(Date.now() / 1000 / 10_000) * 10_000;
  const intervalS = Math.floor((endTimestampS - startTimestampS) / 100);
  // this should return a set of datapoints
  const theFunction = async () => {
    const historicalLPTokenRates: number[][] = await (
      await fetch(
        `${API_URL}/steamm/historical/lpTokenRates?` +
          new URLSearchParams({
            startTimestampS: startTimestampS.toString(),
            endTimestampS: endTimestampS.toString(),
            intervalS: intervalS.toString(),
            poolId,
          }).toString(),
      )
    ).json();

    const coinTypeAPrice = await getPrice(coinTypeA);
    const coinTypeBPrice = await getPrice(coinTypeB);

    // shouldn't happen ig
    // idk how to handle
    if (coinTypeAPrice == undefined || coinTypeBPrice == undefined) {
      return;
    }

    // get total value of lp token at each historical point
    const historicalLPTokenValues = historicalLPTokenRates.map(
      ([coinTypeAAmount, cointTypeBAmount]: number[]) => {
        return (
          coinTypeAAmount * coinTypeAPrice + cointTypeBAmount * coinTypeBPrice
        );
      },
    );

    return historicalLPTokenValues;
  };
}
