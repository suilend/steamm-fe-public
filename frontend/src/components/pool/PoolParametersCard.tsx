import { useEffect, useRef, useState } from "react";

import BigNumber from "bignumber.js";

import {
  formatAddress,
  formatPercent,
  formatToken,
  getToken,
} from "@suilend/frontend-sui";
import { useSettingsContext } from "@suilend/frontend-sui-next";
import { SwapQuote } from "@suilend/steamm-sdk";
import { OracleQuoterV2 } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm_v2/structs";
import { Pool } from "@suilend/steamm-sdk/_codegen/_generated/steamm/pool/structs";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import ExchangeRateParameter from "@/components/ExchangeRateParameter";
import OpenUrlNewTab from "@/components/OpenUrlNewTab";
import Parameter from "@/components/Parameter";
import SuilendLogo from "@/components/SuilendLogo";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { formatAmplifier, formatFeeTier } from "@/lib/format";
import { AMPLIFIER_TOOLTIP } from "@/lib/pools";
import { QuoterId } from "@/lib/types";
import { cn, hoverUnderlineClassName } from "@/lib/utils";

export default function PoolParametersCard() {
  const { explorer } = useSettingsContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { pool } = usePoolContext();

  // Current price
  const [quoteMap, setQuoteMap] = useState<Record<string, SwapQuote>>({});
  const quote =
    pool.quoterId === QuoterId.CPMM
      ? quoteMap[pool.id]
      : ({
          a2b: true,
          amountIn: BigInt(
            new BigNumber(1)
              .times(10 ** appData.coinMetadataMap[pool.coinTypes[0]].decimals)
              .integerValue(BigNumber.ROUND_DOWN)
              .toString(),
          ),
          amountOut: BigInt(
            new BigNumber(
              appData.coinTypeOracleInfoPriceMap[pool.coinTypes[0]].price.div(
                appData.coinTypeOracleInfoPriceMap[pool.coinTypes[1]].price,
              ),
            )
              .times(10 ** appData.coinMetadataMap[pool.coinTypes[1]].decimals)
              .integerValue(BigNumber.ROUND_DOWN)
              .toString(),
          ),
          outputFees: {
            poolFees: BigInt(0),
            protocolFees: BigInt(0),
          },
        } as SwapQuote);

  const isFetchingQuoteMapRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (pool.quoterId !== QuoterId.CPMM) return;

    if (isFetchingQuoteMapRef.current[pool.id]) return;
    isFetchingQuoteMapRef.current = {
      ...isFetchingQuoteMapRef.current,
      [pool.id]: true,
    };

    (async () => {
      try {
        const submitAmountA = new BigNumber(
          new BigNumber(1).div(pool.prices[0]),
        ) // $1 of asset A (assuming the pool is arb'd, in practice it should be very close to arb'd)
          .times(10 ** appData.coinMetadataMap[pool.coinTypes[0]].decimals)
          .integerValue(BigNumber.ROUND_DOWN)
          .toString();

        const quote = await steammClient.Pool.quoteSwap({
          a2b: true,
          amountIn: BigInt(submitAmountA),
          poolInfo: pool.poolInfo,
          bankInfoA: appData.bankMap[pool.coinTypes[0]].bankInfo,
          bankInfoB: appData.bankMap[pool.coinTypes[1]].bankInfo,
        });
        setQuoteMap((prev) => ({ ...prev, [pool.id]: quote }));
      } catch (err) {
        console.error(err);
      }
    })();
  }, [
    pool.quoterId,
    pool.id,
    pool.prices,
    appData.coinMetadataMap,
    pool.coinTypes,
    steammClient.Pool,
    pool.poolInfo,
    appData.bankMap,
  ]);

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

            {appData.suilend.mainMarket.reserveMap[coinType] && (
              <Tag
                labelClassName={cn(
                  "text-foreground decoration-foreground/50",
                  hoverUnderlineClassName,
                )}
                tooltip={`${formatPercent(appData.bankMap[coinType].utilizationPercent)} of deposited ${appData.coinMetadataMap[coinType].symbol} is earning ${formatPercent(appData.bankMap[coinType].suilendDepositAprPercent)} APR on Suilend`}
                startDecorator={<SuilendLogo size={12} />}
              >
                {formatPercent(
                  appData.bankMap[coinType].suilendDepositAprPercent
                    .times(appData.bankMap[coinType].utilizationPercent)
                    .div(100),
                )}{" "}
                APR
              </Tag>
            )}
          </div>
        ))}
      </Parameter>

      <Parameter label="Amplifier" labelTooltip={AMPLIFIER_TOOLTIP}>
        <p className="text-p2 text-foreground">
          {formatAmplifier(
            new BigNumber(
              (
                pool.pool as Pool<string, string, OracleQuoterV2, string>
              ).quoter.amp.toString(),
            ),
          )}
        </p>
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
        quote={quote}
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
