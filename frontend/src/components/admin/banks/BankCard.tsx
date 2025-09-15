import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import { Loader2 } from "lucide-react";

import {
  ParsedObligation,
  RewardsMap,
  SuilendClient,
  formatRewards,
  parseObligation,
} from "@suilend/sdk";
import * as simulate from "@suilend/sdk/utils/simulate";
import { ADMIN_ADDRESS, ParsedBank } from "@suilend/steamm-sdk";
import { PUBLISHED_AT } from "@suilend/steamm-sdk/_codegen/_generated/steamm";
import {
  NORMALIZED_IKA_COINTYPE,
  formatPercent,
  formatPoints,
  formatToken,
  formatUsd,
  getToken,
  isSendPoints,
  isSteammPoints,
} from "@suilend/sui-fe";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import Divider from "@/components/Divider";
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
import { patchBank, rebalanceBanks } from "@/lib/banks";
import { formatPercentInputValue, formatTextInputValue } from "@/lib/format";
import { getAvgPoolPrice } from "@/lib/pools";
import { showSuccessTxnToast } from "@/lib/toasts";
import { cn } from "@/lib/utils";

interface BankCardProps {
  bank: ParsedBank;
  bankProtocolFees: BigNumber | null | undefined;
  fetchBankProtocolFees: () => void;
}

