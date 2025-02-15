import { useRouter } from "next/router";
import { useCallback, useRef, useState } from "react";

import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { debounce } from "lodash";
import { Loader2 } from "lucide-react";

import {
  MAX_U64,
  SUI_GAS_MIN,
  formatInteger,
  formatToken,
  getBalanceChange,
  getToken,
  isSui,
} from "@suilend/frontend-sui";
import {
  shallowPushQuery,
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import { DepositQuote, RedeemQuote } from "@suilend/steamm-sdk";

import CoinInput, { getCoinInputId } from "@/components/pool/CoinInput";
import SlippagePopover from "@/components/SlippagePopover";
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

interface SubmitButtonProps {
  submitButtonState: SubmitButtonState;
  onClick: () => void;
}

function SubmitButton({ submitButtonState, onClick }: SubmitButtonProps) {
  return (
    <button
      className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
      disabled={submitButtonState.isDisabled}
      onClick={onClick}
    >
      {submitButtonState.isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-button-1-foreground" />
      ) : (
        <p className="text-p1 text-button-1-foreground">
          {submitButtonState.title}
        </p>
      )}
    </button>
  );
}

interface TabProps {
  formatValue: (_value: string, dp: number) => string;
}

function DepositTab({ formatValue }: TabProps) {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData, getBalance, refresh, slippagePercent } =
    useLoadedAppContext();
  const { pool } = usePoolContext();

  // Value
  const [values, setValues] = useState<[string, string]>(["", ""]);

  const [fetchingQuoteForIndex, setFetchingQuoteForIndex] = useState<
    number | undefined
  >(undefined);
  const [quote, setQuote] = useState<DepositQuote | undefined>(undefined);

  const fetchQuote = async (
    _value: string,
    formattedValue: string,
    index: number,
  ) => {
    console.log(
      "DepositTab.fetchQuote - _value:",
      _value,
      "formattedValue:",
      formattedValue,
      "index:",
      index,
    );

    const dps = [
      appData.poolCoinMetadataMap[pool.coinTypes[0]].decimals,
      appData.poolCoinMetadataMap[pool.coinTypes[1]].decimals,
    ];

    try {
      setFetchingQuoteForIndex(1 - index);

      const submitAmount = new BigNumber(_value || 0)
        .times(10 ** dps[index])
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();
      const quote = await steammClient.Pool.quoteDeposit({
        pool: pool.id,
        maxA: index === 0 ? BigInt(submitAmount) : BigInt(MAX_U64.toString()),
        maxB: index === 0 ? BigInt(MAX_U64.toString()) : BigInt(submitAmount),
      });
      console.log("DepositTab.onValueChange - quote:", quote);

      setValues((prev) => {
        if (prev[index] !== formattedValue) return prev;

        setFetchingQuoteForIndex(undefined);
        setQuote(quote);

        return [
          index === 0
            ? prev[0]
            : formatValue(
                new BigNumber(quote.depositA.toString())
                  .div(10 ** dps[0])
                  .toFixed(dps[0], BigNumber.ROUND_DOWN),
                dps[0],
              ),
          index === 0
            ? formatValue(
                new BigNumber(quote.depositB.toString())
                  .div(10 ** dps[1])
                  .toFixed(dps[1], BigNumber.ROUND_DOWN),
                dps[1],
              )
            : prev[1],
        ];
      });
    } catch (err) {
      showErrorToast("Failed to fetch quote", err as Error);
      console.error(err);

      setFetchingQuoteForIndex(undefined);
      setQuote(undefined);
    }
  };

  const onValueChange = (_value: string, index: number) => {
    console.log("DepositTab.onValueChange - _value:", _value);

    const dps = [
      appData.poolCoinMetadataMap[pool.coinTypes[0]].decimals,
      appData.poolCoinMetadataMap[pool.coinTypes[1]].decimals,
    ];

    const isValueValid = new BigNumber(_value || 0).gt(0);
    const formattedValue = formatValue(_value, dps[index]);
    setValues((prev) => [
      index === 0 ? formattedValue : isValueValid ? prev[0] : "",
      index === 0 ? (isValueValid ? prev[1] : "") : formattedValue,
    ]);

    if (!isValueValid) {
      setFetchingQuoteForIndex(undefined);
      setQuote(undefined);
      return;
    }

    fetchQuote(_value, formattedValue, index);
  };

  // Value - max
  const onCoinBalanceClick = (index: number) => {
    const coinType = pool.coinTypes[index];
    const coinMetadata = appData.poolCoinMetadataMap[coinType];
    const balance = getBalance(coinType);

    onValueChange(
      (isSui(pool.coinTypes[index])
        ? BigNumber.max(0, balance.minus(SUI_GAS_MIN))
        : balance
      ).toFixed(coinMetadata.decimals, BigNumber.ROUND_DOWN),
      index,
    );
    document.getElementById(getCoinInputId(coinType))?.focus();
  };

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    // TODO: Check Rootlets
    if (isSubmitting) return { isDisabled: true, isLoading: true };

    if (Object.values(values).some((value) => value === ""))
      return { isDisabled: true, title: "Enter an amount" };
    if (Object.values(values).some((value) => new BigNumber(value).lt(0)))
      return { isDisabled: true, title: "Enter a +ve amount" };
    if (Object.values(values).some((value) => new BigNumber(value).eq(0)))
      return { isDisabled: true, title: "Enter a non-zero amount" };

    // TODO: Check balance

    return {
      title: "Deposit",
      isDisabled: fetchingQuoteForIndex !== undefined,
    };
  })();

  const onSubmitClick = async () => {
    if (submitButtonState.isDisabled) return;
    if (!address || !quote) return;

    try {
      setIsSubmitting(true);

      const [coinTypeA, coinTypeB] = pool.coinTypes;
      const [coinMetadataA, coinMetadataB] = [
        appData.poolCoinMetadataMap[coinTypeA],
        appData.poolCoinMetadataMap[coinTypeB],
      ];

      const submitAmountA = quote.depositA.toString();
      const submitAmountB = new BigNumber(quote.depositB.toString())
        .times(1 + slippagePercent / 100)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const transaction = new Transaction();

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

      await steammClient.Pool.depositLiquidityEntry(transaction, {
        pool: pool.id,
        coinTypeA,
        coinTypeB,
        coinA,
        coinB,
        maxA: BigInt(submitAmountA),
        maxB: BigInt(submitAmountB),
      });

      transaction.transferObjects([coinA, coinB], address);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      const balanceChangeA = getBalanceChange(
        res,
        address,
        getToken(coinTypeA, appData.poolCoinMetadataMap[coinTypeA]),
        -1,
      );
      const balanceChangeB = getBalanceChange(
        res,
        address,
        getToken(coinTypeB, appData.poolCoinMetadataMap[coinTypeB]),
        -1,
      );

      const balanceChangeAFormatted = formatToken(
        balanceChangeA !== undefined
          ? balanceChangeA
          : new BigNumber(values[0]),
        { dp: coinMetadataA.decimals, trimTrailingZeros: true },
      );
      const balanceChangeBFormatted = formatToken(
        balanceChangeB !== undefined
          ? balanceChangeB
          : new BigNumber(values[1]),
        { dp: coinMetadataB.decimals, trimTrailingZeros: true },
      );

      showSuccessTxnToast("Deposited liquidity", txUrl, {
        description: `${balanceChangeAFormatted} ${coinMetadataA.symbol} and ${balanceChangeBFormatted} ${coinMetadataB.symbol}`,
      });
      setValues(["", ""]);
      setQuote(undefined);
    } catch (err) {
      showErrorToast(
        "Failed to deposit liquidity",
        err as Error,
        undefined,
        true,
      );
      console.error(err);
    } finally {
      document.getElementById(getCoinInputId(pool.coinTypes[0]))?.focus();
      setIsSubmitting(false);
      refresh();
    }
  };

  return (
    <>
      <div className="flex w-full min-w-0 flex-col gap-1">
        <CoinInput
          coinType={pool.coinTypes[0]}
          value={values[0]}
          onChange={(value) => onValueChange(value, 0)}
          onBalanceClick={() => onCoinBalanceClick(0)}
          isLoading={fetchingQuoteForIndex === 0}
        />
        <CoinInput
          coinType={pool.coinTypes[1]}
          value={values[1]}
          onChange={(value) => onValueChange(value, 1)}
          onBalanceClick={() => onCoinBalanceClick(1)}
          isLoading={fetchingQuoteForIndex === 1}
        />
      </div>

      <SubmitButton
        submitButtonState={submitButtonState}
        onClick={onSubmitClick}
      />
    </>
  );
}

