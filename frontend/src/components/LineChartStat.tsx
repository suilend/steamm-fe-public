import { useRef } from "react";

import BigNumber from "bignumber.js";
import { format } from "date-fns";
import * as Recharts from "recharts";
import { v4 as uuidv4 } from "uuid";

import { formatUsd } from "@suilend/frontend-sui";

import PercentChange from "@/components/PercentChange";
import { ViewBox, getTooltipStyle } from "@/lib/chart";

export type LineChartData = {
  timestampS: number;
  valueUsd: number;
};

interface TooltipContentProps {
  periodDays: 1 | 7 | 30;
  d: LineChartData;
  viewBox: ViewBox;
  x: number;
}

function TooltipContent({ periodDays, d, viewBox, x }: TooltipContentProps) {
  return (
    // Subset of TooltipContent className
    <div
      className="absolute rounded-md border bg-tooltip px-3 py-1.5"
      style={getTooltipStyle(120, viewBox, x)}
    >
      <div className="flex w-full flex-col gap-1">
        <p className="text-p3 text-secondary-foreground">
          {format(
            new Date(d.timestampS * 1000),
            periodDays === 1 ? "h:mm a" : "d MMM h:mm a",
          )}
        </p>
        <p className="text-p3 text-foreground">
          {formatUsd(new BigNumber(d.valueUsd))}
        </p>
      </div>
    </div>
  );
}

interface LineChartStatProps {
  title: string;
  valueUsd: BigNumber;
  periodDays: 1 | 7 | 30;
  periodChangePercent: BigNumber;
  data: LineChartData[];
}

export default function LineChartStat({
  title,
  valueUsd,
  periodDays,
  periodChangePercent,
  data,
}: LineChartStatProps) {
  const gradientId = useRef<string>(uuidv4()).current;

  // Data
  const timestampsS = data.map((d) => d.timestampS).flat();
  const valuesUsd = data.map((d) => d.valueUsd).flat();

  // Min/max
  const minX = Math.min(...timestampsS);
  const maxX = Math.max(...timestampsS);

  const minY = Math.min(...valuesUsd);
  const maxY = Math.max(...valuesUsd);

  // Ticks
  const ticksX = Array.from({ length: 5 }).map((_, index, array) =>
    Math.round(minX + ((maxX - minX) / (array.length - 1)) * index),
  );

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Top */}
      <div className="flex flex-row items-start justify-between">
        {/* Top left */}
        <div className="flex flex-col gap-1">
          <p className="text-p2 text-secondary-foreground">{title}</p>

          <div className="flex flex-row items-baseline gap-2">
            <p className="text-h2 text-foreground">
              {formatUsd(new BigNumber(valueUsd))}
            </p>
            <PercentChange value={periodChangePercent} />
          </div>
        </div>

        {/* Top right */}
      </div>

      {/* Bottom */}
      <div className="flex w-full flex-col gap-3">
        {/* Chart */}
        <div className="-mx-[2px] flex h-[120px] transform-gpu flex-row items-stretch md:-mx-[3px] md:h-[150px]">
          <Recharts.ResponsiveContainer width="100%" height="100%">
            <Recharts.ComposedChart
              data={data}
              margin={{
                top: 2,
                right: 2,
                bottom: 2,
                left: 2,
              }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--foreground))"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--foreground))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Recharts.Line
                type="monotone"
                dataKey="valueUsd"
                isAnimationActive={false}
                stroke="hsl(var(--foreground))"
                dot={false}
                strokeWidth={2}
              />
              <Recharts.Area
                type="monotone"
                dataKey="valueUsd"
                isAnimationActive={false}
                fill={`url(#${gradientId})`}
                dot={false}
                strokeWidth={0}
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
                      periodDays={periodDays}
                      d={payload[0].payload as LineChartData}
                      viewBox={viewBox as ViewBox}
                      x={coordinate.x}
                    />
                  );
                }}
              />
            </Recharts.ComposedChart>
          </Recharts.ResponsiveContainer>
        </div>

        {/* X-axis */}
        <div className="flex w-full flex-row justify-between">
          {ticksX.map((tickX) => (
            <p key={tickX} className="text-p3 text-tertiary-foreground">
              {format(
                new Date(tickX * 1000),
                periodDays === 1 ? "h:mm a" : "d MMM",
              )}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
