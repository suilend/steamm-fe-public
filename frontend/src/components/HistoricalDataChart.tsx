import { useMemo, useRef } from "react";

import { ClassValue } from "clsx";
import { formatDate } from "date-fns";
import * as Recharts from "recharts";
import { v4 as uuidv4 } from "uuid";

import NoDataIcon from "@/components/icons/NoDataIcon";
import { Skeleton } from "@/components/ui/skeleton";
import useBreakpoint from "@/hooks/useBreakpoint";
import {
  ChartConfig,
  ChartData,
  ChartType,
  OTHER_CATEGORY,
  ViewBox,
  getTooltipStyle,
} from "@/lib/chart";
import { cn } from "@/lib/utils";

const TOTAL = "total";
const MAX_CATEGORIES = 5;

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
  dataPeriodDays: ChartConfig["dataPeriodDays"];
  formatValue: (value: number) => string;
  formatCategory: (category: string) => string | undefined;
  sortedCategories: string[];
  d: ChartData;
  viewBox: ViewBox;
  x: number;
}

function TooltipContent({
  dataPeriodDays,
  formatValue,
  formatCategory,
  sortedCategories,
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
          {formatDate(
            new Date(d.timestampS * 1000),
            dataPeriodDays === 1 ? "H:mm" : "d MMM H:mm",
          )}
        </p>
        {sortedCategories.map((category, categoryIndex) => {
          const formattedCategory = formatCategory(category);

          return (
            <div key={category} className="flex flex-row items-center gap-1.5">
              {sortedCategories.length > 1 && (
                <>
                  <div
                    className="h-3 w-3 rounded-[2px]"
                    style={{
                      backgroundColor: `hsl(var(--a${sortedCategories.length - categoryIndex}))`,
                    }}
                  />

                  {formattedCategory === undefined ? (
                    <Skeleton className="h-[18px] w-10" />
                  ) : (
                    <p className="text-p2 text-secondary-foreground">
                      {formattedCategory}
                    </p>
                  )}
                </>
              )}

              <p className="text-p2 text-foreground">
                {formatValue(d[category])}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface HistoricalDataChartProps extends ChartConfig {
  className?: ClassValue;
  topLeftClassName?: ClassValue;
  titleContainerClassName?: ClassValue;
  titleClassName?: ClassValue;
  chartClassName?: ClassValue;
  ticksXSm?: number;
  formatCategory: (category: string) => string | undefined;
}

export default function HistoricalDataChart({
  className,
  topLeftClassName,
  titleContainerClassName,
  titleClassName,
  chartClassName,
  title,
  value,
  valuePeriodDays,
  chartType,
  data,
  dataPeriodDays,
  ticksXSm,
  formatValue,
  formatCategory,
}: HistoricalDataChartProps) {
  const { sm, md } = useBreakpoint();

  const gradientId = useRef<string>(uuidv4()).current;

  // Data
  const processedData: ChartData[] | undefined = useMemo(() => {
    if (data === undefined) return undefined;

    const categories =
      data.length > 0
        ? Object.keys(data[0]).filter((key) => key !== "timestampS")
        : [];

    if (categories.length > MAX_CATEGORIES) {
      const categoryTotalsMap: Record<string, number> = categories.reduce(
        (acc, category) => ({
          ...acc,
          [category]: data.reduce((acc2, d) => acc2 + d[category], 0),
        }),
        {},
      );

      const sortedCategories = categories
        .slice()
        .sort((a, b) => categoryTotalsMap[b] - categoryTotalsMap[a]);
      const topCategories = sortedCategories.slice(0, MAX_CATEGORIES - 1);
      const otherCategories = sortedCategories.slice(MAX_CATEGORIES - 1);

      return data.map((d) => ({
        timestampS: d.timestampS,
        ...[...topCategories, OTHER_CATEGORY].reduce(
          (acc, category) => ({
            ...acc,
            [category]:
              category !== OTHER_CATEGORY
                ? d[category]
                : otherCategories.reduce(
                    (acc2, otherCategory) => acc2 + d[otherCategory],
                    0,
                  ),
          }),
          {},
        ),
      }));
    } else {
      const totals = data.map((d) =>
        categories.reduce((acc, category) => acc + d[category], 0),
      );
      const minY = Math.min(...totals);

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
    }
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

  const processedDataWithTotals:
    | (ChartData & { [TOTAL]: number })[]
    | undefined =
    processedData === undefined
      ? undefined
      : processedData.map((d) => ({
          ...d,
          [TOTAL]: categories.reduce((acc, category) => acc + d[category], 0),
        }));

  const categoryTotalsMap: Record<string, number> =
    processedData === undefined
      ? {}
      : categories.reduce(
          (acc, category) => ({
            ...acc,
            [category]: processedData.reduce(
              (acc2, d) => acc2 + d[category],
              0,
            ),
          }),
          {},
        );
  const sortedCategories = categories.slice().sort((a, b) => {
    if (a === OTHER_CATEGORY) return 1; // Always last
    return categoryTotalsMap[b] - categoryTotalsMap[a];
  });

  // Min/max
  const minX = Math.min(...timestampsS);
  const maxX = Math.max(...timestampsS);

  const minY = 0;
  const maxY =
    processedDataWithTotals === undefined
      ? 0
      : Math.max(...processedDataWithTotals.map((d) => d[TOTAL]));

  // Ticks
  const ticksX = Array.from({ length: md ? 5 : sm ? 3 : (ticksXSm ?? 2) }).map(
    (_, index, array) =>
      Math.round(minX + ((maxX - minX) / (array.length - 1)) * index),
  );

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {/* Top */}
      <div className="flex flex-row items-start justify-between">
        {/* Top left */}
        <div className={cn("flex flex-col gap-1", topLeftClassName)}>
          <div
            className={cn(
              "flex flex-row items-baseline gap-1.5",
              titleContainerClassName,
            )}
          >
            <p
              className={cn(
                "!text-p2 text-secondary-foreground",
                titleClassName,
              )}
            >
              {title}
            </p>
            {valuePeriodDays !== undefined && (
              <p className="text-p3 text-tertiary-foreground">
                {valuePeriodDays === 1 ? "24H" : `${valuePeriodDays}D`}
              </p>
            )}
          </div>

          {value === undefined ? (
            <Skeleton className="h-[36px] w-20" />
          ) : (
            <p className="text-h2 text-foreground">{value}</p>
          )}
        </div>

        {/* Top right */}
        {sortedCategories.length > 1 && (
          <div className="flex flex-row flex-wrap justify-end gap-x-3 gap-y-1">
            {sortedCategories.map((category, categoryIndex) => {
              const formattedCategory = formatCategory(category);

              return (
                <div
                  key={category}
                  className="flex flex-row items-center gap-1.5"
                >
                  <div
                    className="h-3 w-3 rounded-[2px]"
                    style={{
                      backgroundColor: `hsl(var(--a${sortedCategories.length - categoryIndex}))`,
                    }}
                  />

                  {formattedCategory === undefined ? (
                    <Skeleton className="h-[18px] w-10" />
                  ) : (
                    <p className="text-p3 text-secondary-foreground">
                      {formattedCategory}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
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
                <div className="relative -mx-[2px] h-full">
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
                        dataKey={sortedCategories[0]}
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
                              dataPeriodDays={dataPeriodDays}
                              formatValue={formatValue}
                              formatCategory={formatCategory}
                              sortedCategories={sortedCategories}
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
                        className="group flex flex-1 flex-row justify-center px-[1px] sm:px-[2px]"
                      >
                        <div className="flex h-full w-full max-w-[8px] flex-col-reverse items-center gap-[2px]">
                          {sortedCategories.map((category, categoryIndex) => (
                            <div
                              key={category}
                              className="w-full shrink-0 rounded-[2px]"
                              style={{
                                backgroundColor:
                                  sortedCategories.length > 1
                                    ? `hsl(var(--a${sortedCategories.length - categoryIndex}))`
                                    : maxY > 0 && d[category] > 0
                                      ? "hsl(var(--jordy-blue))"
                                      : "hsla(var(--jordy-blue) / 25%)",
                                height: `max(2px, calc((100% - ${(sortedCategories.length - 1) * 2}px) * ${maxY === 0 ? 0 : d[category] / maxY}))`,
                              }}
                            />
                          ))}
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
                    {sortedCategories.map((category, categoryIndex) => {
                      const dataKey = `${category}_scaled`;
                      return (
                        <Recharts.Area
                          key={dataKey}
                          dataKey={dataKey}
                          stackId="1"
                          isAnimationActive={false}
                          fill={
                            sortedCategories.length > 1
                              ? `hsl(var(--a${sortedCategories.length - categoryIndex}))`
                              : `url(#${gradientId})`
                          }
                          fillOpacity={1}
                          stroke={
                            sortedCategories.length > 1
                              ? "hsl(var(--background))"
                              : "hsl(var(--jordy-blue))"
                          }
                          strokeWidth={sortedCategories.length > 1 ? 3 : 2}
                        />
                      );
                    })}
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
                            dataPeriodDays={dataPeriodDays}
                            formatValue={formatValue}
                            formatCategory={formatCategory}
                            sortedCategories={sortedCategories}
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
            className="flex w-full flex-row justify-between"
            style={{ paddingTop: 8 }}
          >
            {ticksX.map((tickX) => (
              <p key={tickX} className="text-p3 text-tertiary-foreground">
                {formatDate(
                  new Date(tickX * 1000),
                  dataPeriodDays === 1 ? "H:mm" : "d MMM",
                )}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