function WithdrawTab({ formatValue }: TabProps) {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData, getBalance, refresh, slippagePercent } =
    useLoadedAppContext();
  const { pool } = usePoolContext();

  // Value
  const [value, setValue] = useState<string>("");

  const [isFetchingQuote, setIsFetchingQuote] = useState<boolean>(false);
  const [quote, setQuote] = useState<RedeemQuote | undefined>(undefined);

  const fetchQuote = async (_value: string, formattedValue: string) => {
    console.log(
      "WithdrawTab.fetchQuote - _value:",
      _value,
      "formattedValue:",
      formattedValue,
    );

    const dp = appData.poolCoinMetadataMap[pool.lpTokenType].decimals;

    try {
      setIsFetchingQuote(true);

      console.log("XXX", +getBalance(pool.lpTokenType));
      const submitAmount = new BigNumber(
        new BigNumber(_value || 0).div(100).times(getBalance(pool.lpTokenType)),
      )
        .times(10 ** dp)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();
      const quote = await steammClient.Pool.quoteRedeem({
        pool: pool.id,
        lpTokens: BigInt(submitAmount),
      });
      console.log("WithdrawTab.fetchQuote - quote:", quote);

      setValue((prev) => {
        if (prev !== formattedValue) return prev;

        setIsFetchingQuote(false);
        setQuote(quote);
        return prev;
      });
    } catch (err) {
      showErrorToast("Failed to fetch quote", err as Error);
      console.error(err);

      setIsFetchingQuote(false);
      setQuote(undefined);
    }
  };
  const debouncedFetchQuote = useRef(debounce(fetchQuote, 100)).current;

  const onValueChange = async (_value: string) => {
    console.log("WithdrawTab.onValueChange - _value:", _value);

    const dp = appData.poolCoinMetadataMap[pool.lpTokenType].decimals;

    const isValueValid = new BigNumber(_value || 0).gt(0);
    const formattedValue = formatValue(_value, dp);
    setValue(formattedValue);

    if (!isValueValid) {
      setIsFetchingQuote(false);
      setQuote(undefined);
      return;
    }

    debouncedFetchQuote(_value, formattedValue);
  };

  // Value - max
  const onCoinBalanceClick = () => {
    const coinType = pool.lpTokenType;
    const coinMetadata = appData.poolCoinMetadataMap[coinType];
    const balance = getBalance(coinType);

    onValueChange(balance.toFixed(coinMetadata.decimals, BigNumber.ROUND_DOWN));
  };

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    // Check Rootlets
    if (isSubmitting) return { isDisabled: true, isLoading: true };

    if (value === "") return { isDisabled: true, title: "Enter an amount" };
    if (new BigNumber(value).lt(0))
      return { isDisabled: true, title: "Enter a +ve amount" };
    if (new BigNumber(value).eq(0))
      return { isDisabled: true, title: "Enter a non-zero amount" };

    // TODO: Check balance

    return {
      title: "Withdraw",
      isDisabled: isFetchingQuote,
    };
  })();

  const onSubmitClick = async () => {
    if (submitButtonState.isDisabled) return;
    if (!address || !quote) return;

    try {
      setIsSubmitting(true);

      const [coinTypeA, coinTypeB] = pool.coinTypes;
      const [coinMetadataA, coinMetadataB] = [
        appData.poolCoinMetadataMap[coinTypeA],
        appData.poolCoinMetadataMap[coinTypeB],
      ];

      const submitAmountLp = new BigNumber(value)
        .times(10 ** coinMetadataA.decimals)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const submitAmountA = quote.withdrawA.toString();
      const submitAmountB = new BigNumber(quote.withdrawB.toString())
        .times(1 + slippagePercent / 100)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const transaction = new Transaction();

      const lpCoin = coinWithBalance({
        balance: BigInt(submitAmountLp),
        type: pool.lpTokenType,
        useGasCoin: false,
      })(transaction);

      await steammClient.Pool.redeemLiquidityEntry(transaction, {
        pool: pool.id,
        coinTypeA,
        coinTypeB,
        lpCoin,
        minA: BigInt(submitAmountA),
        minB: BigInt(submitAmountB),
      });

      transaction.transferObjects([lpCoin], address);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      const balanceChangeA = getBalanceChange(
        res,
        address,
        getToken(coinTypeA, appData.poolCoinMetadataMap[coinTypeA]),
        1,
      );
      const balanceChangeB = getBalanceChange(
        res,
        address,
        getToken(coinTypeB, appData.poolCoinMetadataMap[coinTypeB]),
        1,
      );

      const balanceChangeAFormatted = formatToken(
        balanceChangeA !== undefined
          ? balanceChangeA
          : new BigNumber(submitAmountA).div(10 ** coinMetadataA.decimals),
        { dp: coinMetadataA.decimals, trimTrailingZeros: true },
      );
      const balanceChangeBFormatted = formatToken(
        balanceChangeB !== undefined
          ? balanceChangeB
          : new BigNumber(submitAmountB).div(10 ** coinMetadataB.decimals),
        { dp: coinMetadataB.decimals, trimTrailingZeros: true },
      );

      showSuccessTxnToast("Withdrew liquidity", txUrl, {
        description: `${balanceChangeAFormatted} ${coinMetadataA.symbol} and ${balanceChangeBFormatted} ${coinMetadataB.symbol}`,
      });
      setValue("");
      setQuote(undefined);
    } catch (err) {
      showErrorToast(
        "Failed to withdraw liquidity",
        err as Error,
        undefined,
        true,
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
      refresh();
    }
  };

  return (
    <>
      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      />

      <SubmitButton
        submitButtonState={submitButtonState}
        onClick={onSubmitClick}
      />
    </>
  );
}

export default function PoolActionsCard() {
  const router = useRouter();
  const queryParams = {
    [QueryParams.ACTION]: router.query[QueryParams.ACTION] as
      | Action
      | undefined,
  };

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
  const formatValue = useCallback((_value: string, dp: number) => {
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
        Math.min(decimals.length, dp),
      );
      formattedValue = `${integersFormatted}.${decimalsFormatted}`;
    }

    return formattedValue;
  }, []);

  return (
    <div className="flex w-full flex-col gap-4 rounded-md border p-5">
      <div className="flex w-full flex-row items-end justify-between">
        {/* Tabs */}
        <div className="flex flex-row gap-1">
          {Object.values(Action).map((action) => (
            <button
              key={action}
              className={cn(
                "group flex h-10 flex-row items-center rounded-md border px-3 transition-colors",
                selectedAction === action
                  ? "cursor-default bg-border"
                  : "hover:bg-border/50",
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

        <SlippagePopover />
      </div>

      {selectedAction === Action.DEPOSIT && (
        <DepositTab formatValue={formatValue} />
      )}
      {selectedAction === Action.WITHDRAW && (
        <WithdrawTab formatValue={formatValue} />
      )}
    </div>
  );
}
