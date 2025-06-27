import { useMemo, useRef } from "react";

import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";
import { formatDate } from "date-fns";
import * as Recharts from "recharts";
import { v4 as uuidv4 } from "uuid";

import { formatUsd } from "@suilend/sui-fe";

import NoDataIcon from "@/components/icons/NoDataIcon";
import SelectPopover from "@/components/SelectPopover";
import { Skeleton } from "@/components/ui/skeleton";
import useBreakpoint from "@/hooks/useBreakpoint";
import {
  ChartConfig,
  ChartData,
  ChartDataType,
  ChartPeriod,
  ChartType,
  ViewBox,
  chartPeriodNameMap,
  getTooltipStyle,
} from "@/lib/chart";
import { SelectPopoverOption } from "@/lib/select";
import { cn } from "@/lib/utils";

function ActiveBar({ ...props }) {
  return (
    <>
      <Recharts.Rectangle
        {...props.background}
        width={1}
        x={props.x + props.width / 2}
        fill="hsl(var(--foreground))"
      />
      <Recharts.Rectangle {...props} fill="transparent" />
    </>
  );
}

interface TooltipContentProps {
  valueFormatter: (value: number) => string;
  category: string;
  d: ChartData;
  viewBox: ViewBox;
  x: number;
}

function TooltipContent({
  valueFormatter,
  category,
  d,
  viewBox,
  x,
}: TooltipContentProps) {
  return (
    // Subset of TooltipContent className
    <div
      className="absolute rounded-md border bg-tooltip px-3 py-1.5"
      style={getTooltipStyle(160, viewBox, x)}
    >
      <div className="flex flex-col gap-1">
        <p className="text-p2 text-secondary-foreground">
          {formatDate(new Date(d.timestampS * 1000), "d MMM HH:mm")}
        </p>
        <p className="text-p2 text-foreground">{valueFormatter(d[category])}</p>
      </div>
    </div>
  );
}

interface HistoricalDataChartProps extends ChartConfig {
  className?: ClassValue;
  topSelectsClassName?: ClassValue;
  chartClassName?: ClassValue;
  selectedDataType: ChartDataType;
  onSelectedDataTypeChange: (dataType: ChartDataType) => void;
  selectedPeriod: ChartPeriod;
  onSelectedPeriodChange: (period: ChartPeriod) => void;
  isFullWidth: boolean;
}

