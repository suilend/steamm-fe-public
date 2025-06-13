import BigNumber from "bignumber.js";

import { QuoterId, SwapQuote } from "@suilend/steamm-sdk";
import { OracleQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm/structs";
import { OracleQuoterV2 } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm_v2/structs";
import { Pool } from "@suilend/steamm-sdk/_codegen/_generated/steamm/pool/structs";
import {
  formatAddress,
  formatPercent,
  formatToken,
  formatUsd,
  getToken,
} from "@suilend/sui-fe";
import { useSettingsContext } from "@suilend/sui-fe-next";

import BreakdownRow from "@/components/BreakdownRow";
import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import ExchangeRateParameter from "@/components/ExchangeRateParameter";
import OpenUrlNewTab from "@/components/OpenUrlNewTab";
import Parameter from "@/components/Parameter";
import PieChart from "@/components/PieChart";
import PythLogo from "@/components/PythLogo";
import SwitchboardLogo from "@/components/SwitchboardLogo";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { formatAmplifier, formatFeeTier } from "@/lib/format";
import {
  OracleType,
  getPythOracleUrl,
  parseOraclePriceIdentifier,
} from "@/lib/oracles";
import { AMPLIFIER_TOOLTIP } from "@/lib/pools";
import { cn, hoverUnderlineClassName } from "@/lib/utils";

interface PoolParametersCardProps {
  currentPriceQuote?: SwapQuote;
}

export default function PoolParametersCard({
  currentPriceQuote,
}: PoolParametersCardProps) {
  const { explorer } = useSettingsContext();
  const { appData } = useLoadedAppContext();
  const { pool } = usePoolContext();

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-6 rounded-md border px-4 py-5 max-sm:-mx-4 sm:w-full sm:px-5">
      {/* Assets */}
      <Parameter label="Assets">
        <div className="flex flex-row items-center gap-4">
          {pool.tvlUsd.gt(0) && (
            <PieChart
              data={pool.coinTypes.map((coinType, index) => ({
                label: appData.coinMetadataMap[coinType].symbol,
                value: +pool.balances[index].times(pool.prices[index]),
              }))}
              size={40}
            />
          )}

          <div className="flex flex-col gap-1">
            {pool.coinTypes.map((coinType, index) => {
              const accruedLpFees = new BigNumber(
                pool.pool.tradingData[
                  index === 0 ? "poolFeesA" : "poolFeesB"
                ].toString(),
              ).div(10 ** appData.coinMetadataMap[coinType].decimals);

              return (
                <div
                  key={coinType}
                  className="flex w-full flex-row flex-wrap items-center gap-x-2 gap-y-1"
                >
                  {pool.tvlUsd.gt(0) && (
                    <div
                      className={cn("h-1.5 w-1.5 rounded-[1px]", {
                        "bg-jordy-blue": index === 0,
                        "bg-jordy-blue/50": index === 1,
                      })}
                    />
                  )}

                  <TokenLogo
                    token={getToken(
                      coinType,
                      appData.coinMetadataMap[coinType],
                    )}
                    size={16}
                  />

                  <Tooltip
                    content={
                      <div className="flex flex-col gap-2">
                        {/* Total */}
                        <div className="flex flex-row items-center justify-between gap-4">
                          <p className="text-p1 text-foreground">Total</p>
                          <p className="text-p1 font-bold text-foreground">
                            {formatToken(pool.balances[index], {
                              exact: false,
                            })}{" "}
                            {appData.coinMetadataMap[coinType].symbol}
                          </p>
                        </div>

                        {/* Accrued LP fees */}
                        <BreakdownRow
                          valueClassName="gap-2 items-center flex-row"
                          isLast
                          value={
                            <>
                              {formatToken(accruedLpFees, { exact: false })}{" "}
                              {appData.coinMetadataMap[coinType].symbol}
                            </>
                          }
                        >
                          Accrued LP fees
                        </BreakdownRow>
                      </div>
                    }
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
                      new BigNumber(pool.balances[index]).times(
                        pool.prices[index],
                      ),
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
                    <OpenUrlNewTab
                      url={explorer.buildCoinUrl(coinType)}
                      tooltip={`Open on ${explorer.name}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Parameter>

      {/* Oracles */}
      {[QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(pool.quoterId) && (
        <Parameter label="Oracles">
          {pool.coinTypes.map((coinType, index) => {
            const quoter = pool.pool.quoter as OracleQuoterV2 | OracleQuoter;
            const oracleIndex =
              index === 0 ? quoter.oracleIndexA : quoter.oracleIndexB;
            const oracleInfo =
              appData.oracleIndexOracleInfoPriceMap[+oracleIndex.toString()];

            const priceIdentifier = parseOraclePriceIdentifier(
              oracleInfo.oracleInfo,
            );

            return (
              <div key={coinType} className="flex flex-row items-center gap-2">
                <TokenLogo
                  token={getToken(coinType, appData.coinMetadataMap[coinType])}
                  size={16}
                />

                <div className="flex flex-row items-center gap-1.5">
                  <p className="text-p2 text-foreground">
                    {appData.pythPriceIdentifierSymbolMap[priceIdentifier]}
                  </p>

                  {oracleInfo.oracleInfo.oracleType === OracleType.PYTH ? (
                    <PythLogo size={16} />
                  ) : oracleInfo.oracleInfo.oracleType ===
                    OracleType.SWITCHBOARD ? (
                    <SwitchboardLogo size={16} />
                  ) : null}
                </div>

                {oracleInfo.oracleInfo.oracleType === OracleType.PYTH ? (
                  <OpenUrlNewTab
                    url={getPythOracleUrl(
                      appData.pythPriceIdentifierSymbolMap[priceIdentifier],
                    )}
                    tooltip="Open on Pyth"
                  />
                ) : oracleInfo.oracleInfo.oracleType ===
                  OracleType.SWITCHBOARD ? (
                  <></> // TODO
                ) : null}
              </div>
            );
          })}
        </Parameter>
      )}

      {/* Bank utilization */}
      {pool.coinTypes.some((coinType) =>
        appData.bankMap[coinType].suilendDepositAprPercent.gt(0),
      ) && (
        <Parameter label="Bank utilization">
          {pool.coinTypes
            .filter((coinType) =>
              appData.bankMap[coinType].suilendDepositAprPercent.gt(0),
            )
            .map((coinType) => (
              <div key={coinType} className="flex flex-row items-center gap-2">
                <TokenLogo
                  token={getToken(coinType, appData.coinMetadataMap[coinType])}
                  size={16}
                />

                <p className="text-p2 text-foreground">
                  {formatPercent(appData.bankMap[coinType].utilizationPercent)}{" "}
                  deposited on Suilend
                </p>
              </div>
            ))}
        </Parameter>
      )}

      {/* Amplifier */}
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

      {/* Fee tier */}
      <Parameter label="Fee tier">
        <p className="text-p2 text-foreground">
          {formatFeeTier(pool.feeTierPercent)}
        </p>
      </Parameter>

      {/* Current price */}
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
        quote={currentPriceQuote}
        label="Current price"
      />

      {/* Initial liquidity locked (1+ STEAMM-launched token and vCPMM only) */}
      {pool.coinTypes.some((coinType) =>
        appData.steammLaunchCoinTypes.includes(coinType),
      ) &&
        pool.quoterId === QuoterId.V_CPMM && (
          <Parameter label="Initial liquidity locked">
            <p className="text-p2 text-foreground">
              {pool.isInitialLpTokenBurned === null
                ? "N/A"
                : pool.isInitialLpTokenBurned
                  ? pool.initialLpTokensMinted !== null
                    ? `${formatPercent(pool.initialLpTokensMinted.div(pool.lpSupply).times(100), { dp: 0 })} of pool`
                    : "Yes"
                  : "No"}
            </p>
          </Parameter>
        )}

      {/* Address */}
      <Parameter label="Address">
        <div className="flex flex-row items-center gap-2">
          <Tooltip title={pool.id}>
            <p className="text-p2 text-foreground">{formatAddress(pool.id)}</p>
          </Tooltip>

          <div className="flex flex-row items-center gap-1">
            <CopyToClipboardButton value={pool.id} />
            <OpenUrlNewTab
              url={explorer.buildObjectUrl(pool.id)}
              tooltip={`Open on ${explorer.name}`}
            />
          </div>
        </div>
      </Parameter>
    </div>
  );
}
