import BigNumber from "bignumber.js";

import {
  formatAddress,
  formatPercent,
  formatToken,
  getToken,
} from "@suilend/frontend-sui";
import { useSettingsContext } from "@suilend/frontend-sui-next";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import ExchangeRateParameter from "@/components/ExchangeRateParameter";
import OpenUrlNewTab from "@/components/OpenUrlNewTab";
import Parameter from "@/components/Parameter";
import SuilendLogo from "@/components/SuilendLogo";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { formatFeeTier } from "@/lib/format";
import { cn, hoverUnderlineClassName } from "@/lib/utils";

export default function PoolParametersCard() {
  const { explorer } = useSettingsContext();
  const { appData, banksData } = useLoadedAppContext();
  const { pool } = usePoolContext();

  return (
    <div className="grid w-full grid-cols-1 gap-x-6 gap-y-6 rounded-md border p-5">
      <Parameter label="Assets">
        {pool.coinTypes.map((coinType, index) => (
          <div
            key={coinType}
            className="flex w-full flex-row items-center gap-2"
          >
            <TokenLogo
              token={getToken(coinType, appData.coinMetadataMap[coinType])}
              size={16}
            />

            <Tooltip
              title={`${formatToken(pool.balances[index], {
                dp: appData.coinMetadataMap[coinType].decimals,
              })} ${appData.coinMetadataMap[coinType].symbol}`}
            >
              <p className="text-p2 text-foreground">
                {formatToken(pool.balances[index], { exact: false })}{" "}
                {appData.coinMetadataMap[coinType].symbol}
              </p>
            </Tooltip>

            <div className="flex flex-row items-center gap-1">
              <CopyToClipboardButton value={coinType} />
              <OpenUrlNewTab url={explorer.buildCoinUrl(coinType)} />
            </div>

            {appData.mainMarket.reserveMap[coinType] &&
              (banksData === undefined ? (
                <Skeleton className="h-5 w-20" />
              ) : (
                <Tag
                  labelClassName={cn(
                    "text-foreground decoration-foreground/50",
                    hoverUnderlineClassName,
                  )}
                  tooltip={`${formatPercent(banksData.bankMap[coinType].utilizationPercent)} of deposited ${appData.coinMetadataMap[coinType].symbol} is earning ${formatPercent(banksData.bankMap[coinType].suilendDepositAprPercent)} APR on Suilend`}
                  startDecorator={<SuilendLogo size={12} />}
                >
                  {formatPercent(
                    banksData.bankMap[coinType].suilendDepositAprPercent
                      .times(banksData.bankMap[coinType].utilizationPercent)
                      .div(100),
                  )}{" "}
                  APR
                </Tag>
              ))}
          </div>
        ))}
      </Parameter>

      <Parameter label="Fee tier">
        <p className="text-p2 text-foreground">
          {formatFeeTier(pool.feeTierPercent)}
        </p>
      </Parameter>

      <ExchangeRateParameter
        inToken={getToken(
          pool.coinTypes[0],
          appData.coinMetadataMap[pool.coinTypes[0]],
        )}
        outToken={getToken(
          pool.coinTypes[1],
          appData.coinMetadataMap[pool.coinTypes[1]],
        )}
        quote={{
          amountIn: BigInt(
            pool.balances[0]
              .times(10 ** appData.coinMetadataMap[pool.coinTypes[0]].decimals)
              .integerValue(BigNumber.ROUND_DOWN)
              .toString(),
          ),
          amountOut: BigInt(
            pool.balances[1]
              .times(10 ** appData.coinMetadataMap[pool.coinTypes[1]].decimals)
              .integerValue(BigNumber.ROUND_DOWN)
              .toString(),
          ),
        }}
        label="Current price"
      />

      <Parameter label="Address">
        <div className="flex flex-row items-center gap-2">
          <Tooltip title={pool.id}>
            <p className="text-p2 text-foreground">{formatAddress(pool.id)}</p>
          </Tooltip>

          <div className="flex flex-row items-center gap-1">
            <CopyToClipboardButton value={pool.id} />
            <OpenUrlNewTab url={explorer.buildObjectUrl(pool.id)} />
          </div>
        </div>
      </Parameter>
    </div>
  );
}
