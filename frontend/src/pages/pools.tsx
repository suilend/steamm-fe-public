import Head from "next/head";
import { useMemo } from "react";

import BigNumber from "bignumber.js";

import {
  NORMALIZED_AUSD_COINTYPE,
  NORMALIZED_DEEP_COINTYPE,
  NORMALIZED_SEND_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_USDC_COINTYPE,
  NORMALIZED_sSUI_COINTYPE,
} from "@suilend/frontend-sui";
import useCoinMetadataMap from "@suilend/frontend-sui-next/hooks/useCoinMetadataMap";

import BarChartStat, { BarChartData } from "@/components/BarChartStat";
import Tag from "@/components/Tag";
import { useLoadedAppContext } from "@/contexts/AppContext";

export default function Pools() {
  const { appData } = useLoadedAppContext();

  // Charts
  const chartCoinTypes = useMemo(
    () => [
      NORMALIZED_SUI_COINTYPE,
      NORMALIZED_DEEP_COINTYPE,
      NORMALIZED_USDC_COINTYPE,
      NORMALIZED_SEND_COINTYPE,
      NORMALIZED_sSUI_COINTYPE,
      NORMALIZED_AUSD_COINTYPE,
    ],
    [],
  );
  const chartCoinMetadataMap = useCoinMetadataMap(chartCoinTypes);

  const tvlData: BarChartData[] | undefined = useMemo(() => {
    if (!chartCoinMetadataMap) return undefined;
    if (chartCoinTypes.some((coinType) => !chartCoinMetadataMap[coinType]))
      return undefined;

    const data: BarChartData[] = [];

    for (let i = 0; i < 32; i++) {
      data.push({
        timestampS: 1739253600 + i * 24 * 60 * 60,
        ...chartCoinTypes.reduce(
          (acc, coinType, index) => ({
            ...acc,
            [chartCoinMetadataMap[coinType].symbol]:
              Math.random() * 1.5 ** index * 1000,
          }),
          {},
        ),
      });
    }

    return data;
  }, [chartCoinMetadataMap, chartCoinTypes]);

  const volumeData: BarChartData[] | undefined = useMemo(() => {
    if (!chartCoinMetadataMap) return undefined;
    if (chartCoinTypes.some((coinType) => !chartCoinMetadataMap[coinType]))
      return undefined;

    const data: BarChartData[] = [];

    for (let i = 0; i < 32; i++) {
      data.push({
        timestampS: 1739253600 + i * 60 * 60,
        ...chartCoinTypes.reduce(
          (acc, coinType) => ({
            ...acc,
            [chartCoinMetadataMap[coinType].symbol]: Math.random() * 1000,
          }),
          {},
        ),
      });
    }

    return data;
  }, [chartCoinMetadataMap, chartCoinTypes]);

  return (
    <>
      <Head>
        <title>STEAMM | Pools</title>
      </Head>

      <div className="flex w-full flex-col gap-8">
        <h1 className="text-h1 text-foreground">Pools</h1>

        {/* Charts */}
        <div className="flex w-full flex-col rounded-md border md:flex-row md:items-stretch">
          {/* TVL chart */}
          <div className="flex-1">
            <div className="w-full p-5">
              <BarChartStat
                title="TVL"
                periodDays={30}
                periodChangePercent={new BigNumber(-4.92)}
                data={tvlData}
              />
            </div>
          </div>

          <div className="h-px w-full bg-border md:h-auto md:w-px" />

          {/* Volume chart */}
          <div className="flex-1">
            <div className="w-full p-5">
              <BarChartStat
                title="Volume"
                periodDays={1}
                periodChangePercent={new BigNumber(2.51)}
                data={volumeData}
              />
            </div>
          </div>
        </div>

        {/* Featured pools */}
        <div className="flex w-full flex-col gap-6">
          <h2 className="text-h3 text-foreground">Featured pools</h2>
        </div>

        {/* All pools */}
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-row items-center gap-3">
            <h2 className="text-h3 text-foreground">All pools</h2>
            <Tag>{appData.pools.length}</Tag>
          </div>
        </div>
      </div>
    </>
  );
}
