import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import BigNumber from "bignumber.js";

import {
  NORMALIZED_DEEP_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  formatPercent,
  formatUsd,
} from "@suilend/frontend-sui";
import { showErrorToast } from "@suilend/frontend-sui-next";

import Divider from "@/components/Divider";
import PoolPositionsTable from "@/components/positions/PoolPositionsTable";
import Tag from "@/components/Tag";
import TokenLogos from "@/components/TokenLogos";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { PoolPosition } from "@/lib/types";

export default function PortfolioPage() {
  const {
    steammClient,
    appData,
    rawBalancesMap,
    balancesCoinMetadataMap,
    getBalance,
  } = useLoadedAppContext();

  // LP token balances
  const lpTokenBalanceMap = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(rawBalancesMap ?? {})
          .filter((coinType) => balancesCoinMetadataMap?.[coinType])
          .filter((coinType) =>
            balancesCoinMetadataMap![coinType].name
              .toLowerCase()
              .includes("Steamm LP Token".toLowerCase()),
          )
          .map((coinType) => [
            coinType,
            {
              coinMetadata: balancesCoinMetadataMap![coinType],
              balance: getBalance(coinType),
            },
          ]),
      ),
    [rawBalancesMap, balancesCoinMetadataMap, getBalance],
  );

  // Positions
  const positions: PoolPosition[] = useMemo(
    () =>
      appData.pools
        .filter((pool) =>
          Object.keys(lpTokenBalanceMap).includes(pool.lpTokenType),
        )
        .map((pool) => ({
          pool,
          balance: {
            amount: lpTokenBalanceMap[pool.lpTokenType].balance,
            amountUsd: undefined, // Fetched below
          },
          isStaked: false, // TODO - FETCH
          claimableRewards: {
            [NORMALIZED_SUI_COINTYPE]: new BigNumber(5.1),
            [NORMALIZED_DEEP_COINTYPE]: new BigNumber(1.051),
          }, // TODO - FETCH
          pnl: {
            percent: new BigNumber(3.5), // TODO - BACKEND
            amountUsd: new BigNumber(1000), // TODO - BACKEND
          },
        })),
    [appData.pools, lpTokenBalanceMap],
  );

  // Positions - Balances in USD
  const [poolBalancesUsd, setPoolBalancesUsd] = useState<
    Record<string, BigNumber>
  >({});

  useEffect(() => {
    (async () => {
      try {
        console.log("XXX fetching poolBalancesUsd");
        const result: Record<string, BigNumber> = {};

        const redeemQuotes = await Promise.all(
          positions.map((position) =>
            steammClient.Pool.quoteRedeem({
              pool: position.pool.id,
              lpTokens: BigInt(
                lpTokenBalanceMap[position.pool.lpTokenType].balance
                  .times(
                    10 **
                      lpTokenBalanceMap[position.pool.lpTokenType].coinMetadata
                        .decimals,
                  )
                  .integerValue(BigNumber.ROUND_DOWN)
                  .toString(),
              ),
            }),
          ),
        );

        for (let i = 0; i < positions.length; i++) {
          const pool = positions[i].pool;

          const balanceUsdA = new BigNumber(
            redeemQuotes[i].withdrawA.toString(),
          )
            .div(10 ** appData.poolCoinMetadataMap[pool.coinTypes[0]].decimals)
            .times(pool.prices[0]);
          const balanceUsdB = new BigNumber(
            redeemQuotes[i].withdrawB.toString(),
          )
            .div(10 ** appData.poolCoinMetadataMap[pool.coinTypes[1]].decimals)
            .times(pool.prices[1]);

          result[pool.id] = balanceUsdA.plus(balanceUsdB);
        }

        setPoolBalancesUsd(result);
      } catch (err) {
        showErrorToast("Failed to fetch pool balances", err as Error);
        console.error(err);
      }
    })();
  }, [positions, steammClient, lpTokenBalanceMap, appData.poolCoinMetadataMap]);

  const positionsWithFetchedData = useMemo(
    () =>
      positions.map((position) => ({
        ...position,
        balance: {
          ...position.balance,
          amountUsd: poolBalancesUsd[position.pool.id],
        },
      })),
    [positions, poolBalancesUsd],
  );

  // Summary
  const netWorthUsd: BigNumber | undefined = useMemo(
    () =>
      positionsWithFetchedData.some(
        (position) => position.balance.amountUsd === undefined,
      )
        ? undefined
        : positionsWithFetchedData.reduce(
            (sum, position) => sum.plus(position.balance.amountUsd ?? 0),
            new BigNumber(0),
          ),
    [positionsWithFetchedData],
  );

  const totalDepositedUsd = useMemo(
    () => new BigNumber(0), // TODO - BACKEND
    [],
  );

  const totalPnlUsd = useMemo(
    () =>
      positionsWithFetchedData.reduce(
        (sum, position) => sum.plus(position.pnl.amountUsd ?? 0),
        new BigNumber(0),
      ),
    [positionsWithFetchedData],
  );

  const averageAprPercent = useMemo(
    () =>
      positionsWithFetchedData.some(
        (position) => position.balance.amountUsd === undefined,
      )
        ? undefined
        : positionsWithFetchedData
            .reduce(
              (acc, position) =>
                acc.plus(
                  position.balance.amountUsd.times(position.pool.apr.percent),
                ),
              new BigNumber(0),
            )
            .div(
              positionsWithFetchedData.length > 0
                ? positionsWithFetchedData.reduce(
                    (sum, position) => sum.plus(position.balance.amountUsd),
                    new BigNumber(0),
                  )
                : 1,
            ),
    [positionsWithFetchedData],
  );

  const claimableRewards = useMemo(
    () =>
      positionsWithFetchedData.reduce(
        (acc, position) => {
          Object.entries(position.claimableRewards).forEach(
            ([coinType, amount]) => {
              if (acc[coinType]) acc[coinType] = acc[coinType].plus(amount);
              else acc[coinType] = amount;
            },
          );

          return acc;
        },
        {} as Record<string, BigNumber>,
      ),
    [positionsWithFetchedData],
  );

  // Summary - claim
  const onClaimRewardsClick = () => {};

  return (
    <>
      <Head>
        <title>STEAMM | Portfolio</title>
      </Head>

      <div className="flex w-full flex-col gap-8">
        <h1 className="text-h1 text-foreground">Portfolio</h1>

        {/* Stats */}
        <div className="grid w-full grid-cols-2 rounded-md border md:flex md:flex-row md:items-stretch">
          {/* Net worth */}
          <div className="max-md:w-full max-md:border-b max-md:border-r md:flex-1">
            <div className="flex w-full flex-col gap-1 p-5">
              <p className="text-p2 text-secondary-foreground">Net worth</p>

              {netWorthUsd === undefined ? (
                <Skeleton className="h-[30px] w-20" />
              ) : (
                <p className="text-h3 text-foreground">
                  {formatUsd(netWorthUsd)}
                </p>
              )}
            </div>
          </div>

          <Divider className="h-auto w-px max-md:hidden" />

          {/* Deposited */}
          <div className="max-md:w-full max-md:border-b md:flex-1">
            <div className="flex w-full flex-col gap-1 p-5">
              <p className="text-p2 text-secondary-foreground">
                Total deposited
              </p>
              <p className="text-h3 text-foreground">
                {formatUsd(totalDepositedUsd)}
              </p>
            </div>
          </div>

          <Divider className="h-auto w-px max-md:hidden" />

          {/* PnL */}
          <div className="max-md:w-full max-md:border-b max-md:border-r md:flex-1">
            <div className="flex w-full flex-col gap-1 p-5">
              <p className="text-p2 text-secondary-foreground">Total PnL</p>
              <p className="text-h3 text-success">{formatUsd(totalPnlUsd)}</p>
            </div>
          </div>

          <Divider className="h-auto w-px max-md:hidden" />

          {/* APR */}
          <div className="max-md:w-full max-md:border-b md:flex-1">
            <div className="flex w-full flex-col gap-1 p-5">
              <p className="text-p2 text-secondary-foreground">Average APR</p>

              {averageAprPercent === undefined ? (
                <Skeleton className="h-[30px] w-20" />
              ) : (
                <p className="text-h3 text-foreground">
                  {formatPercent(averageAprPercent)}
                </p>
              )}
            </div>
          </div>

          <Divider className="h-auto w-px max-md:hidden" />

          {/* Rewards */}
          <div className="max-md:w-full md:flex-1">
            <div className="flex w-full flex-col gap-1 p-5">
              <p className="text-p2 text-secondary-foreground">
                Claimable rewards
              </p>

              {Object.keys(claimableRewards).length > 0 ? (
                <div className="flex h-[30px] flex-row items-center gap-3">
                  <TokenLogos
                    coinTypes={Object.keys(claimableRewards)}
                    size={20}
                  />

                  <button
                    className="flex h-6 flex-row items-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80"
                    onClick={onClaimRewardsClick}
                  >
                    <p className="text-p3 text-button-2-foreground">Claim</p>
                  </button>
                </div>
              ) : (
                <p className="text-h3 text-foreground">--</p>
              )}
            </div>
          </div>
        </div>

        {/* Positions */}
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-row items-center gap-3">
            <h2 className="text-h3 text-foreground">Positions</h2>
            <Tag>{positions.length}</Tag>
          </div>

          <PoolPositionsTable positions={positionsWithFetchedData} />
        </div>
      </div>
    </>
  );
}
