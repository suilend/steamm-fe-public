import { PropsWithChildren } from "react";

import { ClassValue } from "clsx";

import {
  formatAddress,
  formatPercent,
  formatToken,
  getToken,
} from "@suilend/frontend-sui";
import { useSettingsContext } from "@suilend/frontend-sui-next";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import OpenOnExplorerButton from "@/components/OpenOnExplorerButton";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { cn } from "@/lib/utils";

interface ParameterProps extends PropsWithChildren {
  className?: ClassValue;
  label?: string;
}

function Parameter({ className, label, children }: ParameterProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <p className="text-p2 text-secondary-foreground">{label}</p>}
      {children}
    </div>
  );
}

export default function PoolParametersCard() {
  const { explorer } = useSettingsContext();
  const { appData } = useLoadedAppContext();
  const { pool } = usePoolContext();

  return (
    <div className="grid w-full grid-cols-1 gap-x-6 gap-y-6 rounded-md border p-5 lg:grid-cols-2">
      <Parameter className="gap-1.5" label="Pool composition">
        <div className="flex w-full flex-col gap-2">
          {/* Top */}
          <div className="flex w-full flex-row justify-between">
            {/* Left */}
            <div className="flex flex-row items-center gap-2">
              <TokenLogo
                className="bg-background"
                token={getToken(
                  pool.coinTypes[0],
                  appData.poolCoinMetadataMap[pool.coinTypes[0]],
                )}
                size={16}
              />

              <p className="text-p2 text-foreground">
                {appData.poolCoinMetadataMap[pool.coinTypes[0]].symbol}
              </p>
              <div className="flex flex-row items-center gap-1">
                <CopyToClipboardButton value={pool.coinTypes[0]} />
                <OpenOnExplorerButton
                  url={explorer.buildCoinUrl(pool.coinTypes[0])}
                />
              </div>
            </div>

            <div className="flex flex-row items-center gap-1.5">
              <Tooltip
                title={formatToken(pool.balances[0], {
                  dp: appData.poolCoinMetadataMap[pool.coinTypes[0]].decimals,
                })}
              >
                <p className="text-p2 text-foreground">
                  {formatToken(pool.balances[0], { exact: false })}
                </p>
              </Tooltip>

              {!pool.tvlUsd.eq(0) && (
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
              )}
            </div>
          </div>

          {/* Bottom */}
          <div className="flex h-1 w-full flex-row overflow-hidden rounded-[2px]">
            <div
              className="h-full bg-jordy-blue"
              style={{
                width: !pool.tvlUsd.eq(0)
                  ? `${pool.balances[0]
                      .times(pool.prices[0])
                      .div(pool.tvlUsd)
                      .times(100)}%`
                  : "0%",
              }}
            />
            <div className="h-full flex-1 bg-border" />
          </div>
        </div>
      </Parameter>
      <Parameter className="max-md:-mt-2 md:self-end">
        <div className="flex w-full flex-col gap-2">
          {/* Top */}
          <div className="flex w-full flex-row justify-between">
            {/* Left */}
            <div className="flex flex-row items-center gap-2">
              <TokenLogo
                className="bg-background"
                token={getToken(
                  pool.coinTypes[1],
                  appData.poolCoinMetadataMap[pool.coinTypes[1]],
                )}
                size={16}
              />

              <p className="text-p2 text-foreground">
                {appData.poolCoinMetadataMap[pool.coinTypes[1]].symbol}
              </p>
              <div className="flex flex-row items-center gap-1">
                <CopyToClipboardButton value={pool.coinTypes[1]} />
                <OpenOnExplorerButton
                  url={explorer.buildCoinUrl(pool.coinTypes[1])}
                />
              </div>
            </div>

            <div className="flex flex-row items-center gap-1.5">
              <Tooltip
                title={formatToken(pool.balances[1], {
                  dp: appData.poolCoinMetadataMap[pool.coinTypes[1]].decimals,
                })}
              >
                <p className="text-p2 text-foreground">
                  {formatToken(pool.balances[1], { exact: false })}
                </p>
              </Tooltip>

              {!pool.tvlUsd.eq(0) && (
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
              )}
            </div>
          </div>

          {/* Bottom */}
          <div className="flex h-1 w-full flex-row overflow-hidden rounded-[2px]">
            <div
              className="h-full bg-jordy-blue"
              style={{
                width: !pool.tvlUsd.eq(0)
                  ? `${pool.balances[1]
                      .times(pool.prices[1])
                      .div(pool.tvlUsd)
                      .times(100)}%`
                  : "0%",
              }}
            />
            <div className="h-full flex-1 bg-border" />
          </div>
        </div>
      </Parameter>

      <Parameter label="Pool address">
        <div className="flex flex-row items-center gap-2">
          <Tooltip title={pool.id}>
            <p className="text-p2 text-foreground">{formatAddress(pool.id)}</p>
          </Tooltip>

          <div className="flex flex-row items-center gap-1">
            <CopyToClipboardButton value={pool.id} />
            <OpenOnExplorerButton url={explorer.buildObjectUrl(pool.id)} />
          </div>
        </div>
      </Parameter>

      <Parameter label="Current price">
        <p className="text-p2 text-foreground">
          {pool.balances.every((balance) => !balance.eq(0)) ? (
            <>
              1 {appData.poolCoinMetadataMap[pool.coinTypes[0]].symbol}
              {" ≈ "}
              {formatToken(pool.balances[1].div(pool.balances[0]), {
                dp: appData.poolCoinMetadataMap[pool.coinTypes[1]].decimals,
              })}{" "}
              {appData.poolCoinMetadataMap[pool.coinTypes[1]].symbol}
            </>
          ) : (
            "N/A"
          )}
        </p>
      </Parameter>

      <Parameter label="Fee tier">
        <p className="text-p2 text-foreground">
          {formatPercent(pool.feeTierPercent)}
        </p>
      </Parameter>

      <Parameter label="Protocol fee">
        <p className="text-p2 text-foreground">
          {formatPercent(pool.protocolFeePercent, {
            dp:
              Math.max(
                0,
                -Math.floor(Math.log10(+pool.protocolFeePercent)) - 1,
              ) + 1,
          })}
        </p>
      </Parameter>
    </div>
  );
}
