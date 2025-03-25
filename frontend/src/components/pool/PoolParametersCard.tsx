import Image from "next/image";

import BigNumber from "bignumber.js";

import {
  formatAddress,
  formatPercent,
  formatPrice,
  formatToken,
  getToken,
} from "@suilend/frontend-sui";
import { useSettingsContext } from "@suilend/frontend-sui-next";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import ExchangeRateParameter from "@/components/ExchangeRateParameter";
import OpenOnExplorerButton from "@/components/OpenOnExplorerButton";
import Parameter from "@/components/Parameter";
import SuilendLogo from "@/components/SuilendLogo";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { SUILEND_ASSETS_URL } from "@/lib/constants";
import { formatFeeTier } from "@/lib/format";
import { QuoterId } from "@/lib/types";
import { cn, hoverUnderlineClassName } from "@/lib/utils";

export default function PoolParametersCard() {
  const { explorer } = useSettingsContext();
  const { appData, banksData, poolsData } = useLoadedAppContext();
  const { pool } = usePoolContext();

  return (
    <div className="grid w-full grid-cols-1 gap-x-6 gap-y-6 rounded-md border p-5">
      <Parameter label="Assets">
        {pool.coinTypes.map((coinType, index) => {
          const coinMetadata = appData.coinMetadataMap[coinType];

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

              <div className="flex flex-row items-center gap-1">
                <CopyToClipboardButton value={coinType} />
                <OpenOnExplorerButton url={explorer.buildCoinUrl(coinType)} />
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
                    tooltip={`${formatPercent(banksData.bankMap[coinType].utilizationPercent)} of deposited ${coinMetadata.symbol} is earning ${formatPercent(banksData.bankMap[coinType].suilendDepositAprPercent)} APR on Suilend`}
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
          );
        })}
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

      {pool.quoterId === QuoterId.ORACLE && (
        <Parameter label="Oracle prices">
          {pool.coinTypes.map((coinType) => (
            <div key={coinType} className="flex flex-row items-center gap-2">
              {poolsData === undefined ? (
                <Skeleton className="h-[21px] w-16" />
              ) : (
                <p className="text-p2 text-foreground">
                  1 {appData.coinMetadataMap[coinType].symbol}
                  {" ≈ "}
                  {formatPrice(
                    poolsData.coinTypePythPriceMap[coinType] ??
                      poolsData.coinTypeSwitchboardPriceMap[coinType] ??
                      new BigNumber(0.00001),
                  )}
                </p>
              )}

              {poolsData === undefined ? (
                <Skeleton className="h-4 w-4" />
              ) : Object.keys(poolsData.coinTypePythPriceMap).includes(
                  coinType,
                ) ? (
                <Tooltip title="Powered by Pyth">
                  <Image
                    src={`${SUILEND_ASSETS_URL}/partners/Pyth.png`}
                    alt="Pyth logo"
                    width={16}
                    height={16}
                    quality={100}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="Powered by Switchboard">
                  <Image
                    src={`${SUILEND_ASSETS_URL}/partners/Switchboard.png`}
                    alt="Switchboard logo"
                    width={16}
                    height={16}
                    quality={100}
                  />
                </Tooltip>
              )}
            </div>
          ))}
        </Parameter>
      )}

      <Parameter label="Address">
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
    </div>
  );
}
