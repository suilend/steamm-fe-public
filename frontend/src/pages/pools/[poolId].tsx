import Head from "next/head";
import Link from "next/link";
import { PropsWithChildren, useMemo, useState } from "react";

import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";
import { ChevronRight } from "lucide-react";

import {
  formatAddress,
  formatPercent,
  formatToken,
  formatUsd,
  getToken,
} from "@suilend/frontend-sui";
import { useSettingsContext } from "@suilend/frontend-sui-next";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import HistoricalDataChart from "@/components/HistoricalDataChart";
import OpenOnExplorerButton from "@/components/OpenOnExplorerButton";
import PercentChange from "@/components/PercentChange";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { PoolContextProvider, usePoolContext } from "@/contexts/PoolContext";
import { ChartData, ChartType } from "@/lib/chart";
import { POOLS_URL } from "@/lib/navigation";
import { poolTypeNameMap } from "@/lib/types";
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
  value: string;
  chartType: ChartType;
  percentChange: BigNumber;
  data: ChartData[];
  formatValue: (value: number) => string;
};

interface PoolStatProps extends PropsWithChildren {
  className?: ClassValue;
  label?: string;
}

function PoolStat({ className, label, children }: PoolStatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <p className="text-p2 text-secondary-foreground">{label}</p>}
      {children}
    </div>
  );
}

