import Head from "next/head";
import Link from "next/link";
import { useMemo } from "react";

import { ChevronRight } from "lucide-react";

import { formatUsd } from "@suilend/frontend-sui";
import { useWalletContext } from "@suilend/frontend-sui-next";

import AprBreakdown from "@/components/AprBreakdown";
import PoolActionsCard from "@/components/pool/PoolActionsCard";
import PoolChartCard from "@/components/pool/PoolChartCard";
import PoolParametersCard from "@/components/pool/PoolParametersCard";
import PoolPositionCard from "@/components/pool/PoolPositionCard";
import PoolTypeTag from "@/components/pool/PoolTypeTag";
import SuggestedPools from "@/components/pool/SuggestedPools";
import TransactionHistoryTable from "@/components/pool/TransactionHistoryTable";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { PoolContextProvider, usePoolContext } from "@/contexts/PoolContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { useUserContext } from "@/contexts/UserContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import usePoolTransactionHistoryMap from "@/hooks/usePoolTransactionHistoryMap";
import { formatFeeTier, formatPair } from "@/lib/format";
import { ROOT_URL } from "@/lib/navigation";
import { ParsedPool } from "@/lib/types";

function PoolPage() {
  const { address } = useWalletContext();
  const { appData, poolsData } = useLoadedAppContext();
  const { poolStats } = useStatsContext();
  const { refresh } = useUserContext();

  const { pool } = usePoolContext();

  const { md, lg } = useBreakpoint();

  // Pair
  const formattedPair = formatPair(
    pool.coinTypes.map((coinType) => appData.coinMetadataMap[coinType].symbol),
  );

  // Transaction history
  const { poolTransactionHistoryMap, fetchPoolTransactionHistoryMap } =
    usePoolTransactionHistoryMap([pool.id]);

  const poolTransactionHistory = useMemo(
    () => (address ? poolTransactionHistoryMap?.[pool.id] : []),
    [address, poolTransactionHistoryMap, pool.id],
  );

  // Suggested pools
  const otherBaseAssetPools: ParsedPool[] | undefined = useMemo(() => {
    if (poolsData === undefined) return undefined;

    return poolsData.pools.filter(
      (_pool) =>
        _pool.id !== pool.id && _pool.coinTypes[0] === pool.coinTypes[0],
    );
  }, [poolsData, pool]);

  const otherQuoteAssetPools: ParsedPool[] | undefined = useMemo(() => {
    if (poolsData === undefined) return undefined;

    return poolsData.pools.filter(
      (_pool) =>
        _pool.id !== pool.id && _pool.coinTypes[1] === pool.coinTypes[1],
    );
  }, [poolsData, pool]);

  // Actions
  const onDeposit = async () => {
    refresh();

    setTimeout(() => {
      fetchPoolTransactionHistoryMap([pool.id]);
    }, 1000);
  };

  const onWithdraw = async () => {
    refresh();

    setTimeout(() => {
      fetchPoolTransactionHistoryMap([pool.id]);
    }, 1000);
  };

  return (
    <>
      <Head>
        <title>STEAMM | {formattedPair}</title>
      </Head>

      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full flex-row items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex flex-row items-center gap-2">
            <Link className="group" href={ROOT_URL}>
              <p className="text-p2 text-tertiary-foreground transition-colors group-hover:text-foreground">
                Pools
              </p>
            </Link>

            <ChevronRight className="h-4 w-4 text-tertiary-foreground" />
            <p className="text-p2 text-foreground">{formattedPair}</p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-8">
          <div className="flex w-full flex-col gap-6">
            {/* Top */}
            <div className="flex w-full flex-col max-lg:gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Title */}
              <div className="flex flex-row items-center gap-3">
                <TokenLogos coinTypes={pool.coinTypes} size={32} />
                <h1 className="text-h2 text-foreground">{formattedPair}</h1>

                <div className="flex flex-row items-center gap-1">
                  <PoolTypeTag pool={pool} />
                  <Tag>{formatFeeTier(pool.feeTierPercent)}</Tag>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 md:flex md:flex-row md:gap-12">
                <div className="flex flex-col gap-1">
                  <p className="text-p2 text-secondary-foreground">TVL</p>

                  <Tooltip title={formatUsd(pool.tvlUsd, { exact: true })}>
                    <p className="w-max text-p1 text-foreground">
                      {formatUsd(pool.tvlUsd)}
                    </p>
                  </Tooltip>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex flex-row items-baseline gap-1.5">
                    <p className="text-p2 text-secondary-foreground">Volume</p>
                    <p className="text-p3 text-tertiary-foreground">24H</p>
                  </div>

                  {poolStats.volumeUsd_24h[pool.id] === undefined ? (
                    <Skeleton className="h-[24px] w-16" />
                  ) : (
                    <Tooltip
                      title={formatUsd(poolStats.volumeUsd_24h[pool.id], {
                        exact: true,
                      })}
                    >
                      <p className="w-max text-p1 text-foreground">
                        {formatUsd(poolStats.volumeUsd_24h[pool.id])}
                      </p>
                    </Tooltip>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex flex-row items-baseline gap-1.5">
                    <p className="text-p2 text-secondary-foreground">Fees</p>
                    <p className="text-p3 text-tertiary-foreground">24H</p>
                  </div>

                  {poolStats.feesUsd_24h[pool.id] === undefined ? (
                    <Skeleton className="h-[24px] w-16" />
                  ) : (
                    <Tooltip
                      title={formatUsd(poolStats.feesUsd_24h[pool.id], {
                        exact: true,
                      })}
                    >
                      <p className="w-max text-p1 text-foreground">
                        {formatUsd(poolStats.feesUsd_24h[pool.id])}
                      </p>
                    </Tooltip>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex flex-row items-baseline gap-1.5">
                    <p className="text-p2 text-secondary-foreground">APR</p>
                    <p className="text-p3 text-tertiary-foreground">24H</p>
                  </div>

                  <AprBreakdown pool={pool} />
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-4 md:flex-row">
              {/* Left */}
              <div className="flex flex-col gap-6 max-md:w-full md:flex-1 lg:flex-[3]">
                {/* Cards */}
                <div className="flex w-full flex-col gap-4">
                  <PoolChartCard />
                  <PoolParametersCard />
                </div>

                {/* Transaction history */}
                <div className="flex w-full flex-col gap-4">
                  <div className="flex flex-row items-center gap-3">
                    <p className="text-h3 text-foreground">
                      Transaction history
                    </p>
                    {poolTransactionHistory === undefined ? (
                      <Skeleton className="h-5 w-12" />
                    ) : (
                      <Tag>{poolTransactionHistory.flat().length}</Tag>
                    )}
                  </div>

                  <TransactionHistoryTable
                    transactionHistory={poolTransactionHistory}
                  />
                </div>

                {/* Suggested pools */}
                <SuggestedPools
                  id={appData.coinMetadataMap[pool.coinTypes[0]].symbol}
                  title={`Other ${appData.coinMetadataMap[pool.coinTypes[0]].symbol} pools`}
                  pools={otherBaseAssetPools}
                />

                <SuggestedPools
                  id={appData.coinMetadataMap[pool.coinTypes[1]].symbol}
                  title={`Other ${appData.coinMetadataMap[pool.coinTypes[1]].symbol} pools`}
                  pools={otherQuoteAssetPools}
                />
              </div>

              {/* Right */}
              <div className="flex flex-col gap-6 max-md:w-full md:flex-1 lg:flex-[2]">
                {/* Cards */}
                <div className="flex w-full flex-col gap-4">
                  <PoolPositionCard />
                  <PoolActionsCard
                    key={pool.id}
                    onDeposit={onDeposit}
                    onWithdraw={onWithdraw}
                  />
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
