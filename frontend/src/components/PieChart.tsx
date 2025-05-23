import { useMemo } from "react";

import BigNumber from "bignumber.js";
import * as Recharts from "recharts";

import { formatPercent } from "@suilend/frontend-sui";

import { Skeleton } from "@/components/ui/skeleton";

interface TooltipContentProps {
  value: number;
  coordinate: { x: number; y: number };
}

function TooltipContent({ value, coordinate }: TooltipContentProps) {
  return (
    // Subset of TooltipContent className
    <div
      className="absolute flex h-0 w-0 flex-row items-center justify-center"
      style={{
        top: coordinate.y - 0 / 2,
        left: coordinate.x - 0 / 2,
      }}
    >
      <p
        className="text-[10px] text-foreground"
        style={{
          textShadow: [
            "1.41421px 0px 0 hsla(var(--background) / 25%)",
            "1px -1px 0 hsla(var(--background) / 25%)",
            "0px -1.41422px 0 hsla(var(--background) / 25%)",
            "-1px -1px 0 hsla(var(--background) / 25%)",
            "-1.41422px 0 0 hsla(var(--background) / 25%)",
            "-1px 1px 0 hsla(var(--background) / 25%)",
            "0 1.41421px 0 hsla(var(--background) / 25%)",
            "1px 1px 0 hsla(var(--background) / 25%)",
          ].join(", "),
        }}
      >
        {formatPercent(new BigNumber(value), { dp: 1 })}
      </p>
    </div>
  );
}

interface PieChartProps {
  data: { label: string; value: number }[];
  size: number;
}

export default function PieChart({ data, size }: PieChartProps) {
  const strokeWidth = 1;

  const processedData = useMemo(() => {
    if (data === undefined) return undefined;

    const total = data.reduce((acc, d) => acc + d.value, 0);
    return data.map((d) => ({ label: "", value: (d.value / total) * 100 }));
  }, [data]);

  return (
    <div className="transform-gpu" style={{ width: size, height: size }}>
      {processedData === undefined ? (
        <Skeleton className="h-full w-full" />
      ) : (
        <Recharts.ResponsiveContainer className="absolute inset-0 z-[2]">
          <Recharts.PieChart
            margin={{
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          >
            <Recharts.Pie
              isAnimationActive={false}
              data={processedData}
              dataKey="value"
              nameKey="label"
              outerRadius={(size - 2 * (strokeWidth / 2)) / 2}
              legendType="none"
              stroke="hsl(var(--background))"
              strokeWidth={strokeWidth}
            >
              <Recharts.Cell fill="hsl(var(--jordy-blue))" />
              <Recharts.Cell fill="hsla(var(--jordy-blue) / 50%)" />
            </Recharts.Pie>
            <Recharts.Tooltip
              isAnimationActive={false}
              trigger="hover"
              wrapperStyle={{
                transform: undefined,
                position: undefined,
                top: undefined,
                left: undefined,
              }}
              content={({ active, payload, coordinate }) => {
                if (
                  !active ||
                  !payload?.[0]?.value ||
                  coordinate?.x === undefined ||
                  coordinate?.y === undefined
                )
                  return null;

                return (
                  <TooltipContent
                    value={payload?.[0]?.value as number}
                    coordinate={coordinate as { x: number; y: number }}
                  />
                );
              }}
            />
          </Recharts.PieChart>
        </Recharts.ResponsiveContainer>
      )}
    </div>
  );
}
