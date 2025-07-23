import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import { ChevronRight } from "lucide-react";

import { ParsedPool, QUOTER_ID_NAME_MAP, QuoterId } from "@suilend/steamm-sdk";
import { formatUsd } from "@suilend/sui-fe";
import { useWalletContext } from "@suilend/sui-fe-next";

import AprBreakdown from "@/components/AprBreakdown";
import PoolActionsCard from "@/components/pool/PoolActionsCard";
import PoolChartCard from "@/components/pool/PoolChartCard";
import PoolLabel from "@/components/pool/PoolLabel";
import PoolParametersCard from "@/components/pool/PoolParametersCard";
import PoolPositionCard from "@/components/pool/PoolPositionCard";
import SuggestedPools from "@/components/pool/SuggestedPools";
import TransactionHistoryTable from "@/components/pool/TransactionHistoryTable";
import Tag from "@/components/Tag";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { PoolContextProvider, usePoolContext } from "@/contexts/PoolContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { useUserContext } from "@/contexts/UserContext";
import usePoolCurrentPriceQuote from "@/hooks/usePoolCurrentPrice";
import usePoolTransactionHistoryMap from "@/hooks/usePoolTransactionHistoryMap";
import { ChartPeriod } from "@/lib/chart";
import { formatFeeTier, formatPair } from "@/lib/format";
import { ROOT_URL } from "@/lib/navigation";

