import Head from "next/head";
import Link from "next/link";
import { PropsWithChildren, useMemo } from "react";

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
import LineChartStat, { LineChartData } from "@/components/LineChartStat";
import OpenOnExplorerButton from "@/components/OpenOnExplorerButton";
import PercentChange from "@/components/PercentChange";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { PoolContextProvider, usePoolContext } from "@/contexts/PoolContext";
import { POOLS_URL } from "@/lib/navigation";
import { poolTypeNameMap } from "@/lib/types";
import { cn } from "@/lib/utils";

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

function Pool() {
  const { explorer } = useSettingsContext();
  const { coinMetadataMap } = useLoadedAppContext();
  const { pool } = usePoolContext();

  // CoinMetadata
  const coinTypes = useMemo(
    () => [...pool.assetCoinTypes],
    [pool.assetCoinTypes],
  );
  const hasCoinMetadata = coinTypes
    .map((coinType) => coinMetadataMap?.[coinType])
    .every(Boolean);

  // Pair
  const formattedPair = hasCoinMetadata
    ? pool.assetCoinTypes
        .map((coinType) => coinMetadataMap![coinType].symbol)
        .join("/")
    : undefined;

  // Temp
  const volumeData = useMemo(() => {
    const result: LineChartData[] = [];
    for (let i = 0; i < 30; i++) {
      result.push({
        timestampS: 1739253600 + 24 * i * 60 * 60,
        valueUsd: 100 + Math.random() * 100,
      });
    }

    return result;
  }, []);

  const poolAddress =
    "0x2e868e44010e06c0fc925d29f35029b6ef75a50e03d997585980fb2acea45ec6";
  const creatorAddress =
    "0x6191f9a47c411cc169ee4b0292f08531e4d442d4cb9ec61333016d2e9dee1205";

  return (
    <>
      {hasCoinMetadata && (
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
            {!hasCoinMetadata ? (
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
                {pool.assetCoinTypes.map((coinType, index) => (
                  <TokenLogo
                    key={coinType}
                    className={cn(
                      index !== 0 &&
                        "-ml-2 outline outline-1 outline-background",
                      !hasCoinMetadata ? "animate-none" : "bg-background",
                    )}
                    token={
                      hasCoinMetadata
                        ? getToken(coinType, coinMetadataMap![coinType])
                        : undefined
                    }
                    size={32}
                  />
                ))}
              </div>

              {!hasCoinMetadata ? (
                <Skeleton className="h-[36px] w-32" />
              ) : (
                <h1 className="text-h2 text-foreground">{formattedPair}</h1>
              )}

              <Tag>{poolTypeNameMap[pool.type]}</Tag>
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
                <p className="text-p2 text-secondary-foreground">Volume 24h</p>

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
                <p className="text-p2 text-secondary-foreground">Fees 24h</p>

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
                <p className="text-p2 text-secondary-foreground">APR 24h</p>

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
              {/* Chart */}
              <div className="w-full rounded-md border p-5">
                <LineChartStat
                  title="Volume 30d"
                  valueUsd={pool.volumeUsd}
                  periodDays={30}
                  periodChangePercent={new BigNumber(2.51)}
                  data={volumeData}
                />
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
                                  pool.assetCoinTypes[0],
                                  coinMetadataMap![pool.assetCoinTypes[0]],
                                )
                              : undefined
                          }
                          size={16}
                        />

                        {!hasCoinMetadata ? (
                          <Skeleton className="h-[21px] w-10" />
                        ) : (
                          <p className="text-p2 text-foreground">
                            {coinMetadataMap![pool.assetCoinTypes[0]].symbol}
                          </p>
                        )}

                        <div className="flex flex-row items-center gap-1">
                          <CopyToClipboardButton
                            value={pool.assetCoinTypes[0]}
                          />
                          <OpenOnExplorerButton
                            url={explorer.buildCoinUrl(pool.assetCoinTypes[0])}
                          />
                        </div>
                      </div>

                      <div className="flex flex-row items-center gap-1.5">
                        <p className="text-p2 text-foreground">
                          {formatToken(
                            new BigNumber(
                              pool.tvlUsd.times(0.4).div(3.28252201),
                            ),
                            { exact: false },
                          )}
                        </p>

                        <p className="text-p3 text-tertiary-foreground">
                          ({formatPercent(new BigNumber(40))})
                        </p>
                      </div>
                    </div>

                    {/* Bottom */}
                    <div className="flex h-1 w-full flex-row overflow-hidden rounded-[2px]">
                      <div
                        className="h-full bg-jordy-blue"
                        style={{ width: "40%" }}
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
                                  pool.assetCoinTypes[1],
                                  coinMetadataMap![pool.assetCoinTypes[1]],
                                )
                              : undefined
                          }
                          size={16}
                        />

                        {!hasCoinMetadata ? (
                          <Skeleton className="h-[21px] w-10" />
                        ) : (
                          <p className="text-p2 text-foreground">
                            {coinMetadataMap![pool.assetCoinTypes[1]].symbol}
                          </p>
                        )}

                        <div className="flex flex-row items-center gap-1">
                          <CopyToClipboardButton
                            value={pool.assetCoinTypes[1]}
                          />
                          <OpenOnExplorerButton
                            url={explorer.buildCoinUrl(pool.assetCoinTypes[1])}
                          />
                        </div>
                      </div>

                      <div className="flex flex-row items-center gap-1.5">
                        <p className="text-p2 text-foreground">
                          {formatToken(
                            new BigNumber(pool.tvlUsd.times(1 - 0.4).div(1)),
                            { exact: false },
                          )}
                        </p>

                        <p className="text-p3 text-tertiary-foreground">
                          ({formatPercent(new BigNumber(100 - 40))})
                        </p>
                      </div>
                    </div>

                    {/* Bottom */}
                    <div className="flex h-1 w-full flex-row overflow-hidden rounded-[2px]">
                      <div
                        className="h-full bg-jordy-blue"
                        style={{ width: `${100 - 40}%` }}
                      />
                      <div className="h-full flex-1 bg-border" />
                    </div>
                  </div>
                </PoolStat>

                <PoolStat label="Current price">
                  {!hasCoinMetadata ? (
                    <Skeleton className="h-[21px] w-20" />
                  ) : (
                    <p className="text-p2 text-foreground">
                      1 {coinMetadataMap![pool.assetCoinTypes[0]].symbol}
                      {" ≈ "}
                      {formatToken(new BigNumber(3.28252201), {
                        dp: coinMetadataMap![pool.assetCoinTypes[1]].decimals,
                      })}{" "}
                      {coinMetadataMap![pool.assetCoinTypes[1]].symbol}
                    </p>
                  )}
                </PoolStat>

                <PoolStat label="Virtual price">
                  <p className="text-p2 text-foreground">--</p>
                </PoolStat>

                <PoolStat label="LP fee">
                  <p className="text-p2 text-foreground">
                    {formatPercent(new BigNumber(0.3))}
                  </p>
                </PoolStat>

                <PoolStat label="Protocol fee">
                  <p className="text-p2 text-foreground">
                    {formatPercent(new BigNumber(0.4))}
                  </p>
                </PoolStat>

                <PoolStat label="Pool address">
                  <div className="flex flex-row items-center gap-2">
                    <Tooltip title={poolAddress}>
                      <p className="text-p2 text-foreground">
                        {formatAddress(poolAddress)}
                      </p>
                    </Tooltip>

                    <div className="flex flex-row items-center gap-1">
                      <CopyToClipboardButton value={poolAddress} />
                      <OpenOnExplorerButton
                        url={explorer.buildObjectUrl(poolAddress)}
                      />
                    </div>
                  </div>
                </PoolStat>

                <PoolStat label="Creator address">
                  <div className="flex flex-row items-center gap-2">
                    <Tooltip title={creatorAddress}>
                      <p className="text-p2 text-foreground">
                        {formatAddress(creatorAddress)}
                      </p>
                    </Tooltip>

                    <div className="flex flex-row items-center gap-1">
                      <CopyToClipboardButton value={creatorAddress} />
                      <OpenOnExplorerButton
                        url={explorer.buildAddressUrl(creatorAddress)}
                      />
                    </div>
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
      <Pool />
    </PoolContextProvider>
  );
}
