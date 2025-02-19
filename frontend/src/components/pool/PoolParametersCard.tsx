import { PropsWithChildren } from "react";

import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";

import {
  formatAddress,
  formatPercent,
  formatToken,
  getToken,
} from "@suilend/frontend-sui";
import { useSettingsContext } from "@suilend/frontend-sui-next";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import ExchangeRateParameter from "@/components/ExchangeRateParameter";
import OpenOnExplorerButton from "@/components/OpenOnExplorerButton";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { formatFeeTier } from "@/lib/format";
import { cn, hoverUnderlineClassName } from "@/lib/utils";

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
    <div className="grid w-full grid-cols-1 gap-x-6 gap-y-6 rounded-md border p-5">
      <Parameter className="gap-2" label="Pool composition">
        {pool.coinTypes.map((coinType, index) => {
          const coinMetadata = appData.poolCoinMetadataMap[coinType];

          return (
            <div
              key={coinType}
              className="flex w-full flex-row items-center gap-2"
            >
              <TokenLogo
                className="bg-background"
                token={getToken(coinType, coinMetadata)}
                size={16}
              />

              <Tooltip
                title={`${formatToken(pool.balances[index], {
                  dp: coinMetadata.decimals,
                })} ${coinMetadata.symbol}`}
              >
                <p className="text-p2 text-foreground">
                  {formatToken(pool.balances[index], { exact: false })}{" "}
                  {coinMetadata.symbol}
                </p>
              </Tooltip>

              {appData.reserveDepositAprPercentMap[coinType] && (
                <Tooltip
                  title={`Deposited ${coinMetadata.symbol} is earning ${formatPercent(appData.reserveDepositAprPercentMap[coinType])} APR in Suilend`}
                >
                  <p
                    className={cn(
                      "text-p2 text-success decoration-success/50",
                      hoverUnderlineClassName,
                    )}
                  >
                    {formatPercent(
                      appData.reserveDepositAprPercentMap[coinType],
                    )}{" "}
                    APR
                  </p>
                </Tooltip>
              )}

              <div className="flex flex-row items-center gap-1">
                <CopyToClipboardButton value={coinType} />
                <OpenOnExplorerButton url={explorer.buildCoinUrl(coinType)} />
              </div>
            </div>
          );
        })}
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

      <ExchangeRateParameter
        inCoinType={pool.coinTypes[0]}
        outCoinType={pool.coinTypes[1]}
        quote={{
          amountIn: BigInt(
            pool.balances[0]
              .times(
                10 ** appData.poolCoinMetadataMap[pool.coinTypes[0]].decimals,
              )
              .integerValue(BigNumber.ROUND_DOWN)
              .toString(),
          ),
          amountOut: BigInt(
            pool.balances[1]
              .times(
                10 ** appData.poolCoinMetadataMap[pool.coinTypes[1]].decimals,
              )
              .integerValue(BigNumber.ROUND_DOWN)
              .toString(),
          ),
        }}
        label="Current price"
      />

      <Parameter label="Fee tier">
        <p className="text-p2 text-foreground">
          {formatFeeTier(pool.feeTierPercent)}
        </p>
      </Parameter>
    </div>
  );
}
