import { useEffect, useMemo, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { Loader2 } from "lucide-react";

import {
  formatPercent,
  formatPoints,
  formatToken,
  formatUsd,
  getToken,
  isSendPoints,
} from "@suilend/frontend-sui";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import {
  ParsedObligation,
  Side,
  SuilendClient,
  formatRewards,
  parseObligation,
} from "@suilend/sdk";
import * as simulate from "@suilend/sdk/utils/simulate";
import { ADMIN_ADDRESS } from "@suilend/steamm-sdk";

import Parameter from "@/components/Parameter";
import PercentInput from "@/components/PercentInput";
import Tag from "@/components/Tag";
import TextInput from "@/components/TextInput";
import TokenLogo from "@/components/TokenLogo";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { getBankPrice, rebalanceBanks } from "@/lib/banks";
import { formatPercentInputValue, formatTextInputValue } from "@/lib/format";
import { showSuccessTxnToast } from "@/lib/toasts";
import { ParsedBank } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BankCardProps {
  bank: ParsedBank;
}

export default function BankCard({ bank }: BankCardProps) {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { refresh } = useUserContext();

  // Price
  const price = getBankPrice(appData.pools, bank);

  // Initialize/set target util. and util. buffer
  const [targetUtilizationPercent, setTargetUtilizationPercent] =
    useState<string>(
      !!bank.bank.lending
        ? formatPercentInputValue(
            `${bank.bank.lending.targetUtilisationBps / 100}`,
            2,
          )
        : "",
    );

  const onTargetUtilizationPercentChange = async (_value: string) => {
    console.log("onTargetUtilizationPercentChange - _value:", _value);

    const formattedValue = formatPercentInputValue(_value, 2);
    setTargetUtilizationPercent(formattedValue);
  };

  const [utilizationBufferPercent, setUtilizationBufferPercent] =
    useState<string>(
      !!bank.bank.lending
        ? formatPercentInputValue(
            (bank.bank.lending.utilisationBufferBps / 100).toFixed(3),
            2,
          )
        : "",
    );

  const onUtilizationBufferPercentChange = async (_value: string) => {
    console.log("onUtilizationBufferPercentChange - _value:", _value);

    const formattedValue = formatPercentInputValue(_value, 2);
    setUtilizationBufferPercent(formattedValue);
  };

  const [
    isSettingTargetUtilizationPercent,
    setIsSettingTargetUtilizationPercent,
  ] = useState<boolean>(false);

  const submitTargetUtilizationPercent = async () => {
    if (address !== ADMIN_ADDRESS) return;

    try {
      setIsSettingTargetUtilizationPercent(true);

      const transaction = new Transaction();

      if (!bank.bank.lending) {
        await steammClient.Bank.initLending(transaction, {
          bankId: bank.id,
          targetUtilisationBps: +new BigNumber(targetUtilizationPercent)
            .times(100)
            .toFixed(0),
          utilisationBufferBps: +new BigNumber(utilizationBufferPercent)
            .times(100)
            .toFixed(0),
        });
      } else {
        await steammClient.Bank.setUtilisation(transaction, {
          bankId: bank.id,
          targetUtilisationBps: +new BigNumber(targetUtilizationPercent)
            .times(100)
            .toFixed(0),
          utilisationBufferBps: +new BigNumber(utilizationBufferPercent)
            .times(100)
            .toFixed(0),
        });
      }
      rebalanceBanks([bank], steammClient, transaction);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast(
        !bank.bank.lending
          ? `Initialized ${appData.coinMetadataMap[bank.coinType].symbol} bank`
          : `Set ${appData.coinMetadataMap[bank.coinType].symbol} bank target util. to ${targetUtilizationPercent}% and util. buffer to ${utilizationBufferPercent}%`,
        txUrl,
        {
          description: !bank.bank.lending
            ? `Target util.: ${targetUtilizationPercent}%, util. buffer: ${utilizationBufferPercent}%`
            : undefined,
        },
      );
    } catch (err) {
      showErrorToast(
        !bank.bank.lending
          ? `Failed to initialize ${appData.coinMetadataMap[bank.coinType].symbol} bank`
          : `Failed to set ${appData.coinMetadataMap[bank.coinType].symbol} bank target util./util. buffer`,
        err as Error,
        undefined,
        true,
      );
      console.error(err);
    } finally {
      setIsSettingTargetUtilizationPercent(false);
      refresh();
    }
  };

  // Min. token block size
  const [minTokenBlockSize, setMinTokenBlockSize] = useState<string>(
    formatTextInputValue(
      new BigNumber(bank.bank.minTokenBlockSize.toString())
        .div(10 ** appData.coinMetadataMap[bank.coinType].decimals)
        .toFixed(
          appData.coinMetadataMap[bank.coinType].decimals,
          BigNumber.ROUND_DOWN,
        ),
      9,
    ),
  );

  const onMinTokenBlockSizeChange = (_value: string) => {
    console.log("onMinTokenBlockSizeChange - _value:", _value);

    const formattedValue = formatTextInputValue(
      _value,
      appData.coinMetadataMap[bank.coinType].decimals,
    );
    setMinTokenBlockSize(formattedValue);
  };

  const [isSettingMinTokenBlockSize, setIsSettingMinTokenBlockSize] =
    useState<boolean>(false);

  const submitMinTokenBlockSize = async () => {
    if (address !== ADMIN_ADDRESS) return;

    try {
      setIsSettingMinTokenBlockSize(true);

      const transaction = new Transaction();

      await steammClient.Bank.setMinTokenBlockSize(transaction, {
        bankId: bank.id,
        minTokenBlockSize: +new BigNumber(minTokenBlockSize)
          .times(10 ** appData.coinMetadataMap[bank.coinType].decimals)
          .integerValue(BigNumber.ROUND_DOWN)
          .toString(),
      });
      rebalanceBanks([bank], steammClient, transaction);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast(
        `Set ${appData.coinMetadataMap[bank.coinType].symbol} bank min. token block size to ${minTokenBlockSize}`,
        txUrl,
      );
    } catch (err) {
      showErrorToast(
        "Failed to set min. token block size",
        err as Error,
        undefined,
        true,
      );
      console.error(err);
    } finally {
      setIsSettingMinTokenBlockSize(false);
      refresh();
    }
  };

  // Rebalance
  const [isRebalancing, setIsRebalancing] = useState<boolean>(false);

  const rebalance = async () => {
    try {
      setIsRebalancing(true);

      const transaction = new Transaction();

      rebalanceBanks([bank], steammClient, transaction);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast(
        `Rebalanced ${appData.coinMetadataMap[bank.coinType].symbol} bank`,
        txUrl,
      );
    } catch (err) {
      showErrorToast("Failed to rebalance bank", err as Error, undefined, true);
      console.error(err);
    } finally {
      setIsRebalancing(false);
      refresh();
    }
  };

  // Rewards
  const [obligations, setObligations] = useState<
    ParsedObligation[] | undefined
  >(undefined);

  useEffect(() => {
    (async () => {
      const obligationId = bank.bank.lending?.obligationCap.obligationId;
      if (!obligationId) {
        setObligations([]);
        return;
      }

      const obligations_ = (
        await Promise.all([
          SuilendClient.getObligation(
            obligationId,
            appData.suilend.mainMarket.suilendClient.lendingMarket.$typeArgs,
            suiClient,
          ),
        ])
      )
        .map((rawObligation) =>
          simulate.refreshObligation(
            rawObligation,
            appData.suilend.mainMarket.refreshedRawReserves,
          ),
        )
        .map((refreshedObligation) =>
          parseObligation(
            refreshedObligation,
            appData.suilend.mainMarket.reserveMap,
          ),
        )
        .sort((a, b) => +b.netValueUsd.minus(a.netValueUsd));

      setObligations(obligations_);
    })();
  }, [
    bank.bank.lending,
    appData.suilend.mainMarket.suilendClient.lendingMarket.$typeArgs,
    suiClient,
    appData.suilend.mainMarket.refreshedRawReserves,
    appData.suilend.mainMarket.reserveMap,
  ]);

  const bankRewardMap: Record<string, BigNumber> | undefined = useMemo(() => {
    if (obligations === undefined) return undefined;

    const rewardMap = formatRewards(
      appData.suilend.mainMarket.reserveMap,
      appData.suilend.mainMarket.rewardCoinMetadataMap,
      appData.suilend.mainMarket.rewardPriceMap,
      obligations,
    );

    return (rewardMap[bank.coinType]?.[Side.DEPOSIT] ?? []).reduce(
      (acc, r) => {
        for (let i = 0; i < obligations.length; i++) {
          const obligation = obligations[i];

          const minAmount = 10 ** (-1 * r.stats.mintDecimals);
          if (
            !r.obligationClaims[obligation.id] ||
            r.obligationClaims[obligation.id].claimableAmount.lt(minAmount) // This also covers the 0 case
          )
            continue;

          acc[r.stats.rewardCoinType] = new BigNumber(
            acc[r.stats.rewardCoinType] ?? 0,
          ).plus(r.obligationClaims[obligation.id].claimableAmount);
        }

        return acc;
      },
      {} as Record<string, BigNumber>,
    );
  }, [
    obligations,
    appData.suilend.mainMarket.reserveMap,
    appData.suilend.mainMarket.rewardCoinMetadataMap,
    appData.suilend.mainMarket.rewardPriceMap,
    bank.coinType,
  ]);

  const bankClaimableRewardsMap: Record<string, BigNumber> | undefined =
    useMemo(
      () =>
        bankRewardMap === undefined
          ? undefined
          : Object.fromEntries(
              Object.entries(bankRewardMap).filter(
                ([coinType, amount]) => !isSendPoints(coinType),
              ),
            ),
      [bankRewardMap],
    );
  const bankPointsMap: Record<string, BigNumber> | undefined = useMemo(
    () =>
      bankRewardMap === undefined
        ? undefined
        : Object.fromEntries(
            Object.entries(bankRewardMap).filter(([coinType, amount]) =>
              isSendPoints(coinType),
            ),
          ),
    [bankRewardMap],
  );

  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-md border p-4",
        !!appData.suilend.mainMarket.reserveMap[bank.coinType] &&
          !bank.bank.lending &&
          "border-warning",
      )}
    >
      {/* Top */}
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          <TokenLogo
            token={getToken(
              bank.coinType,
              appData.coinMetadataMap[bank.coinType],
            )}
            size={24}
          />
          <p className="text-h3 text-foreground">
            {appData.coinMetadataMap[bank.coinType].symbol}
          </p>
        </div>

        {!!appData.suilend.mainMarket.reserveMap[bank.coinType] &&
          !bank.bank.lending && (
            <Tag className="bg-warning/10" labelClassName="text-warning">
              Not initialized
            </Tag>
          )}
      </div>

      <div className="flex w-full flex-col gap-6">
        {/* Initialize/update target util. and util. buffer */}
        <div className="flex w-full flex-col items-end gap-2">
          <Parameter
            labelContainerClassName="flex-1 items-center h-8"
            label="Target util."
            isHorizontal
          >
            <div className="flex-1">
              <PercentInput
                className="h-8"
                placeholder="80.00"
                value={targetUtilizationPercent}
                onChange={onTargetUtilizationPercentChange}
              />
            </div>
          </Parameter>

          <Parameter
            labelContainerClassName="flex-1 items-center h-8"
            label="Util. buffer"
            isHorizontal
          >
            <div className="flex-1">
              <PercentInput
                className="h-8"
                placeholder="10.00"
                value={utilizationBufferPercent}
                onChange={onUtilizationBufferPercentChange}
              />
            </div>
          </Parameter>

          <button
            className={cn(
              "group flex h-6 flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50",
              !bank.bank.lending ? "w-[60px]" : "w-[56px]",
            )}
            disabled={
              address !== ADMIN_ADDRESS ||
              !appData.suilend.mainMarket.reserveMap[bank.coinType] ||
              isSettingTargetUtilizationPercent ||
              (!bank.bank.lending &&
                +targetUtilizationPercent === 0 &&
                +utilizationBufferPercent === 0) ||
              (!!bank.bank.lending &&
                bank.bank.lending.targetUtilisationBps / 100 ===
                  +targetUtilizationPercent &&
                bank.bank.lending.utilisationBufferBps / 100 ===
                  +utilizationBufferPercent)
            }
            onClick={() => submitTargetUtilizationPercent()}
          >
            {isSettingTargetUtilizationPercent ? (
              <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
            ) : (
              <p className="text-p3 text-button-2-foreground">
                {!bank.bank.lending ? "Initialize" : "Update"}
              </p>
            )}
          </button>
        </div>

        {/* Min. token block size */}
        <div className="flex w-full flex-col items-end gap-2">
          <Parameter
            labelContainerClassName="flex-1 items-center h-8"
            label="Min. token block size"
            isHorizontal
          >
            <div className="flex-1">
              <TextInput
                className="h-8"
                value={minTokenBlockSize}
                onChange={onMinTokenBlockSizeChange}
              />
            </div>
          </Parameter>

          <button
            className="group flex h-6 w-[56px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
            disabled={
              address !== ADMIN_ADDRESS ||
              !bank.bank.lending ||
              isSettingMinTokenBlockSize ||
              +minTokenBlockSize === 0 ||
              +new BigNumber(bank.bank.minTokenBlockSize.toString())
                .div(10 ** appData.coinMetadataMap[bank.coinType].decimals)
                .toFixed(
                  appData.coinMetadataMap[bank.coinType].decimals,
                  BigNumber.ROUND_DOWN,
                ) === +minTokenBlockSize
            }
            onClick={() => submitMinTokenBlockSize()}
          >
            {isSettingMinTokenBlockSize ? (
              <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
            ) : (
              <p className="text-p3 text-button-2-foreground">Update</p>
            )}
          </button>
        </div>

        {/* Funds and current util. */}
        <div className="flex w-full flex-col gap-2">
          <Parameter label="TVL" isHorizontal>
            <div className="flex flex-row items-center gap-2">
              <Tooltip
                title={`${formatToken(bank.totalFunds, {
                  dp: appData.coinMetadataMap[bank.coinType].decimals,
                })} ${appData.coinMetadataMap[bank.coinType].symbol}`}
              >
                <p className="text-p2 text-foreground">
                  {formatToken(bank.totalFunds, { exact: false })}{" "}
                  {appData.coinMetadataMap[bank.coinType].symbol}
                </p>
              </Tooltip>

              {price === undefined ? (
                <Skeleton className="h-[21px] w-12" />
              ) : (
                <Tooltip
                  title={formatUsd(bank.totalFunds.times(price), {
                    exact: true,
                  })}
                >
                  <p className="text-p2 text-secondary-foreground">
                    {formatUsd(bank.totalFunds.times(price))}
                  </p>
                </Tooltip>
              )}
            </div>
          </Parameter>

          <Parameter label="Liquid funds" isHorizontal>
            <div className="flex flex-row items-center gap-2">
              <Tooltip
                title={`${formatToken(bank.fundsAvailable, {
                  dp: appData.coinMetadataMap[bank.coinType].decimals,
                })} ${appData.coinMetadataMap[bank.coinType].symbol}`}
              >
                <p className="text-p2 text-foreground">
                  {formatToken(bank.fundsAvailable, { exact: false })}{" "}
                  {appData.coinMetadataMap[bank.coinType].symbol}
                </p>
              </Tooltip>

              {price === undefined ? (
                <Skeleton className="h-[21px] w-12" />
              ) : (
                <Tooltip
                  title={formatUsd(bank.fundsAvailable.times(price), {
                    exact: true,
                  })}
                >
                  <p className="text-p2 text-secondary-foreground">
                    {formatUsd(bank.fundsAvailable.times(price))}
                  </p>
                </Tooltip>
              )}
            </div>
          </Parameter>

          <Parameter label="Deployed funds" isHorizontal>
            <div className="flex flex-row items-center gap-2">
              <Tooltip
                title={`${formatToken(bank.fundsDeployed, {
                  dp: appData.coinMetadataMap[bank.coinType].decimals,
                })} ${appData.coinMetadataMap[bank.coinType].symbol}`}
              >
                <p className="text-p2 text-foreground">
                  {formatToken(bank.fundsDeployed, { exact: false })}{" "}
                  {appData.coinMetadataMap[bank.coinType].symbol}
                </p>
              </Tooltip>

              {price === undefined ? (
                <Skeleton className="h-[21px] w-12" />
              ) : (
                <Tooltip
                  title={formatUsd(bank.fundsDeployed.times(price), {
                    exact: true,
                  })}
                >
                  <p className="text-p2 text-secondary-foreground">
                    {formatUsd(bank.fundsDeployed.times(price))}
                  </p>
                </Tooltip>
              )}
            </div>
          </Parameter>

          <Parameter label="Current util." isHorizontal>
            <div className="flex flex-col items-end gap-1.5">
              <p className="text-p2 text-foreground">
                {formatPercent(bank.utilizationPercent)}
              </p>

              <button
                className="group flex h-6 w-[75px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
                disabled={!bank.bank.lending || isRebalancing}
                onClick={() => rebalance()}
              >
                {isRebalancing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
                ) : (
                  <p className="text-p3 text-button-2-foreground">Rebalance</p>
                )}
              </button>
            </div>
          </Parameter>
        </div>

        {/* Rewards */}
        <Parameter label="Rewards" isHorizontal>
          <div className="flex flex-col items-end gap-1.5">
            {bankClaimableRewardsMap === undefined ||
            bankPointsMap === undefined ? (
              <Skeleton className="h-[21px] w-16" />
            ) : Object.keys(bankClaimableRewardsMap).length > 0 ||
              Object.keys(bankPointsMap).length > 0 ? (
              <Tooltip
                content={
                  <div className="flex flex-col gap-1">
                    {Object.entries(bankPointsMap).map(([coinType, amount]) => (
                      <div
                        key={coinType}
                        className="flex flex-row items-center gap-2"
                      >
                        <TokenLogo
                          token={getToken(
                            coinType,
                            appData.coinMetadataMap[coinType],
                          )}
                          size={16}
                        />
                        <p className="text-p2 text-foreground">
                          {formatPoints(amount, {
                            dp: appData.coinMetadataMap[coinType].decimals,
                          })}{" "}
                          {appData.coinMetadataMap[coinType].symbol}
                        </p>
                      </div>
                    ))}
                    {Object.entries(bankClaimableRewardsMap).map(
                      ([coinType, amount]) => (
                        <div
                          key={coinType}
                          className="flex flex-row items-center gap-2"
                        >
                          <TokenLogo
                            token={getToken(
                              coinType,
                              appData.coinMetadataMap[coinType],
                            )}
                            size={16}
                          />
                          <p className="text-p2 text-foreground">
                            {formatToken(amount, {
                              dp: appData.coinMetadataMap[coinType].decimals,
                            })}{" "}
                            {appData.coinMetadataMap[coinType].symbol}
                          </p>

                          <p className="text-p2 text-secondary-foreground">
                            {formatUsd(
                              amount.times(
                                appData.suilend.mainMarket.rewardPriceMap[
                                  coinType
                                ] ?? 0,
                              ),
                            )}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                }
              >
                <div className="flex h-[21px] w-max flex-row items-center">
                  <TokenLogos
                    coinTypes={[
                      ...Object.keys(bankPointsMap),
                      ...Object.keys(bankClaimableRewardsMap),
                    ]}
                    size={16}
                  />
                </div>
              </Tooltip>
            ) : (
              <p className="text-p2 text-foreground">--</p>
            )}

            <button
              className="group flex h-6 w-[48px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
              disabled={
                bankClaimableRewardsMap === undefined ||
                Object.keys(bankClaimableRewardsMap).length === 0 ||
                isClaiming ||
                true // TODO
              }
              onClick={undefined}
            >
              {isClaiming ? (
                <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
              ) : (
                <p className="text-p3 text-button-2-foreground">Claim</p>
              )}
            </button>
          </div>
        </Parameter>
      </div>
    </div>
  );
}
