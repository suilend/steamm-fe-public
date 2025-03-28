import { useMemo, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { Loader2 } from "lucide-react";

import { formatPercent, formatToken, getToken } from "@suilend/frontend-sui";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import { ADMIN_ADDRESS, Bank } from "@suilend/steamm-sdk";

import Parameter from "@/components/Parameter";
import PercentInput from "@/components/PercentInput";
import TextInput from "@/components/TextInput";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { formatPercentInputValue, formatTextInputValue } from "@/lib/format";
import { showSuccessTxnToast } from "@/lib/toasts";
import { ParsedBank } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BankRowProps {
  bank: ParsedBank;
}

function BankRow({ bank }: BankRowProps) {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { refresh } = useUserContext();

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
      new Bank(steammClient.packageInfo(), bank.bankInfo).rebalance(
        transaction,
      );

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast(
        !bank.bank.lending
          ? `Initialized ${appData.coinMetadataMap[bank.coinType].symbol} bank and set target util. to ${targetUtilizationPercent}% and util. buffer to ${utilizationBufferPercent}%`
          : `Set ${appData.coinMetadataMap[bank.coinType].symbol} bank target util. to ${targetUtilizationPercent}% and util. buffer to ${utilizationBufferPercent}%`,
        txUrl,
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
      new Bank(steammClient.packageInfo(), bank.bankInfo).rebalance(
        transaction,
      );

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

      const transactions = await steammClient.Bank.rebalance([bank.id]);
      for (const transaction of transactions) {
        const res = await signExecuteAndWaitForTransaction(transaction);
        const txUrl = explorer.buildTxUrl(res.digest);

        showSuccessTxnToast(
          `Rebalanced ${appData.coinMetadataMap[bank.coinType].symbol} bank`,
          txUrl,
        );
      }
    } catch (err) {
      showErrorToast("Failed to rebalance bank", err as Error, undefined, true);
      console.error(err);
    } finally {
      setIsRebalancing(false);
      refresh();
    }
  };

  return (
    <div
      key={bank.id}
      className="flex min-h-10 w-full flex-col gap-3 rounded-md border p-4"
    >
      {/* Top */}
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

      <div className="flex w-full flex-col gap-6">
        {/* Initialize/update target util. and util. buffer */}
        <div className="flex w-full flex-col items-end gap-2">
          <Parameter
            label="Target util."
            labelContainerClassName="flex-1 items-center h-8"
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
            label="Util. buffer"
            labelContainerClassName="flex-1 items-center h-8"
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
              !appData.mainMarket.reserveMap[bank.coinType] ||
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
            label="Min. token block size"
            labelContainerClassName="flex-1 items-center h-8"
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
          <Parameter label="Total funds" isHorizontal>
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
          </Parameter>

          <Parameter label="Liquid funds" isHorizontal>
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
          </Parameter>

          <Parameter label="Deployed funds" isHorizontal>
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
          </Parameter>

          <div className="flex w-full flex-col items-end gap-1">
            <Parameter label="Current util." isHorizontal>
              <p className="text-p2 text-foreground">
                {formatPercent(bank.utilizationPercent)}
              </p>
            </Parameter>

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
        </div>
      </div>
    </div>
  );
}

export default function BanksCard() {
  const { appData, banksData } = useLoadedAppContext();

  const sortedBanks = useMemo(() => {
    if (banksData === undefined) return undefined;

    return banksData.banks.slice().sort(
      (a, b) =>
        appData.coinMetadataMap[a.coinType].symbol.toLowerCase() <
        appData.coinMetadataMap[b.coinType].symbol.toLowerCase()
          ? -1
          : 1, // Sort by symbol (ascending)
    );
  }, [appData, banksData]);

  return (
    <div className="grid w-full grid-cols-2 gap-1">
      {sortedBanks === undefined
        ? Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[336px] w-full rounded-md" />
          ))
        : sortedBanks.map((bank) => <BankRow key={bank.id} bank={bank} />)}
    </div>
  );
}