export default function BankCard({
  bank,
  bankProtocolFees,
  fetchBankProtocolFees,
}: BankCardProps) {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { refresh } = useUserContext();

  // Obligation
  const [obligation, setObligation] = useState<
    ParsedObligation | null | undefined
  >(undefined);

  useEffect(() => {
    (async () => {
      const obligationId = bank.bank.lending?.obligationCap.obligationId;
      if (!obligationId) {
        setObligation(null);
        return;
      }

      const obligation_ = (
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
        )[0];

      setObligation(obligation_);
    })();
  }, [
    bank.bank.lending,
    appData.suilend.mainMarket.suilendClient.lendingMarket.$typeArgs,
    suiClient,
    appData.suilend.mainMarket.refreshedRawReserves,
    appData.suilend.mainMarket.reserveMap,
  ]);

  // Price
  const price =
    appData.suilend.mainMarket.reserveMap[bank.coinType]?.price ??
    getAvgPoolPrice(appData.pools, bank.coinType);

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

      // Patch
      await patchBank(bank);
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

      // Patch
      await patchBank(bank);
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

      // Patch
      await patchBank(bank);
    } catch (err) {
      showErrorToast("Failed to rebalance bank", err as Error, undefined, true);
      console.error(err);
    } finally {
      setIsRebalancing(false);
      refresh();
    }
  };

  // Protocol fees
  const hasFetchedBankProtocolFeesRef = useRef<boolean>(false);
  useEffect(() => {
    if (hasFetchedBankProtocolFeesRef.current) return;
    hasFetchedBankProtocolFeesRef.current = true;

    fetchBankProtocolFees();
  }, [fetchBankProtocolFees]);

  // Protocol fees - crank pools
  const [isCrankingPools, setIsCrankingPools] = useState<boolean>(false);

  const crankPools = async () => {
    const pools = appData.pools.filter((p) =>
      p.coinTypes.includes(bank.coinType),
    );

    try {
      setIsCrankingPools(true);

      const transaction = new Transaction();

      for (const pool of pools) {
        transaction.moveCall({
          target: `${PUBLISHED_AT}::fee_crank::crank_fees`,
          typeArguments: [
            appData.bankMap[pool.coinTypes[0]].bankInfo.lendingMarketType,
            pool.coinTypes[0],
            pool.coinTypes[1],
            pool.poolInfo.quoterType,
            pool.lpTokenType,
            pool.bTokenTypes[0],
            pool.bTokenTypes[1],
          ],
          arguments: [
            transaction.object(pool.id),
            transaction.object(appData.bankMap[pool.coinTypes[0]].id),
            transaction.object(appData.bankMap[pool.coinTypes[1]].id),
          ],
        });
      }

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast(
        `Cranked ${pools.length} pool${pools.length > 1 ? "s" : ""}`,
        txUrl,
      );
    } catch (err) {
      showErrorToast("Failed to crank pools", err as Error, undefined, true);
      console.error(err);
    } finally {
      setIsCrankingPools(false);
      fetchBankProtocolFees();
    }
  };

  // Protocol fees - claim
  const [isClaimingProtocolFees, setIsClaimingProtocolFees] =
    useState<boolean>(false);

  const claimProtocolFees = async () => {
    try {
      setIsClaimingProtocolFees(true);

      const transaction = new Transaction();

      transaction.moveCall({
        target: `${PUBLISHED_AT}::bank::claim_fees`,
        typeArguments: [
          bank.bankInfo.lendingMarketType,
          bank.coinType,
          bank.bTokenType,
        ],
        arguments: [
          transaction.object(bank.id),
          transaction.object(bank.bankInfo.lendingMarketId),
          transaction.object(
            steammClient.sdkOptions.packages.steamm.config!.registryId,
          ),
          transaction.object(SUI_CLOCK_OBJECT_ID),
        ],
      });

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Claimed protocol fees", txUrl);
    } catch (err) {
      showErrorToast(
        "Failed to claim protocol fees",
        err as Error,
        undefined,
        true,
      );
      console.error(err);
    } finally {
      setIsClaimingProtocolFees(false);
      fetchBankProtocolFees();
    }
  };

  // Rewards
  const bankRewardsMap: RewardsMap | undefined = useMemo(() => {
    if (obligation === undefined) return undefined;
    if (obligation === null) return {};

    const rewardMap = formatRewards(
      appData.suilend.mainMarket.reserveMap,
      appData.suilend.mainMarket.rewardCoinMetadataMap,
      appData.suilend.mainMarket.rewardPriceMap,
      [obligation],
    );

    const result: RewardsMap = {};

    Object.values(rewardMap).flatMap((rewards) =>
      [...rewards.deposit].forEach((r) => {
        if (r.stats.reserve.coinType !== bank.coinType) return; // Will be autoclaimed and deposited, no need to claim here

        if (!r.obligationClaims[obligation.id]) return;
        if (r.obligationClaims[obligation.id].claimableAmount.eq(0)) return;

        const minAmount = 10 ** (-1 * r.stats.mintDecimals);
        if (r.obligationClaims[obligation.id].claimableAmount.lt(minAmount))
          return;

        if (!result[r.stats.rewardCoinType])
          result[r.stats.rewardCoinType] = {
            amount: new BigNumber(0),
            rawAmount: new BigNumber(0),
            rewards: [],
          };
        result[r.stats.rewardCoinType].amount = result[
          r.stats.rewardCoinType
        ].amount.plus(r.obligationClaims[obligation.id].claimableAmount);
        result[r.stats.rewardCoinType].rawAmount = result[
          r.stats.rewardCoinType
        ].amount
          .times(10 ** appData.coinMetadataMap[r.stats.rewardCoinType].decimals)
          .integerValue(BigNumber.ROUND_DOWN);
        result[r.stats.rewardCoinType].rewards.push(r);
      }),
    );

    const sortedResult = Object.fromEntries(
      Object.entries(result).sort((a, b) => (a[0] < b[0] ? 1 : -1)),
    );

    return sortedResult;
  }, [
    obligation,
    appData.suilend.mainMarket.reserveMap,
    appData.suilend.mainMarket.rewardCoinMetadataMap,
    appData.suilend.mainMarket.rewardPriceMap,
    bank.coinType,
    appData.coinMetadataMap,
  ]);

  const [isClaimingRewards, setIsClaimingRewards] = useState<boolean>(false);

  const claimRewards = async () => {
    if (bankRewardsMap === undefined) return;

    try {
      setIsClaimingRewards(true);

      const transaction = new Transaction();

      for (const [coinType, { rewards }] of Object.entries(bankRewardsMap)) {
        for (const reward of rewards) {
          transaction.moveCall({
            target: `${PUBLISHED_AT}::bank::claim_rewards`,
            typeArguments: [
              bank.bankInfo.lendingMarketType,
              bank.coinType,
              bank.bTokenType,
              coinType,
            ],
            arguments: [
              transaction.object(bank.id),
              transaction.object(bank.bankInfo.lendingMarketId),
              transaction.object(
                steammClient.sdkOptions.packages.steamm.config!.registryId,
              ),
              transaction.pure.u64(reward.stats.rewardIndex),
              transaction.object(SUI_CLOCK_OBJECT_ID),
            ],
          });
        }
      }

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Claimed rewards", txUrl);
    } catch (err) {
      showErrorToast("Failed to claim rewards", err as Error, undefined, true);
      console.error(err);
    } finally {
      setIsClaimingRewards(false);
      refresh();
    }
  };

  // Deposits
  const [bankAutoclaimedRewardsMap, bankDepositsMap] = useMemo(() => {
    if (obligation === undefined) return [undefined, undefined];
    if (obligation === null) return [{}, {}];

    const autoclaimedRewardsResult: Record<string, { amount: BigNumber }> = {};
    const depositsResult: Record<string, BigNumber> = {};

    for (const deposit of obligation.deposits) {
      if (bank.coinType !== deposit.coinType)
        autoclaimedRewardsResult[deposit.coinType] = {
          amount: deposit.depositedAmount,
        };
      else {
        const x = deposit.depositedCtokenAmount;
        const y = new BigNumber(bank.bank.lending?.ctokens.toString() || 0);
        const autoclaimedCtokenAmount = x.minus(y);

        if (autoclaimedCtokenAmount.gt(0)) {
          autoclaimedRewardsResult[deposit.coinType] = {
            amount: deposit.depositedAmount.times(
              autoclaimedCtokenAmount.div(x),
            ),
          };
          depositsResult[deposit.coinType] = deposit.depositedAmount.times(
            y.div(x),
          );
        } else {
          depositsResult[deposit.coinType] = deposit.depositedAmount;
        }
      }
    }

    const sortedAutoclaimedRewardsResult = Object.fromEntries(
      Object.entries(autoclaimedRewardsResult).sort((a, b) =>
        a[0] < b[0] ? 1 : -1,
      ),
    );

    return [sortedAutoclaimedRewardsResult, depositsResult];
  }, [obligation, bank.coinType, bank.bank.lending?.ctokens]);

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

        {/* Protocol fees */}
        <Parameter className="items-start" label="Protocol fees" isHorizontal>
          <div className="flex flex-col items-end gap-1.5">
            {bankProtocolFees === undefined ? (
              <Skeleton className="h-[21px] w-16" />
            ) : (
              <div className="flex flex-row items-center gap-2">
                <Tooltip
                  title={
                    bankProtocolFees !== null
                      ? `${formatToken(bankProtocolFees, {
                          dp: appData.coinMetadataMap[bank.coinType].decimals,
                        })} ${appData.coinMetadataMap[bank.coinType].symbol}`
                      : undefined
                  }
                >
                  <p className="text-p2 text-foreground">
                    {bankProtocolFees !== null ? (
                      <>
                        {formatToken(bankProtocolFees, { exact: false })}{" "}
                        {appData.coinMetadataMap[bank.coinType].symbol}
                      </>
                    ) : (
                      "--"
                    )}
                  </p>
                </Tooltip>

                {price === undefined ? (
                  <Skeleton className="h-[21px] w-12" />
                ) : (
                  <Tooltip
                    title={
                      bankProtocolFees !== null
                        ? formatUsd(bankProtocolFees.times(price), {
                            exact: true,
                          })
                        : undefined
                    }
                  >
                    <p className="text-p2 text-secondary-foreground">
                      {bankProtocolFees !== null
                        ? formatUsd(bankProtocolFees.times(price))
                        : "--"}
                    </p>
                  </Tooltip>
                )}
              </div>
            )}

            <div className="flex flex-row items-center gap-2">
              <button
                className="group flex h-6 w-[81px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
                disabled={isCrankingPools}
                onClick={crankPools}
              >
                {isCrankingPools ? (
                  <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
                ) : (
                  <p className="text-p3 text-button-2-foreground">
                    Crank pools
                  </p>
                )}
              </button>

              <button
                className="group flex h-6 w-[48px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
                disabled={
                  bankProtocolFees === undefined ||
                  bankProtocolFees === null ||
                  isClaimingProtocolFees
                }
                onClick={claimProtocolFees}
              >
                {isClaimingProtocolFees ? (
                  <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
                ) : (
                  <p className="text-p3 text-button-2-foreground">Claim</p>
                )}
              </button>
            </div>
          </div>
        </Parameter>

        {/* Rewards */}
        <Parameter className="items-start" label="Rewards" isHorizontal>
          <div className="flex flex-col items-end gap-1.5">
            {bankRewardsMap === undefined ||
            bankAutoclaimedRewardsMap === undefined ? (
              <Skeleton className="h-[21px] w-16" />
            ) : Object.keys(bankRewardsMap).length > 0 ||
              Object.keys(bankAutoclaimedRewardsMap).length > 0 ? (
              <Tooltip
                content={
                  <div className="flex flex-col gap-2">
                    {[
                      Object.entries(bankRewardsMap),
                      ...(Object.entries(bankAutoclaimedRewardsMap).length > 0
                        ? [Object.entries(bankAutoclaimedRewardsMap)]
                        : []),
                    ].map((entries, index, arr) => (
                      <Fragment key={index}>
                        <div className="flex flex-col gap-1">
                          <p className="text-p2 text-secondary-foreground">
                            {index === 0
                              ? "Unclaimed rewards"
                              : "Autoclaimed rewards"}
                          </p>
                          {entries.map(([coinType, { amount }]) => (
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
                                {isSendPoints(coinType) ||
                                isSteammPoints(coinType)
                                  ? formatPoints(amount, {
                                      dp: appData.coinMetadataMap[coinType]
                                        .decimals,
                                    })
                                  : formatToken(amount, {
                                      dp: appData.coinMetadataMap[coinType]
                                        .decimals,
                                    })}{" "}
                                {appData.coinMetadataMap[coinType].symbol}
                              </p>

                              {!isSendPoints(coinType) &&
                                !isSteammPoints(coinType) && (
                                  <p className="text-p2 text-secondary-foreground">
                                    {formatUsd(
                                      amount.times(
                                        appData.suilend.mainMarket
                                          .rewardPriceMap[coinType] ?? 0,
                                      ),
                                    )}
                                  </p>
                                )}
                            </div>
                          ))}
                        </div>

                        {index !== arr.length - 1 && <Divider />}
                      </Fragment>
                    ))}
                  </div>
                }
              >
                <div className="flex h-[21px] w-max flex-row items-center gap-2">
                  {Object.keys(bankRewardsMap).length > 0 && (
                    <TokenLogos
                      coinTypes={Object.keys(bankRewardsMap)}
                      size={16}
                    />
                  )}
                  {Object.keys(bankRewardsMap).length > 0 &&
                    Object.keys(bankAutoclaimedRewardsMap).length > 0 && (
                      <div className="h-4 w-px bg-border" />
                    )}
                  {Object.keys(bankAutoclaimedRewardsMap).length > 0 && (
                    <TokenLogos
                      coinTypes={Object.keys(bankAutoclaimedRewardsMap)}
                      size={16}
                    />
                  )}
                </div>
              </Tooltip>
            ) : (
              <p className="text-p2 text-foreground">--</p>
            )}

            <button
              className="group flex h-6 w-[48px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
              disabled={
                bankRewardsMap === undefined ||
                bankAutoclaimedRewardsMap === undefined ||
                !(
                  Object.keys(bankRewardsMap).length > 0 ||
                  Object.keys(bankAutoclaimedRewardsMap).length > 0
                ) ||
                isClaimingRewards
              }
              onClick={claimRewards}
            >
              {isClaimingRewards ? (
                <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
              ) : (
                <p className="text-p3 text-button-2-foreground">Claim</p>
              )}
            </button>
          </div>
        </Parameter>

        {/* bToken exchange rate */}
        <Parameter
          label={`1 b${appData.coinMetadataMap[bank.coinType].symbol} ≈`}
          isHorizontal
        >
          <p className="text-p2 text-foreground">
            {bank.bTokenExchangeRate.toFixed(12)}{" "}
            {appData.coinMetadataMap[bank.coinType].symbol}
          </p>
        </Parameter>
      </div>
    </div>
  );
}