function PoolPage() {
  const { address } = useWalletContext();
  const { appData, addRecentPoolId } = useLoadedAppContext();
  const { poolStats } = useStatsContext();
  const { refresh } = useUserContext();

  const { pool, fetchRefreshedPool } = usePoolContext();

  // Recent pool
  useEffect(() => {
    addRecentPoolId(pool.id);
  }, [addRecentPoolId, pool.id]);

  // Pair
  const formattedPair = formatPair(
    pool.coinTypes.map((coinType) => appData.coinMetadataMap[coinType].symbol),
  );

  // Current price
  const { poolCurrentPriceQuoteMap, fetchPoolCurrentPriceQuote } =
    usePoolCurrentPriceQuote([pool.id]);
  const currentPriceQuote = useMemo(
    () => poolCurrentPriceQuoteMap[pool.id],
    [poolCurrentPriceQuoteMap, pool.id],
  );

  // Refresh pool and current price (every 15s)
  const refreshPoolIntervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (refreshPoolIntervalRef.current)
      clearInterval(refreshPoolIntervalRef.current);

    refreshPoolIntervalRef.current = setInterval(() => {
      fetchRefreshedPool(pool);
      fetchPoolCurrentPriceQuote([pool.id]);
    }, 15 * 1000);

    return () => {
      if (refreshPoolIntervalRef.current)
        clearInterval(refreshPoolIntervalRef.current);
    };
  }, [fetchRefreshedPool, pool, fetchPoolCurrentPriceQuote]);

  // Transaction history
  const { poolTransactionHistoryMap, fetchPoolTransactionHistoryMap } =
    usePoolTransactionHistoryMap([pool.id]);

  const poolTransactionHistory = useMemo(
    () => (address ? poolTransactionHistoryMap?.[pool.id] : []),
    [address, poolTransactionHistoryMap, pool.id],
  );

  // Suggested pools
  const otherBaseAssetPools: ParsedPool[] = useMemo(
    () =>
      appData.pools.filter(
        (_pool) =>
          _pool.id !== pool.id && _pool.coinTypes[0] === pool.coinTypes[0],
      ),
    [appData.pools, pool],
  );

  const otherQuoteAssetPools: ParsedPool[] = useMemo(
    () =>
      appData.pools.filter(
        (_pool) =>
          _pool.id !== pool.id && _pool.coinTypes[1] === pool.coinTypes[1],
      ),
    [appData.pools, pool],
  );

  // Actions
  const onSwap = async () => {
    refresh();

    setTimeout(() => {
      fetchRefreshedPool(pool);
      fetchPoolCurrentPriceQuote([pool.id]);
      fetchPoolTransactionHistoryMap([pool.id]);
    }, 2000);
  };

  const onDeposit = async () => {
    refresh();

    setTimeout(() => {
      fetchRefreshedPool(pool);
      fetchPoolCurrentPriceQuote([pool.id]);
      fetchPoolTransactionHistoryMap([pool.id]);
    }, 2000);
  };

  const onWithdraw = async () => {
    refresh();

    setTimeout(() => {
      fetchRefreshedPool(pool);
      fetchPoolCurrentPriceQuote([pool.id]);
      fetchPoolTransactionHistoryMap([pool.id]);
    }, 2000);
  };

  return (
    <>
      <Head>
        <title>
          STEAMM | {formattedPair} {QUOTER_ID_NAME_MAP[pool.quoterId]}{" "}
          {formatFeeTier(pool.feeTierPercent)}
        </title>
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
              <PoolLabel wrap isLarge pool={pool} />

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

                  {poolStats.volumeUsd[ChartPeriod.ONE_DAY][pool.id] ===
                  undefined ? (
                    <Skeleton className="h-[24px] w-16" />
                  ) : (
                    <Tooltip
                      title={formatUsd(
                        poolStats.volumeUsd[ChartPeriod.ONE_DAY][pool.id],
                        { exact: true },
                      )}
                    >
                      <p className="w-max text-p1 text-foreground">
                        {formatUsd(
                          poolStats.volumeUsd[ChartPeriod.ONE_DAY][pool.id],
                        )}
                      </p>
                    </Tooltip>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex flex-row items-baseline gap-1.5">
                    <p className="text-p2 text-secondary-foreground">Fees</p>
                    <p className="text-p3 text-tertiary-foreground">24H</p>
                  </div>

                  {poolStats.feesUsd[ChartPeriod.ONE_DAY][pool.id] ===
                  undefined ? (
                    <Skeleton className="h-[24px] w-16" />
                  ) : (
                    <Tooltip
                      title={formatUsd(
                        poolStats.feesUsd[ChartPeriod.ONE_DAY][pool.id],
                        { exact: true },
                      )}
                    >
                      <p className="w-max text-p1 text-foreground">
                        {formatUsd(
                          poolStats.feesUsd[ChartPeriod.ONE_DAY][pool.id],
                        )}
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

            {/* Chart, params, and actions */}
            <div className="flex w-full flex-col gap-4 md:flex-row">
              {/* Left */}
              <div className="flex min-w-0 flex-col gap-6 max-md:w-full md:flex-1 lg:flex-[3]">
                {/* Cards */}
                <div className="flex w-full flex-col gap-4">
                  <PoolChartCard />
                  <PoolParametersCard currentPriceQuote={currentPriceQuote} />
                </div>
              </div>

              {/* Right */}
              <div className="flex flex-col gap-6 max-md:w-full md:flex-1 lg:max-w-lg lg:flex-[2]">
                {/* Cards */}
                <div className="flex w-full flex-col gap-4">
                  {/* OMMv0.1 */}
                  {pool.quoterId === QuoterId.ORACLE && (
                    <div className="flex w-full flex-row items-center justify-between gap-4 rounded-md border border-warning bg-warning/25 px-5 py-2">
                      <p className="text-p2 text-foreground">
                        {QUOTER_ID_NAME_MAP[pool.quoterId]} pools are deprecated
                        and in withdraw-only mode.
                      </p>
                    </div>
                  )}

                  <PoolPositionCard />
                  <PoolActionsCard
                    key={pool.id}
                    onSwap={onSwap}
                    onDeposit={onDeposit}
                    onWithdraw={onWithdraw}
                  />
                </div>
              </div>
            </div>

            {/* Transaction history */}
            <div className="flex w-full flex-col gap-4">
              <div className="flex flex-row items-center gap-3">
                <p className="text-h3 text-foreground">Transaction history</p>
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
              tableId={appData.coinMetadataMap[pool.coinTypes[0]].symbol}
              title={`Other ${appData.coinMetadataMap[pool.coinTypes[0]].symbol} pools`}
              pools={otherBaseAssetPools}
            />

            <SuggestedPools
              tableId={appData.coinMetadataMap[pool.coinTypes[1]].symbol}
              title={`Other ${appData.coinMetadataMap[pool.coinTypes[1]].symbol} pools`}
              pools={otherQuoteAssetPools}
            />
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
