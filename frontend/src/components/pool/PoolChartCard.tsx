import { useRouter } from "next/router";
import { useMemo } from "react";

import BigNumber from "bignumber.js";
import { ChartNoAxesCombined, Database } from "lucide-react";

import { formatUsd } from "@suilend/frontend-sui";
import { shallowPushQuery } from "@suilend/frontend-sui-next";

import HistoricalDataChart from "@/components/HistoricalDataChart";
import { Skeleton } from "@/components/ui/skeleton";
import { usePoolContext } from "@/contexts/PoolContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { ChartConfig, ChartType, chartStatNameMap } from "@/lib/chart";
import { cn } from "@/lib/utils";

enum ChartStat {
  TVL = "tvl",
  VOLUME = "volume",
  FEES = "fees",
}

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

  // Chart
  const chartConfigMap: Record<ChartStat, ChartConfig> = useMemo(
    () => ({
      [ChartStat.TVL]: {
        title: chartStatNameMap[ChartStat.TVL],
        value: formatUsd(pool.tvlUsd),
        chartType: ChartType.LINE,
        data: poolHistoricalStats.tvlUsd_7d[pool.id],
        dataPeriodDays: 7,
        formatValue: (value) => formatUsd(new BigNumber(value)),
      },
      [ChartStat.VOLUME]: {
        title: chartStatNameMap[ChartStat.VOLUME],
        value:
          poolStats.volumeUsd_7d[pool.id] === undefined
            ? undefined
            : formatUsd(poolStats.volumeUsd_7d[pool.id]),
        valuePeriodDays: 7,
        chartType: ChartType.BAR,
        data: poolHistoricalStats.volumeUsd_7d[pool.id],
        dataPeriodDays: 7,
        formatValue: (value) => formatUsd(new BigNumber(value)),
      },
      [ChartStat.FEES]: {
        title: chartStatNameMap[ChartStat.FEES],
        value:
          poolStats.feesUsd_7d[pool.id] === undefined
            ? undefined
            : formatUsd(poolStats.feesUsd_7d[pool.id]),
        valuePeriodDays: 7,
        chartType: ChartType.BAR,
        dataPeriodDays: 7,
        data: poolHistoricalStats.feesUsd_7d[pool.id],
        formatValue: (value) => formatUsd(new BigNumber(value)),
      },
    }),
    [
      pool.tvlUsd,
      poolHistoricalStats.tvlUsd_7d,
      pool.id,
      poolStats.volumeUsd_7d,
      poolHistoricalStats.volumeUsd_7d,
      poolStats.feesUsd_7d,
      poolHistoricalStats.feesUsd_7d,
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

  if (
    poolHistoricalStats.tvlUsd_7d[pool.id] === undefined ||
    poolHistoricalStats.volumeUsd_7d[pool.id] === undefined ||
    poolHistoricalStats.feesUsd_7d[pool.id] === undefined
  )
    return <Skeleton className="h-[265px] w-full rounded-md md:h-[325px]" />;
  if (
    poolHistoricalStats.tvlUsd_7d[pool.id].every((d) => d.tvlUsd_7d === 0) &&
    poolHistoricalStats.volumeUsd_7d[pool.id].every(
      (d) => d.volumeUsd_7d === 0,
    ) &&
    poolHistoricalStats.feesUsd_7d[pool.id].every((d) => d.feesUsd_7d === 0)
  )
    return (
      <div className="flex h-[265px] w-full flex-col items-center justify-center gap-2 rounded-md bg-card/50 md:h-[325px]">
        <ChartNoAxesCombined className="h-5 w-5 text-secondary-foreground" />
        <p className="text-p2 text-secondary-foreground">No data yet</p>
      </div>
    );
  return (
    <div className="relative w-full rounded-md border p-5">
      <HistoricalDataChart
        className="relative z-[1]"
        title={chartConfig.title}
        value={chartConfig.value}
        valuePeriodDays={chartConfig.valuePeriodDays}
        chartType={chartConfig.chartType}
        data={chartConfig.data}
        dataPeriodDays={chartConfig.dataPeriodDays}
        formatValue={chartConfig.formatValue}
        formatCategory={(category) => category}
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
