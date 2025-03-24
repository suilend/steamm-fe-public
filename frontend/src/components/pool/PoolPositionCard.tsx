import { Fragment } from "react";

import { formatToken, formatUsd, getToken } from "@suilend/frontend-sui";

import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { usePoolPositionsContext } from "@/contexts/PoolPositionsContext";

export default function PoolPositionCard() {
  const { appData } = useLoadedAppContext();
  const { pool } = usePoolContext();

  const { poolPositions } = usePoolPositionsContext();

  const poolPosition =
    poolPositions === undefined
      ? undefined
      : (poolPositions.find((position) => position.pool.id === pool.id) ??
        null);

  if (poolPosition === null) return null;
  return (
    <div className="flex w-full flex-col gap-1 rounded-md border p-5">
      <p className="text-p2 text-secondary-foreground">Your balance</p>
      {poolPosition === undefined ? (
        <Skeleton className="h-[36px] w-20" />
      ) : (
        <Tooltip title={formatUsd(poolPosition.balanceUsd, { exact: true })}>
          <p className="w-max text-h2 text-foreground">
            {formatUsd(poolPosition.balanceUsd)}
          </p>
        </Tooltip>
      )}

      {poolPosition === undefined ? (
        <Skeleton className="h-[21px] w-40" />
      ) : (
        <div className="flex flex-row items-center gap-2">
          {pool.coinTypes.map((coinType, index) => (
            <Fragment key={coinType}>
              <TokenLogo
                token={getToken(coinType, appData.coinMetadataMap[coinType])}
                size={16}
              />
              <Tooltip
                title={`${formatToken(poolPosition.balances[index], { dp: appData.coinMetadataMap[coinType].decimals })} ${appData.coinMetadataMap[coinType].symbol}`}
              >
                <p className="text-p2 text-foreground">
                  {formatToken(poolPosition.balances[index], {
                    exact: false,
                  })}{" "}
                  {appData.coinMetadataMap[coinType].symbol}
                </p>
              </Tooltip>

              {index === 0 && (
                <p className="text-p2 text-secondary-foreground">+</p>
              )}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
