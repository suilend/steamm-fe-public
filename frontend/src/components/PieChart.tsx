import * as Recharts from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PieChartProps {
  data: { label: string; value: number }[];
  size: number;
}

export default function PieChart({ data, size }: PieChartProps) {
  const strokeWidth = 1;

  return (
    <div className="flex flex-row items-center gap-3">
      <div className="transform-gpu" style={{ width: size, height: size }}>
        {data === undefined ? (
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
                data={data}
                dataKey="value"
                nameKey="label"
                outerRadius={(size - 2 * (strokeWidth / 2)) / 2}
                legendType="none"
                stroke="hsl(var(--background))"
                strokeWidth={strokeWidth}
              >
                <Recharts.Cell fill="hsl(var(--a3))" />
                <Recharts.Cell fill="hsl(var(--a4))" />
                <Recharts.Cell fill="hsl(var(--a5))" />
              </Recharts.Pie>
            </Recharts.PieChart>
          </Recharts.ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {data.map(({ label }, index) => (
          <div key={label} className="flex flex-row items-center gap-2">
            <div
              className={cn("h-1.5 w-1.5 rounded-[1px]", {
                "bg-a3": index === 0,
                "bg-a4": index === 1,
                "bg-a5": index === 2,
              })}
            />
            <p className="text-p2 text-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
