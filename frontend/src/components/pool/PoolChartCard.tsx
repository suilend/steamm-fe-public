import { useRouter } from "next/router";
import { useMemo } from "react";

import BigNumber from "bignumber.js";

import { formatUsd } from "@suilend/frontend-sui";
import { shallowPushQuery } from "@suilend/frontend-sui-next";

import HistoricalDataChart from "@/components/HistoricalDataChart";
import { usePoolContext } from "@/contexts/PoolContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { ChartData, ChartType } from "@/lib/chart";
import { cn } from "@/lib/utils";

enum ChartStat {
  TVL = "tvl",
  VOLUME = "volume",
  FEES = "fees",
}

const chartStatNameMap: Record<ChartStat, string> = {
  [ChartStat.TVL]: "TVL",
  [ChartStat.VOLUME]: "Volume",
  [ChartStat.FEES]: "Fees",
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

  const { poolHistoricalStats, poolStats } = useStatsContext();

  const { pool } = usePoolContext();

  const chartConfigMap: Record<ChartStat, ChartConfig> = useMemo(
    () => ({
      [ChartStat.TVL]: {
        title: chartStatNameMap[ChartStat.TVL],
        hideTitlePeriod: true,
        value: formatUsd(pool.tvlUsd),
        chartType: ChartType.LINE,
        periodChangePercent: null,
        data: poolHistoricalStats.tvlUsd_24h[pool.id],
        formatValue: (value) => formatUsd(new BigNumber(value)),
      },
      [ChartStat.VOLUME]: {
        title: chartStatNameMap[ChartStat.VOLUME],
        value:
          poolStats.volumeUsd_24h[pool.id] === undefined
            ? undefined
            : formatUsd(poolStats.volumeUsd_24h[pool.id]),
        chartType: ChartType.BAR,
        periodChangePercent: null,
        data: poolHistoricalStats.volumeUsd_24h[pool.id],
        formatValue: (value) => formatUsd(new BigNumber(value)),
      },
      [ChartStat.FEES]: {
        title: chartStatNameMap[ChartStat.FEES],
        value:
          poolStats.feesUsd_24h[pool.id] === undefined
            ? undefined
            : formatUsd(poolStats.feesUsd_24h[pool.id]),
        chartType: ChartType.BAR,
        periodChangePercent: null,
        data: poolHistoricalStats.feesUsd_24h[pool.id],
        formatValue: (value) => formatUsd(new BigNumber(value)),
      },
    }),
    [
      pool.tvlUsd,
      poolHistoricalStats.tvlUsd_24h,
      pool.id,
      poolStats.volumeUsd_24h,
      poolHistoricalStats.volumeUsd_24h,
      poolStats.feesUsd_24h,
      poolHistoricalStats.feesUsd_24h,
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
        periodDays={1}
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