export default function HistoricalDataChart({
  className,
  topSelectsClassName,
  chartClassName,
  selectedDataType,
  onSelectedDataTypeChange,
  selectedPeriod,
  onSelectedPeriodChange,
  isFullWidth,
  getChartType,
  getValueFormatter,
  periodOptions: _periodOptions,
  dataTypeOptions,
  totalMap,
  dataMap,
}: HistoricalDataChartProps) {
  const { md } = useBreakpoint();

  const gradientId = useRef<string>(uuidv4()).current;

  const chartType: ChartType = getChartType(selectedDataType);
  const valueFormatter: (value: number) => string =
    getValueFormatter(selectedDataType);
  const total: BigNumber | undefined =
    totalMap[selectedDataType]?.[selectedPeriod];
  const data: ChartData[] | undefined =
    dataMap[selectedDataType]?.[selectedPeriod];

  const periodOptions: SelectPopoverOption[] = useMemo(
    () =>
      _periodOptions ??
      Object.values(ChartPeriod).map((period) => ({
        id: period,
        name: chartPeriodNameMap[period],
      })),
    [_periodOptions],
  );

  // Data
  const processedData: ChartData[] | undefined = useMemo(() => {
    if (data === undefined) return undefined;

    const categories =
      data.length > 0
        ? Object.keys(data[0]).filter((key) => key !== "timestampS")
        : [];

    const minY = Math.min(
      ...data.map((d) => categories.map((category) => d[category])).flat(),
    );

    return data.map((d) => ({
      timestampS: d.timestampS,
      ...categories.reduce(
        (acc, category) => ({
          ...acc,
          [category]: d[category],
          [`${category}_scaled`]: d[category] - minY * 0.75,
        }),
        {},
      ),
    }));
  }, [data]);

  const timestampsS =
    processedData === undefined
      ? []
      : processedData.map((d) => d.timestampS).flat();

  const categories =
    processedData === undefined
      ? []
      : processedData.length > 0
        ? Object.keys(processedData[0]).filter(
            (key) => key !== "timestampS" && !key.endsWith("_scaled"),
          )
        : [];

  // Min/max
  const minX = Math.min(...timestampsS);
  const maxX = Math.max(...timestampsS);

  const minY = 0;
  const maxY =
    processedData === undefined
      ? 0
      : Math.max(
          ...processedData
            .map((d) => categories.map((category) => d[category]))
            .flat(),
        );

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {/* Top */}
      <div className="flex w-full flex-col gap-1">
        {/* Selects */}
        <div className={cn("overflow-x-auto", topSelectsClassName)}>
          <div className="flex w-max flex-row items-center gap-3">
            {dataTypeOptions.length > 1 ? (
              <SelectPopover
                popoverContentClassName="p-0 border-none"
                className="h-6 w-max gap-0.5 border-none bg-[transparent] px-0"
                textClassName="!text-p2 !text-secondary-foreground"
                iconClassName="!text-secondary-foreground"
                optionClassName="h-8 p-2"
                optionTextClassName="!text-p2"
                align="start"
                alignOffset={-(2 + 1 + 8)}
                maxWidth={100}
                options={dataTypeOptions}
                values={[selectedDataType]}
                onChange={(id: string) =>
                  onSelectedDataTypeChange(id as ChartDataType)
                }
              />
            ) : (
              <p className="text-p2 text-secondary-foreground">
                {dataTypeOptions[0].name}
              </p>
            )}

            {periodOptions.length > 1 ? (
              <SelectPopover
                popoverContentClassName="p-0 border-none"
                className="h-6 w-max gap-0.5 border-none bg-[transparent] px-0"
                textClassName="!text-p2 !text-secondary-foreground"
                iconClassName="!text-secondary-foreground"
                optionClassName="h-8 p-2"
                optionTextClassName="!text-p2"
                align="start"
                alignOffset={-(2 + 1 + 8)}
                maxWidth={100}
                options={periodOptions}
                values={[selectedPeriod]}
                onChange={(id: string) =>
                  onSelectedPeriodChange(id as ChartPeriod)
                }
              />
            ) : (
              <p className="text-p2 text-secondary-foreground">
                {periodOptions[0].name}
              </p>
            )}
          </div>
        </div>

        {/* Total */}
        {total === undefined ? (
          <Skeleton className="h-[36px] w-20" />
        ) : (
          <p className="text-h2 text-foreground">{formatUsd(total)}</p>
        )}
      </div>

      {/* Bottom */}
      <div className={cn("flex w-full flex-col", chartClassName)}>
        {/* Chart */}
        <div className="h-[120px] transform-gpu sm:h-[180px]">
          {processedData === undefined ||
          processedData.every((d) =>
            categories.every((category) => d[category] === 0),
          ) ? (
            <div
              className={cn(
                "flex h-full w-full flex-col justify-center bg-card/50",
                processedData === undefined && "animate-pulse",
              )}
              style={{ paddingTop: 8 + 18 }}
            >
              {processedData !== undefined &&
                processedData.every((d) =>
                  categories.every((category) => d[category] === 0),
                ) && (
                  <div className="flex flex-col items-center gap-2">
                    <NoDataIcon className="h-5 w-5 text-secondary-foreground" />
                    <p className="text-p2 text-secondary-foreground">
                      No data yet
                    </p>
                  </div>
                )}
            </div>
          ) : (
            <>
              {chartType === ChartType.BAR ? (
                <div
                  className={cn(
                    "relative h-full",
                    isFullWidth
                      ? "-mx-[2px] sm:-mx-[4px]"
                      : "-mx-[1px] sm:-mx-[2px]",
                  )}
                >
                  <Recharts.ResponsiveContainer className="absolute inset-0 z-[2]">
                    <Recharts.BarChart
                      data={processedData}
                      margin={{
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                      }}
                      barCategoryGap={0}
                    >
                      <Recharts.Bar
                        dataKey={categories[0]}
                        isAnimationActive={false}
                        fill="transparent"
                        activeBar={<ActiveBar />}
                      />
                      <Recharts.Tooltip
                        isAnimationActive={false}
                        cursor={{
                          fill: "transparent",
                        }}
                        trigger="hover"
                        wrapperStyle={{
                          transform: undefined,
                          position: undefined,
                          top: undefined,
                          left: undefined,
                        }}
                        content={({ active, payload, viewBox, coordinate }) => {
                          if (
                            !active ||
                            !payload?.[0]?.payload ||
                            !viewBox ||
                            coordinate?.x === undefined
                          )
                            return null;

                          return (
                            <TooltipContent
                              valueFormatter={valueFormatter}
                              category={categories[0]}
                              d={payload[0].payload as ChartData}
                              viewBox={viewBox as ViewBox}
                              x={coordinate.x}
                            />
                          );
                        }}
                      />
                    </Recharts.BarChart>
                  </Recharts.ResponsiveContainer>

                  <div className="relative z-[1] flex h-full transform-gpu flex-row items-stretch">
                    {processedData.map((d) => (
                      <div
                        key={d.timestampS}
                        className={cn(
                          "group flex flex-1 flex-row justify-center",
                          isFullWidth
                            ? "px-[2px] sm:px-[4px]"
                            : "px-[1px] sm:px-[2px]",
                        )}
                      >
                        <div className="flex h-full w-full max-w-[36px] flex-col-reverse items-center gap-[2px]">
                          <div
                            className="w-full shrink-0 rounded-[2px]"
                            style={{
                              backgroundColor:
                                maxY > 0 && d[categories[0]] > 0
                                  ? "hsl(var(--jordy-blue))"
                                  : "hsla(var(--jordy-blue) / 25%)",
                              height: `max(2px, calc((100% - ${(categories.length - 1) * 2}px) * ${maxY === 0 ? 0 : d[categories[0]] / maxY}))`,
                            }}
                          />
                          <div className="w-px flex-1 bg-border opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Recharts.ResponsiveContainer width="100%" height="100%">
                  <Recharts.ComposedChart
                    data={processedData}
                    margin={{
                      top: 0,
                      right: 0,
                      bottom: 1,
                      left: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id={gradientId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="hsl(var(--jordy-blue))"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="hsl(var(--jordy-blue))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Recharts.Area
                      dataKey={`${categories[0]}_scaled`}
                      stackId="1"
                      isAnimationActive={false}
                      fill={`url(#${gradientId})`}
                      fillOpacity={1}
                      stroke="hsl(var(--jordy-blue))"
                      strokeWidth={2}
                    />
                    <Recharts.Tooltip
                      isAnimationActive={false}
                      cursor={{
                        stroke: "hsl(var(--foreground))",
                        strokeWidth: 1,
                      }}
                      trigger="hover"
                      wrapperStyle={{
                        transform: undefined,
                        position: undefined,
                        top: undefined,
                        left: undefined,
                      }}
                      content={({ active, payload, viewBox, coordinate }) => {
                        if (
                          !active ||
                          !payload?.[0]?.payload ||
                          !viewBox ||
                          coordinate?.x === undefined
                        )
                          return null;

                        return (
                          <TooltipContent
                            valueFormatter={valueFormatter}
                            category={categories[0]}
                            d={payload[0].payload as ChartData}
                            viewBox={viewBox as ViewBox}
                            x={coordinate.x}
                          />
                        );
                      }}
                    />
                  </Recharts.ComposedChart>
                </Recharts.ResponsiveContainer>
              )}
            </>
          )}
        </div>

        {/* X-axis */}
        {processedData === undefined ||
        processedData.every((d) =>
          categories.every((category) => d[category] === 0),
        ) ? (
          <div
            className={cn(
              "w-full bg-card/50",
              processedData === undefined && "animate-pulse",
            )}
            style={{ height: 8 + 18 }}
          />
        ) : (
          <div
            className={cn(
              "flex flex-row",
              chartType === ChartType.BAR
                ? cn(
                    isFullWidth
                      ? "-mx-[2px] sm:-mx-[4px]"
                      : "-mx-[1px] sm:-mx-[2px]",
                  )
                : "w-full",
            )}
            style={{ paddingTop: 8, height: 8 + 18 }}
          >
            {timestampsS.map((timestampS, index) => (
              <div
                key={timestampS}
                className={cn(
                  "relative flex h-full flex-1 flex-row justify-center opacity-0",
                  index %
                    Math.ceil(
                      timestampsS.length /
                        (selectedPeriod === ChartPeriod.ONE_DAY
                          ? isFullWidth || md
                            ? 6
                            : 4
                          : isFullWidth || md
                            ? 8
                            : 6),
                    ) ===
                    0 && "opacity-100",
                )}
              >
                <p className="absolute inset-y-0 left-1/2 w-[80px] -translate-x-1/2 text-center text-p3 text-tertiary-foreground">
                  {formatDate(
                    new Date(timestampS * 1000),
                    selectedPeriod === ChartPeriod.ONE_DAY ? "HH:mm" : "dd",
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
