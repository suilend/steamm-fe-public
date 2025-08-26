import { useMemo } from "react";

import BigNumber from "bignumber.js";

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
  chartPeriodNameMap,
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
  const chartPeriods = useMemo(
    () =>
      Object.values(ChartPeriod).filter(
        (period) =>
          ![ChartPeriod.SIX_MONTHS, ChartPeriod.ONE_YEAR].includes(period),
      ),
    [],
  );

  const chartConfig: ChartConfig = useMemo(
    () => ({
      getChartType: (dataType: string) => {
        if (dataType === ChartDataType.TVL || dataType === ChartDataType.LP)
          return ChartType.LINE;
        return ChartType.BAR;
      },
      periodOptions: chartPeriods.map((period) => ({
        id: period,
        name: chartPeriodNameMap[period],
      })),
      dataTypeOptions: Object.values(ChartDataType).map((dataType) => ({
        id: dataType,
        name: chartDataTypeNameMap[dataType],
      })),
      totalsMap: {
        [ChartDataType.TVL]: chartPeriods.reduce(
          (acc, period) => ({
            ...acc,
            [period]: [pool.tvlUsd],
          }),
          {} as Record<ChartPeriod, BigNumber[] | undefined>,
        ),
        [ChartDataType.VOLUME]: chartPeriods.reduce(
          (acc, period) => ({
            ...acc,
            [period]: [poolStats.volumeUsd[period][pool.id]],
          }),
          {} as Record<ChartPeriod, BigNumber[] | undefined>,
        ),
        [ChartDataType.FEES]: chartPeriods.reduce(
          (acc, period) => ({
            ...acc,
            [period]: [poolStats.feesUsd[period][pool.id]],
          }),
          {} as Record<ChartPeriod, BigNumber[] | undefined>,
        ),
        [ChartDataType.LP]: chartPeriods.reduce(
          (acc, period) => ({
            ...acc,
            [period]:
              poolStats.lpUsd[period][pool.id] === undefined
                ? undefined
                : [
                    poolStats.lpUsd[period][pool.id].LP,
                    poolStats.lpUsd[period][pool.id].Hold,
                  ],
          }),
          {} as Record<ChartPeriod, BigNumber[] | undefined>,
        ),
      },
      dataMap: {
        [ChartDataType.TVL]: chartPeriods.reduce(
          (acc, period) => ({
            ...acc,
            [period]: poolHistoricalStats.tvlUsd[period][pool.id],
          }),
          {} as Record<ChartPeriod, ChartData[] | undefined>,
        ),
        [ChartDataType.VOLUME]: chartPeriods.reduce(
          (acc, period) => ({
            ...acc,
            [period]: poolHistoricalStats.volumeUsd[period][pool.id],
          }),
          {} as Record<ChartPeriod, ChartData[] | undefined>,
        ),
        [ChartDataType.FEES]: chartPeriods.reduce(
          (acc, period) => ({
            ...acc,
            [period]: poolHistoricalStats.feesUsd[period][pool.id],
          }),
          {} as Record<ChartPeriod, ChartData[] | undefined>,
        ),
        [ChartDataType.LP]: chartPeriods.reduce(
          (acc, period) => ({
            ...acc,
            [period]: poolHistoricalStats.lpUsd[period][pool.id],
          }),
          {} as Record<ChartPeriod, ChartData[] | undefined>,
        ),
      },
    }),
    [chartPeriods, pool.tvlUsd, poolStats, pool.id, poolHistoricalStats],
  );

  return (
    <div className="relative w-full rounded-md border p-5">
      <HistoricalDataChart
        selectedDataType={selectedChartDataType}
        onSelectedDataTypeChange={onSelectedChartDataTypeChange}
        selectedPeriod={selectedChartPeriod}
        onSelectedPeriodChange={onSelectedChartPeriodChange}
        isFullWidth
        {...chartConfig}
      />
    </div>
  );
}
