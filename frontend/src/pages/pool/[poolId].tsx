import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChevronRight } from "lucide-react";

import { formatUsd } from "@suilend/frontend-sui";
import { showErrorToast, useWalletContext } from "@suilend/frontend-sui-next";

import AprBreakdown from "@/components/AprBreakdown";
import PoolActionsCard from "@/components/pool/PoolActionsCard";
import PoolChartCard from "@/components/pool/PoolChartCard";
import PoolParametersCard from "@/components/pool/PoolParametersCard";
import SuggestedPools from "@/components/pool/SuggestedPools";
import TransactionHistoryTable from "@/components/pool/TransactionHistoryTable";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { PoolContextProvider, usePoolContext } from "@/contexts/PoolContext";
import { useStatsContext } from "@/contexts/StatsContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import { formatFeeTier, formatPair } from "@/lib/format";
import { API_URL, ROOT_URL } from "@/lib/navigation";
import {
  HistoryDeposit,
  HistoryRedeem,
  HistoryTransactionType,
} from "@/lib/types";

function PoolPage() {
  const { address } = useWalletContext();
  const { appData } = useLoadedAppContext();
  const { poolStats } = useStatsContext();

  const { pool } = usePoolContext();

  const { md, lg } = useBreakpoint();

  // Pair
  const formattedPair = formatPair(
    pool.coinTypes.map((coinType) => appData.coinMetadataMap[coinType].symbol),
  );

  const [transactionHistoryMapMap, setTransactionHistoryMapMap] = useState<
    Record<string, Record<string, (HistoryDeposit | HistoryRedeem)[]>>
  >({});
  const poolTransactionHistory = !address
    ? []
    : transactionHistoryMapMap[address]?.[pool.id];

  const fetchPoolTransactionHistory = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_URL}/steamm/historical/lp?${new URLSearchParams({
          user: address!, // Checked in useEffect below
          poolId: pool.id,
        })}`,
      );
      const json: {
        deposits: Omit<HistoryDeposit, "type">[];
        redeems: Omit<HistoryRedeem, "type">[];
      } = await res.json();
      if ((json as any)?.statusCode === 500) return;

      setTransactionHistoryMapMap((prev) => ({
        ...prev,
        [address!]: {
          ...prev[address!],
          [pool.id]: [
            ...(json.deposits.map((entry) => ({
              ...entry,
              type: HistoryTransactionType.DEPOSIT,
            })) as HistoryDeposit[]),
            ...(json.redeems.map((entry) => ({
              ...entry,
              type: HistoryTransactionType.REDEEM,
            })) as HistoryRedeem[]),
          ].sort((a, b) => +b.timestamp - +a.timestamp),
        },
      }));
    } catch (err) {
      showErrorToast("Failed to fetch transaction history", err as Error);
      console.error(err);
    }
  }, [address, pool.id]);

  const hasFetchedTransactionHistoryMapMapRef = useRef<
    Record<string, Record<string, boolean>>
  >({});
  useEffect(() => {
    if (!address) return;

    if (
      hasFetchedTransactionHistoryMapMapRef.current[address] !== undefined &&
      hasFetchedTransactionHistoryMapMapRef.current[address][pool.id]
    )
      return;
    if (!hasFetchedTransactionHistoryMapMapRef.current[address])
      hasFetchedTransactionHistoryMapMapRef.current[address] = {};
    hasFetchedTransactionHistoryMapMapRef.current[address][pool.id] = true;

    fetchPoolTransactionHistory();
  }, [address, pool.id, fetchPoolTransactionHistory]);

  // Suggested pools
  const suggestedPools = appData.pools
    .filter(
      (_pool) =>
        _pool.id !== pool.id && _pool.coinTypes[0] === pool.coinTypes[0],
    )
    .sort((a, b) => +b.tvlUsd - +a.tvlUsd);

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
                  <Tag>{pool.quoter.name}</Tag>
                  <Tag>{formatFeeTier(pool.feeTierPercent)}</Tag>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 md:flex md:flex-row md:gap-12">
                <div className="flex flex-col gap-1">
                  <p className="text-p2 text-secondary-foreground">TVL</p>

                  <div className="flex flex-row items-center gap-1.5">
                    <Tooltip title={formatUsd(pool.tvlUsd, { exact: true })}>
                      <p className="text-p1 text-foreground">
                        {formatUsd(pool.tvlUsd)}
                      </p>
                    </Tooltip>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex flex-row items-baseline gap-1.5">
                    <p className="text-p2 text-secondary-foreground">Volume</p>
                    <p className="text-p3 text-tertiary-foreground">24H</p>
                  </div>

                  <div className="flex flex-row items-center gap-1.5">
                    {poolStats.volumeUsd_24h[pool.id] === undefined ? (
                      <Skeleton className="h-[24px] w-16" />
                    ) : (
                      <Tooltip
                        title={formatUsd(poolStats.volumeUsd_24h[pool.id], {
                          exact: true,
                        })}
                      >
                        <p className="text-p1 text-foreground">
                          {formatUsd(poolStats.volumeUsd_24h[pool.id])}
                        </p>
                      </Tooltip>
                    )}

                    {/* <PercentChange
                    value={new BigNumber(-5 + Math.random() * 10)}
                  /> */}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex flex-row items-baseline gap-1.5">
                    <p className="text-p2 text-secondary-foreground">Fees</p>
                    <p className="text-p3 text-tertiary-foreground">24H</p>
                  </div>

                  <div className="flex flex-row items-center gap-1.5">
                    {poolStats.feesUsd_24h[pool.id] === undefined ? (
                      <Skeleton className="h-[24px] w-16" />
                    ) : (
                      <Tooltip
                        title={formatUsd(poolStats.feesUsd_24h[pool.id], {
                          exact: true,
                        })}
                      >
                        <p className="text-p1 text-foreground">
                          {formatUsd(poolStats.feesUsd_24h[pool.id])}
                        </p>
                      </Tooltip>
                    )}

                    {/* <PercentChange
                    value={new BigNumber(-5 + Math.random() * 10)}
                  /> */}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-p2 text-secondary-foreground">APR</p>

                  <div className="flex flex-row items-center gap-1.5">
                    <AprBreakdown
                      valueClassName="text-success decoration-success/50"
                      pool={pool}
                    />

                    {/* <PercentChange
                    value={new BigNumber(-5 + Math.random() * 10)}
                  /> */}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-1 md:flex-row">
              {/* Left */}
              <div className="flex flex-col gap-1 max-md:w-full md:flex-1 lg:flex-[3]">
                <PoolChartCard />
                <PoolParametersCard />
              </div>

              {/* Right */}
              <div className="max-md:w-full md:flex-1 lg:flex-[2]">
                <PoolActionsCard key={pool.id} />
              </div>
            </div>
          </div>

          {/* Transaction history */}
          <div className="flex w-full flex-col gap-4">
            <div className="flex flex-row items-center gap-3">
              <p className="text-h3 text-foreground">Transaction history</p>
              <Tag>{poolTransactionHistory?.length ?? 0}</Tag>
            </div>

            <TransactionHistoryTable
              transactionHistory={poolTransactionHistory}
            />
          </div>

          {/* Suggested pools */}
          {suggestedPools.length > 0 && (
            <SuggestedPools
              containerClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              title={`Other ${appData.coinMetadataMap[pool.coinTypes[0]].symbol} pools`}
              pools={suggestedPools}
              collapsedPoolCount={lg ? 3 : md ? 2 : 1}
            />
          )}
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