function PoolPage() {
  const { explorer } = useSettingsContext();
  const { appData } = useLoadedAppContext();
  const { pool } = usePoolContext();

  // CoinMetadata
  const hasCoinMetadata = true;

  // Pair
  const formattedPair = hasCoinMetadata
    ? pool.coinTypes
        .map((coinType) => appData.poolCoinMetadataMap[coinType].symbol)
        .join("/")
    : undefined;

  // Chart
  const historicalTvlData = useMemo(() => {
    const result: ChartData[] = [];
    for (let i = 0; i < 30; i++) {
      result.push({
        timestampS: 1739253600 + 24 * i * 60 * 60,
        valueUsd: 1000 * Math.random(),
      });
    }

    return result;
  }, []);

  const historicalVolumeData = useMemo(() => {
    const result: ChartData[] = [];
    for (let i = 0; i < 30; i++) {
      result.push({
        timestampS: 1739253600 + 24 * i * 60 * 60,
        valueUsd: 1000 * Math.random(),
      });
    }

    return result;
  }, []);

  const historicalFeesData = useMemo(() => {
    const result: ChartData[] = [];
    for (let i = 0; i < 30; i++) {
      result.push({
        timestampS: 1739253600 + 24 * i * 60 * 60,
        valueUsd: 100 * Math.random(),
      });
    }

    return result;
  }, []);

  const historicalAprData = useMemo(() => {
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
        value: formatUsd(pool.tvlUsd),
        chartType: ChartType.LINE,
        percentChange: new BigNumber(-5 + Math.random() * 10),
        data: historicalTvlData,
        formatValue: (value) => formatUsd(new BigNumber(value)),
      },
      [ChartStat.VOLUME]: {
        title: chartStatNameMap[ChartStat.VOLUME],
        value: formatUsd(pool.volumeUsd),
        chartType: ChartType.BAR,
        percentChange: new BigNumber(-5 + Math.random() * 10),
        data: historicalVolumeData,
        formatValue: (value) => formatUsd(new BigNumber(value)),
      },
      [ChartStat.FEES]: {
        title: chartStatNameMap[ChartStat.FEES],
        value: formatUsd(pool.feesUsd),
        chartType: ChartType.BAR,
        percentChange: new BigNumber(-5 + Math.random() * 10),
        data: historicalFeesData,
        formatValue: (value) => formatUsd(new BigNumber(value)),
      },
      [ChartStat.APR]: {
        title: chartStatNameMap[ChartStat.APR],
        value: formatPercent(pool.apr.percent),
        chartType: ChartType.LINE,
        percentChange: new BigNumber(-5 + Math.random() * 10),
        data: historicalAprData,
        formatValue: (value) => formatPercent(new BigNumber(value)),
      },
    }),
    [
      pool.tvlUsd,
      historicalTvlData,
      pool.volumeUsd,
      historicalVolumeData,
      pool.feesUsd,
      historicalFeesData,
      pool.apr.percent,
      historicalAprData,
    ],
  );

  const [selectedChartStat, setSelectedChartStat] = useState<ChartStat>(
    ChartStat.TVL,
  );
  const chartConfig = useMemo(
    () => chartConfigMap[selectedChartStat],
    [chartConfigMap, selectedChartStat],
  );

  return (
    <>
      {formattedPair && (
        <Head>
          <title>STEAMM | {formattedPair}</title>
        </Head>
      )}

      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full flex-row items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex flex-row items-center gap-2">
            <Link className="group" href={POOLS_URL}>
              <p className="text-p2 text-tertiary-foreground transition-colors group-hover:text-foreground">
                Pools
              </p>
            </Link>

            <ChevronRight className="h-4 w-4 text-tertiary-foreground" />
            {!formattedPair ? (
              <Skeleton className="h-[21px] w-20" />
            ) : (
              <p className="text-p2 text-foreground">{formattedPair}</p>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-6">
          {/* Top */}
          <div className="flex w-full flex-col max-lg:gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Title */}
            <div className="flex flex-row items-center gap-3">
              <div
                className={cn(
                  "flex flex-row",
                  !hasCoinMetadata && "animate-pulse",
                )}
              >
                {pool.coinTypes.map((coinType, index) => (
                  <TokenLogo
                    key={coinType}
                    className={cn(
                      index !== 0 &&
                        "-ml-2 outline outline-1 outline-background",
                      !hasCoinMetadata ? "animate-none" : "bg-background",
                    )}
                    token={
                      hasCoinMetadata
                        ? getToken(
                            coinType,
                            appData.poolCoinMetadataMap[coinType],
                          )
                        : undefined
                    }
                    size={32}
                  />
                ))}
              </div>

              {!formattedPair ? (
                <Skeleton className="h-[36px] w-32" />
              ) : (
                <h1 className="text-h2 text-foreground">{formattedPair}</h1>
              )}

              {pool.type && <Tag>{poolTypeNameMap[pool.type]}</Tag>}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 md:flex md:flex-row md:gap-12">
              <div className="flex flex-col gap-1">
                <p className="text-p2 text-secondary-foreground">TVL</p>

                <div className="flex flex-row items-baseline gap-1.5">
                  <Tooltip title={formatUsd(pool.tvlUsd, { exact: true })}>
                    <p className="text-p1 text-foreground">
                      {formatUsd(pool.tvlUsd)}
                    </p>
                  </Tooltip>
                  <PercentChange
                    value={new BigNumber(-5 + Math.random() * 10)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-p2 text-secondary-foreground">
                  Volume (24H)
                </p>

                <div className="flex flex-row items-baseline gap-1.5">
                  <Tooltip title={formatUsd(pool.volumeUsd, { exact: true })}>
                    <p className="text-p1 text-foreground">
                      {formatUsd(pool.volumeUsd)}
                    </p>
                  </Tooltip>
                  <PercentChange
                    value={new BigNumber(-5 + Math.random() * 10)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-p2 text-secondary-foreground">Fees (24H)</p>

                <div className="flex flex-row items-baseline gap-1.5">
                  <Tooltip title={formatUsd(pool.feesUsd, { exact: true })}>
                    <p className="text-p1 text-foreground">
                      {formatUsd(pool.feesUsd)}
                    </p>
                  </Tooltip>
                  <PercentChange
                    value={new BigNumber(-5 + Math.random() * 10)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-p2 text-secondary-foreground">APR (24H)</p>

                <div className="flex flex-row items-baseline gap-1.5">
                  <p className="text-p1 text-foreground">
                    {formatPercent(pool.apr.percent)}
                  </p>
                  <PercentChange
                    value={new BigNumber(-5 + Math.random() * 10)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-1 md:flex-row">
            {/* Left */}
            <div className="flex flex-col gap-1 max-md:w-full md:flex-1">
              <div className="relative w-full rounded-md border p-5">
                {/* Chart */}
                <HistoricalDataChart
                  className="relative z-[1]"
                  title={chartConfig.title}
                  value={chartConfig.value}
                  chartType={chartConfig.chartType}
                  periodDays={30}
                  periodChangePercent={chartConfig.percentChange}
                  data={chartConfig.data}
                  formatCategory={(category) => category}
                  formatValue={chartConfig.formatValue}
                />

                <div className="absolute right-5 top-5 z-[2] flex flex-row items-center gap-1">
                  {Object.values(ChartStat).map((chartStat) => (
                    <button
                      key={chartStat}
                      className={cn(
                        "group flex h-6 flex-row items-center rounded-md border px-2 transition-colors",
                        selectedChartStat === chartStat
                          ? "cursor-default bg-border"
                          : "hover:bg-border",
                      )}
                      onClick={() => setSelectedChartStat(chartStat)}
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

              {/* Parameters */}
              <div className="grid w-full grid-cols-1 gap-x-6 gap-y-6 rounded-md border p-5 lg:grid-cols-2">
                <PoolStat label="Composition">
                  <div className="flex w-full flex-col gap-2">
                    {/* Top */}
                    <div className="flex w-full flex-row justify-between">
                      {/* Left */}
                      <div className="flex flex-row items-center gap-2">
                        <TokenLogo
                          className={cn(
                            !hasCoinMetadata ? "animate-none" : "bg-background",
                          )}
                          token={
                            hasCoinMetadata
                              ? getToken(
                                  pool.coinTypes[0],
                                  appData.poolCoinMetadataMap[
                                    pool.coinTypes[0]
                                  ],
                                )
                              : undefined
                          }
                          size={16}
                        />

                        {!hasCoinMetadata ? (
                          <Skeleton className="h-[21px] w-10" />
                        ) : (
                          <p className="text-p2 text-foreground">
                            {
                              appData.poolCoinMetadataMap[pool.coinTypes[0]]
                                .symbol
                            }
                          </p>
                        )}

                        <div className="flex flex-row items-center gap-1">
                          <CopyToClipboardButton value={pool.coinTypes[0]} />
                          <OpenOnExplorerButton
                            url={explorer.buildCoinUrl(pool.coinTypes[0])}
                          />
                        </div>
                      </div>

                      <div className="flex flex-row items-center gap-1.5">
                        <p className="text-p2 text-foreground">
                          {formatToken(pool.balances[0], { exact: false })}
                        </p>

                        <p className="text-p3 text-tertiary-foreground">
                          (
                          {formatPercent(
                            pool.balances[0]
                              .times(pool.prices[0])
                              .div(pool.tvlUsd)
                              .times(100),
                          )}
                          )
                        </p>
                      </div>
                    </div>

                    {/* Bottom */}
                    <div className="flex h-1 w-full flex-row overflow-hidden rounded-[2px]">
                      <div
                        className="h-full bg-jordy-blue"
                        style={{
                          width: `${pool.balances[0]
                            .times(pool.prices[0])
                            .div(pool.tvlUsd)
                            .times(100)}%`,
                        }}
                      />
                      <div className="h-full flex-1 bg-border" />
                    </div>
                  </div>
                </PoolStat>
                <PoolStat className="max-md:-mt-2 md:self-end">
                  <div className="flex w-full flex-col gap-2">
                    {/* Top */}
                    <div className="flex w-full flex-row justify-between">
                      {/* Left */}
                      <div className="flex flex-row items-center gap-2">
                        <TokenLogo
                          className={cn(
                            !hasCoinMetadata ? "animate-none" : "bg-background",
                          )}
                          token={
                            hasCoinMetadata
                              ? getToken(
                                  pool.coinTypes[1],
                                  appData.poolCoinMetadataMap[
                                    pool.coinTypes[1]
                                  ],
                                )
                              : undefined
                          }
                          size={16}
                        />

                        {!hasCoinMetadata ? (
                          <Skeleton className="h-[21px] w-10" />
                        ) : (
                          <p className="text-p2 text-foreground">
                            {
                              appData.poolCoinMetadataMap[pool.coinTypes[1]]
                                .symbol
                            }
                          </p>
                        )}

                        <div className="flex flex-row items-center gap-1">
                          <CopyToClipboardButton value={pool.coinTypes[1]} />
                          <OpenOnExplorerButton
                            url={explorer.buildCoinUrl(pool.coinTypes[1])}
                          />
                        </div>
                      </div>

                      <div className="flex flex-row items-center gap-1.5">
                        <p className="text-p2 text-foreground">
                          {formatToken(pool.balances[1], { exact: false })}
                        </p>

                        <p className="text-p3 text-tertiary-foreground">
                          (
                          {formatPercent(
                            pool.balances[1]
                              .times(pool.prices[1])
                              .div(pool.tvlUsd)
                              .times(100),
                          )}
                          )
                        </p>
                      </div>
                    </div>

                    {/* Bottom */}
                    <div className="flex h-1 w-full flex-row overflow-hidden rounded-[2px]">
                      <div
                        className="h-full bg-jordy-blue"
                        style={{
                          width: `${pool.balances[1]
                            .times(pool.prices[1])
                            .div(pool.tvlUsd)
                            .times(100)}%`,
                        }}
                      />
                      <div className="h-full flex-1 bg-border" />
                    </div>
                  </div>
                </PoolStat>

                <PoolStat label="Pool address">
                  <div className="flex flex-row items-center gap-2">
                    <Tooltip title={pool.id}>
                      <p className="text-p2 text-foreground">
                        {formatAddress(pool.id)}
                      </p>
                    </Tooltip>

                    <div className="flex flex-row items-center gap-1">
                      <CopyToClipboardButton value={pool.id} />
                      <OpenOnExplorerButton
                        url={explorer.buildObjectUrl(pool.id)}
                      />
                    </div>
                  </div>
                </PoolStat>

                <PoolStat label="Current price">
                  {!hasCoinMetadata ? (
                    <Skeleton className="h-[21px] w-20" />
                  ) : (
                    <p className="text-p2 text-foreground">
                      1 {appData.poolCoinMetadataMap[pool.coinTypes[0]].symbol}
                      {" ≈ "}
                      {formatToken(pool.balances[1].div(pool.balances[0]), {
                        dp: appData.poolCoinMetadataMap[pool.coinTypes[1]]
                          .decimals,
                      })}{" "}
                      {appData.poolCoinMetadataMap[pool.coinTypes[1]].symbol}
                    </p>
                  )}
                </PoolStat>

                <PoolStat label="Fee tier">
                  <p className="text-p2 text-foreground">
                    {formatPercent(pool.feeTierPercent)}
                  </p>
                </PoolStat>

                <PoolStat label="Protocol fee">
                  <p className="text-p2 text-foreground">
                    {formatPercent(pool.protocolFeePercent, {
                      dp:
                        Math.max(
                          0,
                          -Math.floor(Math.log10(+pool.protocolFeePercent)) - 1,
                        ) + 1,
                    })}
                  </p>
                </PoolStat>

                <PoolStat label="Creator address">
                  <div className="flex flex-row items-center gap-2">
                    <Tooltip title={pool.creatorAddress}>
                      <p className="text-p2 text-foreground">
                        {pool.creatorAddress
                          ? formatAddress(pool.creatorAddress)
                          : "--"}
                      </p>
                    </Tooltip>

                    {pool.creatorAddress && (
                      <div className="flex flex-row items-center gap-1">
                        <CopyToClipboardButton value={pool.creatorAddress} />
                        <OpenOnExplorerButton
                          url={explorer.buildAddressUrl(pool.creatorAddress)}
                        />
                      </div>
                    )}
                  </div>
                </PoolStat>
              </div>
            </div>

            {/* Right */}
            <div className="max-md:w-full md:flex-1">
              {/* Actions */}
              <div className="flex w-full flex-col gap-4 rounded-md border p-5">
                <div className="flex w-full flex-row items-center justify-between">
                  <div className="flex flex-row gap-1">
                    <Link
                      className={cn(
                        "group flex h-10 flex-row items-center rounded-md border px-3",
                        "bg-border",
                      )}
                      href=""
                    >
                      <p
                        className={cn(
                          "text-secondary-foreground transition-colors group-hover:text-foreground",
                          "text-foreground",
                        )}
                      >
                        Deposit
                      </p>
                    </Link>
                    <Link
                      className={cn(
                        "group flex h-10 flex-row items-center rounded-md border px-3",
                        "transition-colors hover:bg-border",
                      )}
                      href=""
                    >
                      <p
                        className={cn(
                          "text-secondary-foreground transition-colors group-hover:text-foreground",
                        )}
                      >
                        Withdraw
                      </p>
                    </Link>
                    <Link
                      className={cn(
                        "group flex h-10 flex-row items-center rounded-md border px-3",
                        "transition-colors hover:bg-border",
                      )}
                      href=""
                    >
                      <p
                        className={cn(
                          "text-secondary-foreground transition-colors group-hover:text-foreground",
                        )}
                      >
                        Swap
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <PoolContextProvider>
      <PoolPage />
    </PoolContextProvider>
  );
}
