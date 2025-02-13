import { useRouter } from "next/router";
import { useCallback, useState } from "react";

import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { Loader2 } from "lucide-react";

import {
  SUI_GAS_MIN,
  Token,
  formatInteger,
  getToken,
  isSui,
} from "@suilend/frontend-sui";
import {
  shallowPushQuery,
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";

import CoinInput, { getCoinInputId } from "@/components/CoinInput";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { showSuccessTxnToast } from "@/lib/toasts";
import { SubmitButtonState } from "@/lib/types";
import { cn } from "@/lib/utils";

enum Action {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
  SWAP = "swap",
}

const actionNameMap: Record<Action, string> = {
  [Action.DEPOSIT]: "Deposit",
  [Action.WITHDRAW]: "Withdraw",
  [Action.SWAP]: "Swap",
};

enum QueryParams {
  ACTION = "action",
}

export default function PoolActionsCard() {
  const router = useRouter();
  const queryParams = {
    [QueryParams.ACTION]: router.query[QueryParams.ACTION] as
      | Action
      | undefined,
  };

  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData, getBalance } = useLoadedAppContext();
  const { pool } = usePoolContext();

  // Tabs
  const selectedAction =
    queryParams[QueryParams.ACTION] &&
    Object.values(Action).includes(queryParams[QueryParams.ACTION])
      ? queryParams[QueryParams.ACTION]
      : Action.DEPOSIT;
  const onSelectedActionChange = (action: Action) => {
    shallowPushQuery(router, { ...router.query, [QueryParams.ACTION]: action });
  };

  // Value
  const formatAndSetValue = useCallback(
    (_value: string, token: Token, setValue: (value: string) => void) => {
      let formattedValue;
      if (new BigNumber(_value || 0).lt(0)) formattedValue = _value;
      else if (!_value.includes(".")) formattedValue = _value;
      else {
        const [integers, decimals] = _value.split(".");
        const integersFormatted = formatInteger(
          integers !== "" ? parseInt(integers) : 0,
          false,
        );
        const decimalsFormatted = decimals.slice(
          0,
          Math.min(decimals.length, token.decimals),
        );
        formattedValue = `${integersFormatted}.${decimalsFormatted}`;
      }

      setValue(formattedValue);
    },
    [],
  );

  const [actionValueA, setActionValueA] = useState<string>("");
  const [actionValueB, setActionValueB] = useState<string>("");

  const onActionValueChange = (value: string, index: number) => {
    formatAndSetValue(
      value,
      getToken(
        pool.coinTypes[index],
        appData.poolCoinMetadataMap[pool.coinTypes[index]],
      ),
      index === 0 ? setActionValueA : setActionValueB,
    );
  };

  const onCoinBalanceClick = (index: number) => {
    const coinType = pool.coinTypes[index];
    const coinMetadata = appData.poolCoinMetadataMap[coinType];
    const balance = getBalance(coinType);

    onActionValueChange(
      (selectedAction === Action.DEPOSIT && isSui(pool.coinTypes[index])
        ? BigNumber.max(0, balance.minus(SUI_GAS_MIN))
        : balance
      ).toFixed(coinMetadata.decimals, BigNumber.ROUND_DOWN),
      index,
    );
    document.getElementById(getCoinInputId(coinType))?.focus();
  };

  // Actions - Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) return { isDisabled: true, isLoading: true };

    if (actionValueA === "" || actionValueB === "")
      return { isDisabled: true, title: "Enter an amount" };
    if (new BigNumber(actionValueA).lt(0) || new BigNumber(actionValueB).lt(0))
      return { isDisabled: true, title: "Enter a +ve amount" };
    if (new BigNumber(actionValueA).eq(0) || new BigNumber(actionValueB).eq(0))
      return { isDisabled: true, title: "Enter a non-zero amount" };

    return {
      title: actionNameMap[selectedAction],
    };
  })();

  const onSubmitClick = async () => {
    if (submitButtonState.isDisabled) return;

    try {
      setIsSubmitting(true);

      if (selectedAction === Action.DEPOSIT) {
        const transaction = new Transaction();

        const coinTypeA = pool.coinTypes[0];
        const coinTypeB = pool.coinTypes[1];

        const coinMetadataA = appData.poolCoinMetadataMap[coinTypeA];
        const coinMetadataB = appData.poolCoinMetadataMap[coinTypeB];

        const submitAmountA = new BigNumber(actionValueA || 0)
          .times(10 ** coinMetadataA.decimals)
          .integerValue(BigNumber.ROUND_DOWN)
          .toString();
        const submitAmountB = new BigNumber(actionValueB || 0)
          .times(10 ** coinMetadataB.decimals)
          .integerValue(BigNumber.ROUND_DOWN)
          .toString();

        const coinA = coinWithBalance({
          balance: BigInt(submitAmountA),
          type: coinTypeA,
          useGasCoin: isSui(coinTypeA),
        })(transaction);
        const coinB = coinWithBalance({
          balance: BigInt(submitAmountB),
          type: coinTypeB,
          useGasCoin: isSui(coinTypeB),
        })(transaction);

        // steammClient.signer = new Ed25519PublicKey(
        //   toBase64(account?.publicKey as Uint8Array),
        // )
        await steammClient.Pool.depositLiquidityEntry(transaction, {
          pool: pool.id,
          coinTypeA,
          coinTypeB,
          coinA,
          coinB,
          maxA: BigInt(submitAmountA),
          maxB: BigInt(submitAmountB),
        });

        const res = await signExecuteAndWaitForTransaction(transaction);
        const txUrl = explorer.buildTxUrl(res.digest);

        showSuccessTxnToast("Deposited", txUrl);

        setActionValueA("");
        setActionValueB("");
        document.getElementById(getCoinInputId(coinTypeA))?.focus();
      }
    } catch (err) {
      showErrorToast(
        `Failed to ${actionNameMap[selectedAction].toLowerCase()}`,
        err as Error,
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 rounded-md border p-5">
      <div className="flex w-full flex-row items-center justify-between">
        {/* Tabs */}
        <div className="flex flex-row gap-1">
          {Object.values(Action).map((action) => (
            <button
              key={action}
              className={cn(
                "group flex h-10 flex-row items-center rounded-md border px-3 transition-colors",
                selectedAction === action
                  ? "cursor-default bg-border"
                  : "hover:bg-border",
              )}
              onClick={() => onSelectedActionChange(action)}
            >
              <p
                className={cn(
                  "!text-p2 transition-colors",
                  selectedAction === action
                    ? "text-foreground"
                    : "text-secondary-foreground group-hover:text-foreground",
                )}
              >
                {actionNameMap[action]}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-1">
        <CoinInput
          coinType={pool.coinTypes[0]}
          value={actionValueA}
          onChange={(value) => onActionValueChange(value, 0)}
          onBalanceClick={() => onCoinBalanceClick(0)}
        />
        <CoinInput
          coinType={pool.coinTypes[1]}
          value={actionValueB}
          onChange={(value) => onActionValueChange(value, 1)}
          onBalanceClick={() => onCoinBalanceClick(1)}
        />
      </div>

      <button
        className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
        disabled={submitButtonState.isDisabled}
        onClick={onSubmitClick}
      >
        {submitButtonState.isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-button-1-foreground" />
        ) : (
          <p className="text-p1 text-button-1-foreground">
            {submitButtonState.title}
          </p>
        )}
      </button>
    </div>
  );
}
