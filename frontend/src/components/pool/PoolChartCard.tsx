import { useMemo } from "react";

import BigNumber from "bignumber.js";

import { formatUsd } from "@suilend/sui-fe";

import HistoricalDataChart from "@/components/HistoricalDataChart";
import { usePoolContext } from "@/contexts/PoolContext";
import { useStatsContext } from "@/contexts/StatsContext";
import {
  ChartConfig,
  ChartData,
  ChartDataType,
  ChartPeriod,
  ChartType,
  chartDataTypeNameMap,
} from "@/lib/chart";

export default function PoolChartCard() {
  const { poolHistoricalStats, poolStats } = useStatsContext();

  const {
    selectedChartDataType,
    onSelectedChartDataTypeChange,
    selectedChartPeriod,
    onSelectedChartPeriodChange,
    pool,
  } = usePoolContext();

  // Chart
  const chartConfig: ChartConfig = useMemo(
    () => ({
      getChartType: (dataType: string) => {
        if (dataType === ChartDataType.TVL) return ChartType.LINE;
        return ChartType.BAR;
      },
      getValueFormatter: (dataType: string) => {
        return (value: number) => formatUsd(new BigNumber(value));
      },
      dataTypeOptions: Object.values(ChartDataType).map((dataType) => ({
        id: dataType,
        name: chartDataTypeNameMap[dataType],
      })),
      totalMap: {
        [ChartDataType.TVL]: Object.values(ChartPeriod).reduce(
          (acc, period) => ({
            ...acc,
            [period]: pool.tvlUsd,
          }),
          {} as Record<ChartPeriod, BigNumber | undefined>,
        ),
        [ChartDataType.VOLUME]: Object.values(ChartPeriod).reduce(
          (acc, period) => ({
            ...acc,
            [period]: poolStats.volumeUsd[period][pool.id],
          }),
          {} as Record<ChartPeriod, BigNumber | undefined>,
        ),
        [ChartDataType.FEES]: Object.values(ChartPeriod).reduce(
          (acc, period) => ({
            ...acc,
            [period]: poolStats.feesUsd[period][pool.id],
          }),
          {} as Record<ChartPeriod, BigNumber | undefined>,
        ),
      },
      dataMap: {
        [ChartDataType.TVL]: Object.values(ChartPeriod).reduce(
          (acc, period) => ({
            ...acc,
            [period]: poolHistoricalStats.tvlUsd[period][pool.id],
          }),
          {} as Record<ChartPeriod, ChartData[] | undefined>,
        ),
        [ChartDataType.VOLUME]: Object.values(ChartPeriod).reduce(
          (acc, period) => ({
            ...acc,
            [period]: poolHistoricalStats.volumeUsd[period][pool.id],
          }),
          {} as Record<ChartPeriod, ChartData[] | undefined>,
        ),
        [ChartDataType.FEES]: Object.values(ChartPeriod).reduce(
          (acc, period) => ({
            ...acc,
            [period]: poolHistoricalStats.feesUsd[period][pool.id],
          }),
          {} as Record<ChartPeriod, ChartData[] | undefined>,
        ),
      },
    }),
    [pool.tvlUsd, poolStats, pool.id, poolHistoricalStats],
  );

  return (
    <div className="relative w-full rounded-md border p-5">
      <HistoricalDataChart
        topSelectsClassName="-mx-5 px-5"
        selectedDataType={selectedChartDataType}
        onSelectedDataTypeChange={onSelectedChartDataTypeChange}
        selectedPeriod={selectedChartPeriod}
        onSelectedPeriodChange={onSelectedChartPeriodChange}
        {...chartConfig}
      />
    </div>
  );
}
