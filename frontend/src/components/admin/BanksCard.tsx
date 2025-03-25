import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { Loader2 } from "lucide-react";

import { formatPercent, getToken } from "@suilend/frontend-sui";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";

import Parameter from "@/components/Parameter";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { showSuccessTxnToast } from "@/lib/toasts";
import { ParsedBank } from "@/lib/types";

interface BankRowProps {
  bank: ParsedBank;
}

function BankRow({ bank }: BankRowProps) {
  const { explorer } = useSettingsContext();
  const { signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { refresh } = useUserContext();

  // Initialize
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  const initialize = async () => {
    try {
      setIsInitializing(true);

      const transaction = new Transaction();

      steammClient.Bank.initLending(transaction, {
        bankId: bank.id,
        targetUtilisationBps: 8000,
        utilisationBufferBps: 1000,
      });

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Initialized bank", txUrl);
    } catch (err) {
      showErrorToast(
        "Failed to initialize bank",
        err as Error,
        undefined,
        true,
      );
      console.error(err);
    } finally {
      setIsInitializing(false);
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

        showSuccessTxnToast("Rebalanced bank", txUrl);
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
      className="flex min-h-10 w-full flex-col gap-3 rounded-md border p-3"
    >
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          <TokenLogo
            token={getToken(
              bank.coinType,
              appData.coinMetadataMap[bank.coinType],
            )}
            size={16}
          />
          <p className="text-p1 text-foreground">
            {appData.coinMetadataMap[bank.coinType].symbol}
          </p>
        </div>

        {!!bank.bank.lending ? (
          <button
            className="group flex h-6 w-[75px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
            disabled={isRebalancing}
            onClick={() => rebalance()}
          >
            {isRebalancing ? (
              <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
            ) : (
              <p className="text-p3 text-button-2-foreground">Rebalance</p>
            )}
          </button>
        ) : (
          <Tooltip
            title={
              !appData.mainMarket.reserveMap[bank.coinType]
                ? "No Suilend reserve"
                : undefined
            }
          >
            <div className="w-max">
              <button
                className="group flex h-6 w-[60px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
                disabled={
                  isInitializing ||
                  !appData.mainMarket.reserveMap[bank.coinType]
                }
                onClick={() => initialize()}
              >
                {isInitializing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
                ) : (
                  <p className="text-p3 text-button-2-foreground">Initialize</p>
                )}
              </button>
            </div>
          </Tooltip>
        )}
      </div>

      {!!bank.bank.lending && (
        <div className="flex w-full flex-col gap-2">
          <Parameter label="Target / buffer" isHorizontal>
            {formatPercent(
              new BigNumber(bank.bank.lending.targetUtilisationBps / 100),
            )}
            {" / "}
            {formatPercent(
              new BigNumber(bank.bank.lending.utilisationBufferBps / 100),
            )}
          </Parameter>

          <Parameter label="Current util." isHorizontal>
            {formatPercent(bank.utilizationPercent)}
          </Parameter>
        </div>
      )}
    </div>
  );
}

export default function BanksCard() {
  const { banksData } = useLoadedAppContext();

  return (
    <div className="flex w-full flex-col gap-4 rounded-md border p-5">
      <p className="text-h3 text-foreground">Banks</p>

      <div className="flex flex-col gap-1">
        {banksData === undefined
          ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[50px] w-full" />
            ))
          : banksData.banks.map((bank) => (
              <BankRow key={bank.id} bank={bank} />
            ))}
      </div>
    </div>
  );
}
