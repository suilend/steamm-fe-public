import { useMemo } from "react";

import BigNumber from "bignumber.js";
import { format } from "date-fns";
import { capitalize } from "lodash";

import { formatUsd } from "@suilend/frontend-sui";

import PercentChange from "@/components/PercentChange";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";

export type BarChartData = {
  timestampS: number;
  [coinType: string]: number;
};

const OTHER = "other";

interface BarChartStatProps {
  title: string;
  valueUsd: BigNumber;
  periodDays: 1 | 7 | 30;
  periodChangePercent: BigNumber;
  data: BarChartData[];
}

export default function BarChartStat({
  title,
  valueUsd,
  periodDays,
  periodChangePercent,
  data,
}: BarChartStatProps) {
  const { coinMetadataMap } = useLoadedAppContext();

  // Data
  const processedData: BarChartData[] = useMemo(() => {
    const coinTypes =
      data.length > 0
        ? Object.keys(data[0]).filter((key) => key !== "timestampS")
        : [];

    if (coinTypes.length > 5) {
      const coinTypeTotalsMap: Record<string, number> = coinTypes.reduce(
        (acc, coinType) => ({
          ...acc,
          [coinType]: data.reduce((acc2, d) => acc2 + d[coinType], 0),
        }),
        {},
      );

      const sortedCoinTypes = coinTypes
        .slice()
        .sort((a, b) => coinTypeTotalsMap[b] - coinTypeTotalsMap[a]);
      const topCoinTypes = sortedCoinTypes.slice(0, 4);
      const otherCoinTypes = sortedCoinTypes.slice(4);

      return data.map((d) => ({
        timestampS: d.timestampS,
        ...[...topCoinTypes, OTHER].reduce(
          (acc, category) => ({
            ...acc,
            [category]:
              category !== OTHER
                ? d[category]
                : otherCoinTypes.reduce(
                    (acc2, otherCoinType) => acc2 + d[otherCoinType],
                    0,
                  ),
          }),
          {},
        ),
      }));
    } else {
      return data.map((d) => ({
        timestampS: d.timestampS,
        ...coinTypes.reduce(
          (acc, category) => ({ ...acc, [category]: d[category] }),
          {},
        ),
      }));
    }
  }, [data]);

  const timestampsS = processedData.map((d) => d.timestampS).flat();
  const categories =
    processedData.length > 0
      ? Object.keys(processedData[0]).filter((key) => key !== "timestampS")
      : [];

  const processedDataWithTotals: (BarChartData & { total: number })[] =
    processedData.map((d) => ({
      ...d,
      total: categories.reduce((acc, category) => acc + d[category], 0),
    }));

  const categoryTotalsMap: Record<string, number> = categories.reduce(
    (acc, category) => ({
      ...acc,
      [category]: processedData.reduce((acc2, d) => acc2 + d[category], 0),
    }),
    {},
  );
  const sortedCategories = categories.slice().sort((a, b) => {
    if (a === OTHER) return 1;
    return categoryTotalsMap[b] - categoryTotalsMap[a];
  });

  // Min/max
  const minX = Math.min(...timestampsS);
  const maxX = Math.max(...timestampsS);

  const minY = 0;
  const maxY = Math.max(...processedDataWithTotals.map((d) => d.total));

  // Ticks
  const ticksX = Array.from({ length: 5 }).map((_, index, array) =>
    Math.round(minX + ((maxX - minX) / (array.length - 1)) * index),
  );

  return (
    <div className="flex w-full flex-col">
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
        {data !== undefined && (
          <div className="flex flex-row flex-wrap justify-end gap-x-3 gap-y-1">
            {sortedCategories.map((category, categoryIndex) => (
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
                {category !== OTHER ? (
                  !coinMetadataMap?.[category] ? (
                    <Skeleton className="h-[18px] w-10" />
                  ) : (
                    <p className="text-p3 text-secondary-foreground">
                      {coinMetadataMap[category].symbol}
                    </p>
                  )
                ) : (
                  <p className="text-p3 text-secondary-foreground">
                    {capitalize(category)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="flex w-full flex-col gap-3">
        {/* Chart */}
        <div className="-mx-[2px] flex h-[calc(120px+24px)] transform-gpu flex-row items-stretch md:-mx-[3px] md:h-[calc(150px+24px)]">
          {processedData.map((d) => (
            <div key={d.timestampS} className="flex-1">
              <Tooltip
                rootProps={{
                  delayDuration: 0,
                  disableHoverableContent: true,
                }}
                content={
                  <div className="flex flex-col-reverse gap-1">
                    {sortedCategories.map((category, categoryIndex) => (
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
                        {category !== OTHER ? (
                          !coinMetadataMap?.[category] ? (
                            <Skeleton className="h-[18px] w-10" />
                          ) : (
                            <p className="text-p3 text-secondary-foreground">
                              {coinMetadataMap[category].symbol}
                            </p>
                          )
                        ) : (
                          <p className="text-p3 text-secondary-foreground">
                            {capitalize(category)}
                          </p>
                        )}

                        <p className="text-p3 text-foreground">
                          {formatUsd(new BigNumber(d[category]))}
                        </p>
                      </div>
                    ))}
                  </div>
                }
              >
                <div className="group flex h-full w-full flex-col-reverse items-center gap-[2px] px-[2px] md:px-[3px]">
                  {sortedCategories.map((category, categoryIndex) => (
                    <div
                      key={category}
                      className="w-full shrink-0 rounded-[2px]"
                      style={{
                        backgroundColor: `hsl(var(--a${sortedCategories.length - categoryIndex}))`,
                        height: `calc((100% - 24px - ${(sortedCategories.length - 1) * 2}px) * ${d[category] / maxY})`,
                      }}
                    />
                  ))}
                  <div className="w-px flex-1 bg-border opacity-0 group-hover:opacity-100" />
                </div>
              </Tooltip>
            </div>
          ))}
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
