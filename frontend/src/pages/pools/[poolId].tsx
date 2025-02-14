import Head from "next/head";
import Link from "next/link";

import BigNumber from "bignumber.js";
import { ChevronRight } from "lucide-react";

import { formatPercent, formatUsd, getToken } from "@suilend/frontend-sui";

import PercentChange from "@/components/PercentChange";
import PoolActionsCard from "@/components/pool/PoolActionsCard";
import PoolChartCard from "@/components/pool/PoolChartCard";
import PoolParametersCard from "@/components/pool/PoolParametersCard";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { PoolContextProvider, usePoolContext } from "@/contexts/PoolContext";
import { POOLS_URL } from "@/lib/navigation";
import { poolTypeNameMap } from "@/lib/types";
import { cn } from "@/lib/utils";

function PoolPage() {
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
              <PoolChartCard />
              <PoolParametersCard />
            </div>

            {/* Right */}
            <div className="max-md:w-full md:flex-1">
              <PoolActionsCard />
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
