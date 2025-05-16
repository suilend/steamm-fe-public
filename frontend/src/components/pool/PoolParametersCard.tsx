import { useEffect, useRef, useState } from "react";

import BigNumber from "bignumber.js";

import {
  formatAddress,
  formatToken,
  formatUsd,
  getToken,
} from "@suilend/frontend-sui";
import { useSettingsContext } from "@suilend/frontend-sui-next";
import { QuoterId, SwapQuote } from "@suilend/steamm-sdk";
import { OracleQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm/structs";
import { OracleQuoterV2 } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm_v2/structs";
import { Pool } from "@suilend/steamm-sdk/_codegen/_generated/steamm/pool/structs";

import BreakdownRow from "@/components/BreakdownRow";
import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import ExchangeRateParameter from "@/components/ExchangeRateParameter";
import OpenUrlNewTab from "@/components/OpenUrlNewTab";
import Parameter from "@/components/Parameter";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { formatAmplifier, formatFeeTier } from "@/lib/format";
import { AMPLIFIER_TOOLTIP } from "@/lib/pools";
import { cn, hoverUnderlineClassName } from "@/lib/utils";

export default function PoolParametersCard() {
  const { explorer } = useSettingsContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { pool } = usePoolContext();

  // Current price
  const getOraclePrice = (index: number): BigNumber => {
    if (![QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(pool.quoterId))
      throw new Error(
        `Pool with id ${pool.id} has quoterId ${pool.quoterId} - expected ${QuoterId.ORACLE} or ${QuoterId.ORACLE_V2}`,
      );

    const quoter = pool.pool.quoter as OracleQuoter | OracleQuoterV2;
    const oracleIndex = +(
      index === 0 ? quoter.oracleIndexA : quoter.oracleIndexB
    ).toString();

    return appData.oracleIndexOracleInfoPriceMap[oracleIndex].price;
  };

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
            new BigNumber(getOraclePrice(0).div(getOraclePrice(1)))
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
        {pool.coinTypes.map((coinType, index) => {
          const accruedLpFees = new BigNumber(
            pool.pool.tradingData[
              index === 0 ? "poolFeesA" : "poolFeesB"
            ].toString(),
          ).div(10 ** appData.coinMetadataMap[coinType].decimals);

          return (
            <div
              key={coinType}
              className="flex w-full flex-row items-center gap-2"
            >
              <TokenLogo
                token={getToken(coinType, appData.coinMetadataMap[coinType])}
                size={16}
              />

              <Tooltip
                content={
                  <div className="flex flex-col gap-2">
                    {/* Total */}
                    <div className="flex flex-row items-center justify-between gap-4">
                      <p className="text-p1 text-foreground">Total</p>

                      <div className="flex flex-row items-center gap-2">
                        <p className="text-p1 font-bold text-foreground">
                          {formatToken(pool.balances[index], {
                            exact: false,
                          })}{" "}
                          {appData.coinMetadataMap[coinType].symbol}
                        </p>
                        <p className="text-p2 font-medium text-secondary-foreground">
                          {formatUsd(
                            new BigNumber(pool.balances[index]).times(
                              pool.prices[index],
                            ),
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Accrued LP fees */}
                    <BreakdownRow
                      valueClassName="gap-2 items-center flex-row"
                      isLast
                      value={
                        <>
                          <span>
                            {formatToken(accruedLpFees, { exact: false })}{" "}
                            {appData.coinMetadataMap[coinType].symbol}
                          </span>
                          <span className="text-secondary-foreground">
                            {formatUsd(
                              new BigNumber(accruedLpFees).times(
                                pool.prices[index],
                              ),
                            )}
                          </span>
                        </>
                      }
                    >
                      Accrued LP fees
                    </BreakdownRow>
                  </div>
                }
                contentProps={{
                  style: { maxWidth: 350 },
                }}
              >
                <p
                  className={cn(
                    "text-p2 text-foreground decoration-foreground/50",
                    hoverUnderlineClassName,
                  )}
                >
                  {formatToken(pool.balances[index], { exact: false })}{" "}
                  {appData.coinMetadataMap[coinType].symbol}
                </p>
              </Tooltip>

              <Tooltip
                title={formatUsd(
                  new BigNumber(pool.balances[index]).times(pool.prices[index]),
                  { exact: true },
                )}
              >
                <p className="text-p2 text-secondary-foreground">
                  {formatUsd(
                    new BigNumber(pool.balances[index]).times(
                      pool.prices[index],
                    ),
                  )}
                </p>
              </Tooltip>

              <div className="flex flex-row items-center gap-1">
                <CopyToClipboardButton value={coinType} />
                <OpenUrlNewTab url={explorer.buildCoinUrl(coinType)} />
              </div>
            </div>
          );
        })}
      </Parameter>

      {pool.quoterId === QuoterId.ORACLE_V2 && (
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
      )}

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
        inPrice={pool.prices[0]}
        outToken={getToken(
          pool.coinTypes[1],
          appData.coinMetadataMap[pool.coinTypes[1]],
        )}
        outPrice={pool.prices[1]}
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
