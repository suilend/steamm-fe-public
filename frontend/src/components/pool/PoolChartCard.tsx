import { useRouter } from "next/router";
import { useMemo } from "react";

import BigNumber from "bignumber.js";

import { formatPercent, formatUsd } from "@suilend/frontend-sui";
import { shallowPushQuery } from "@suilend/frontend-sui-next";

import HistoricalDataChart from "@/components/HistoricalDataChart";
import { usePoolContext } from "@/contexts/PoolContext";
import { ChartData, ChartType } from "@/lib/chart";
import { cn } from "@/lib/utils";

enum ChartStat {
  TVL = "tvl",
  VOLUME = "volume",
  FEES = "fees",
  APR = "apr",
}

const chartStatNameMap: Record<ChartStat, string> = {
  [ChartStat.TVL]: "TVL",
  [ChartStat.VOLUME]: "Volume",
  [ChartStat.FEES]: "Fees",
  [ChartStat.APR]: "APR",
};

type ChartConfig = {
  title: string;
  hideTitlePeriod?: boolean;
  value?: string;
  chartType: ChartType;
  periodChangePercent?: BigNumber | null;
  data?: ChartData[];
  formatValue: (value: number) => string;
};

enum QueryParams {
  CHART_STAT = "chart",
}

export default function PoolChartCard() {
  const router = useRouter();
  const queryParams = {
    [QueryParams.CHART_STAT]: router.query[QueryParams.CHART_STAT] as
      | ChartStat
      | undefined,
  };

  const { pool } = usePoolContext();

  // Data
  const historicalTvlUsd_30d = useMemo(() => {
    const result: ChartData[] = [];
    for (let i = 0; i < 30; i++) {
      result.push({
        timestampS: 1739253600 + 24 * i * 60 * 60,
        valueUsd: 1000 * Math.random(),
      });
    }

    return result;
  }, []);

  const historicalVolumeUsd_30d = useMemo(() => {
    const result: ChartData[] = [];
    for (let i = 0; i < 30; i++) {
      result.push({
        timestampS: 1739253600 + 24 * i * 60 * 60,
        valueUsd: 1000 * Math.random(),
      });
    }

    return result;
  }, []);

  // const historicalFeesUsd_30d = useMemo(() => {
  //   const result: ChartData[] = [];
  //   for (let i = 0; i < 30; i++) {
  //     result.push({
  //       timestampS: 1739253600 + 24 * i * 60 * 60,
  //       valueUsd: 100 * Math.random(),
  //     });
  //   }

  //   return result;
  // }, []);
  const historicalFeesUsd_30d = undefined;

  const historicalAprPercent_30d = useMemo(() => {
    const result: ChartData[] = [];
    for (let i = 0; i < 30; i++) {
      result.push({
        timestampS: 1739253600 + 24 * i * 60 * 60,
        valueUsd: 3 + Math.random() * 5,
      });
    }

    return result;
  }, []);

  const chartConfigMap: Record<ChartStat, ChartConfig> = useMemo(
    () => ({
      [ChartStat.TVL]: {
        title: chartStatNameMap[ChartStat.TVL],
        hideTitlePeriod: true,
        value: formatUsd(pool.tvlUsd),
        chartType: ChartType.LINE,
        periodChangePercent: null,
        data: historicalTvlUsd_30d,
        formatValue: (value) => formatUsd(new BigNumber(value)),
      },
      [ChartStat.VOLUME]: {
        title: chartStatNameMap[ChartStat.VOLUME],
        value:
          pool.volumeUsd_30d !== undefined
            ? formatUsd(pool.volumeUsd_30d)
            : undefined,
        chartType: ChartType.BAR,
        periodChangePercent: null,
        data: historicalVolumeUsd_30d,
        formatValue: (value) => formatUsd(new BigNumber(value)),
      },
      [ChartStat.FEES]: {
        title: chartStatNameMap[ChartStat.FEES],
        value:
          pool.feesUsd_30d !== undefined
            ? formatUsd(pool.feesUsd_30d)
            : undefined,
        chartType: ChartType.BAR,
        periodChangePercent: null,
        data: historicalFeesUsd_30d,
        formatValue: (value) => formatUsd(new BigNumber(value)),
      },
      [ChartStat.APR]: {
        title: chartStatNameMap[ChartStat.APR],
        value: formatPercent(pool.apr.percent),
        chartType: ChartType.LINE,
        periodChangePercent: null,
        data: historicalAprPercent_30d,
        formatValue: (value) => formatPercent(new BigNumber(value)),
      },
    }),
    [
      pool.tvlUsd,
      historicalTvlUsd_30d,
      pool.volumeUsd_30d,
      historicalVolumeUsd_30d,
      pool.feesUsd_30d,
      historicalFeesUsd_30d,
      pool.apr.percent,
      historicalAprPercent_30d,
    ],
  );

  const selectedChartStat =
    queryParams[QueryParams.CHART_STAT] &&
    Object.values(ChartStat).includes(queryParams[QueryParams.CHART_STAT])
      ? queryParams[QueryParams.CHART_STAT]
      : ChartStat.TVL;
  const onSelectedChartStatChange = (chartStat: ChartStat) => {
    shallowPushQuery(router, {
      ...router.query,
      [QueryParams.CHART_STAT]: chartStat,
    });
  };

  const chartConfig = useMemo(
    () => chartConfigMap[selectedChartStat],
    [chartConfigMap, selectedChartStat],
  );

  return (
    <div className="relative w-full rounded-md border p-5">
      <HistoricalDataChart
        className="relative z-[1]"
        title={chartConfig.title}
        hideTitlePeriod={chartConfig.hideTitlePeriod}
        value={chartConfig.value}
        chartType={chartConfig.chartType}
        periodDays={30}
        periodChangePercent={chartConfig.periodChangePercent}
        data={chartConfig.data}
        formatCategory={(category) => category}
        formatValue={chartConfig.formatValue}
      />

      <div className="absolute right-5 top-5 z-[2] flex flex-row gap-1">
        {Object.values(ChartStat).map((chartStat) => (
          <button
            key={chartStat}
            className={cn(
              "group flex h-6 flex-row items-center rounded-md border px-2 transition-colors",
              selectedChartStat === chartStat
                ? "cursor-default bg-border"
                : "hover:bg-border/50",
            )}
            onClick={() => onSelectedChartStatChange(chartStat)}
          >
            <p
              className={cn(
                "!text-p3 transition-colors",
                selectedChartStat === chartStat
                  ? "text-foreground"
                  : "text-secondary-foreground group-hover:text-foreground",
              )}
            >
              {chartStatNameMap[chartStat]}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
