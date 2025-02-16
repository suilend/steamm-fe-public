import { useRouter } from "next/router";
import { useCallback, useRef, useState } from "react";

import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import { SUI_DECIMALS } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import { debounce } from "lodash";
import {
  AlertTriangle,
  ArrowRightLeft,
  ArrowUpDown,
  Info,
  Loader2,
} from "lucide-react";

import {
  MAX_U64,
  NORMALIZED_SUI_COINTYPE,
  SUI_GAS_MIN,
  formatInteger,
  formatPercent,
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
import {
  DepositQuote,
  RedeemQuote,
  SteammSDK,
  SwapQuote,
} from "@suilend/steamm-sdk";

import CoinInput, { getCoinInputId } from "@/components/pool/CoinInput";
import SlippagePopover from "@/components/SlippagePopover";
import TokenLogo from "@/components/TokenLogo";
import TokenLogos from "@/components/TokenLogos";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { showSuccessTxnToast } from "@/lib/toasts";
import { SubmitButtonState } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRICE_DIFFERENCE_PERCENT_WARNING_THRESHOLD = 1;
const PRICE_DIFFERENCE_PERCENT_DESTRUCTIVE_THRESHOLD = 8;

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

interface DepositTabProps {
  formatValue: (_value: string, dp: number) => string;
}

function DepositTab({ formatValue }: DepositTabProps) {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const {
    steammClient,
    appData,
    getBalance,
    refresh,
    slippagePercent,
    hasRootlets,
    isWhitelisted,
  } = useLoadedAppContext();
  const { pool } = usePoolContext();

  // Value
  const [values, setValues] = useState<[string, string]>(["", ""]);
  const valuesRef = useRef<[string, string]>(values);

  const [fetchingQuoteForIndex, setFetchingQuoteForIndex] = useState<
    number | undefined
  >(undefined);
  const [quote, setQuote] = useState<DepositQuote | undefined>(undefined);

  const fetchQuote = async (
    _steammClient: SteammSDK,
    _value: string,
    index: number,
  ) => {
    console.log(
      "DepositTab.fetchQuote - _value(=formattedValue):",
      _value,
      "index:",
      index,
      "valuesRef.current[index]:",
      valuesRef.current[index],
    );

    const dps = [
      appData.poolCoinMetadataMap[pool.coinTypes[0]].decimals,
      appData.poolCoinMetadataMap[pool.coinTypes[1]].decimals,
    ];

    if (valuesRef.current[index] !== _value) return;

    try {
      const submitAmount = new BigNumber(_value)
        .times(10 ** dps[index])
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();
      const quote = await _steammClient.Pool.quoteDeposit({
        pool: pool.id,
        maxA: index === 0 ? BigInt(submitAmount) : BigInt(MAX_U64.toString()),
        maxB: index === 0 ? BigInt(MAX_U64.toString()) : BigInt(submitAmount),
      });

      if (valuesRef.current[index] !== _value) return;
      console.log("DepositTab.fetchQuote - quote:", quote);

      setValues((prev) => [
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
      ]);

      setFetchingQuoteForIndex(undefined);
      setQuote(quote);
    } catch (err) {
      showErrorToast("Failed to fetch quote", err as Error);
      console.error(err);
    }
  };
  const debouncedFetchQuote = useRef(debounce(fetchQuote, 100)).current;

  const onValueChange = (
    _value: string,
    index: number,
    isImmediate?: boolean,
  ) => {
    console.log("DepositTab.onValueChange - _value:", _value);

    const dps = [
      appData.poolCoinMetadataMap[pool.coinTypes[0]].decimals,
      appData.poolCoinMetadataMap[pool.coinTypes[1]].decimals,
    ];

    const formattedValue = formatValue(_value, dps[index]);

    // formattedValue === "" || formattedValue < 0
    if (formattedValue === "" || new BigNumber(formattedValue).lt(0)) {
      const newValues: [string, string] = [
        index === 0 ? formattedValue : "",
        index === 0 ? "" : formattedValue,
      ];
      valuesRef.current = newValues;
      setValues(newValues);

      setFetchingQuoteForIndex(undefined);
      setQuote(undefined);
      return;
    }

    // formattedValue >= 0
    if (pool.tvlUsd.eq(0)) {
      const newValues: [string, string] = [
        index === 0 ? formattedValue : values[0],
        index === 0 ? values[1] : formattedValue,
      ];
      valuesRef.current = newValues;
      setValues(newValues);

      // Initial deposit (set fake quote) (one of the values may be "")
      setFetchingQuoteForIndex(undefined);
      setQuote({
        initialDeposit: true,
        depositA: BigInt(
          new BigNumber(valuesRef.current[0] || 0)
            .times(10 ** dps[0])
            .integerValue(BigNumber.ROUND_DOWN)
            .toString(),
        ),
        depositB: BigInt(
          new BigNumber(valuesRef.current[1] || 0)
            .times(10 ** dps[1])
            .integerValue(BigNumber.ROUND_DOWN)
            .toString(),
        ),
        mintLp: BigInt(0), // Not used
      });
      return;
    }

    // formattedValue === 0
    if (new BigNumber(formattedValue).eq(0)) {
      const newValues: [string, string] = [
        index === 0 ? formattedValue : "0",
        index === 0 ? "0" : formattedValue,
      ];
      valuesRef.current = newValues;
      setValues(newValues);

      setFetchingQuoteForIndex(undefined);
      setQuote(undefined);
      return;
    }

    // formattedValue > 0
    const newValues: [string, string] = [
      index === 0 ? formattedValue : values[0],
      index === 0 ? values[1] : formattedValue,
    ];
    valuesRef.current = newValues;
    setValues(newValues);

    setFetchingQuoteForIndex(1 - index);
    (isImmediate ? fetchQuote : debouncedFetchQuote)(
      steammClient,
      formattedValue,
      index,
    );
  };

  // Value - max
  const onCoinBalanceClick = (index: number) => {
    const coinType = pool.coinTypes[index];
    const coinMetadata = appData.poolCoinMetadataMap[coinType];
    const balance = getBalance(coinType);

    onValueChange(
      (isSui(coinType)
        ? BigNumber.max(
            0,
            new BigNumber(balance.minus(SUI_GAS_MIN)).div(
              1 + slippagePercent / 100,
            ),
          )
        : balance
      ).toFixed(coinMetadata.decimals, BigNumber.ROUND_DOWN),
      index,
      true,
    );
    document.getElementById(getCoinInputId(coinType))?.focus();
  };

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (!hasRootlets && !isWhitelisted)
      return { isDisabled: true, title: "Beta for Rootlets only" };
    if (isSubmitting) return { isDisabled: true, isLoading: true };

    if (Object.values(values).some((value) => value === ""))
      return { isDisabled: true, title: "Enter an amount" };
    if (Object.values(values).some((value) => new BigNumber(value).lt(0)))
      return { isDisabled: true, title: "Enter a +ve amount" };
    if (Object.values(values).some((value) => new BigNumber(value).eq(0)))
      return { isDisabled: true, title: "Enter a non-zero amount" };

    if (getBalance(NORMALIZED_SUI_COINTYPE).lt(SUI_GAS_MIN))
      return {
        isDisabled: true,
        title: `${SUI_GAS_MIN} SUI should be saved for gas`,
      };

    if (quote) {
      if (
        pool.coinTypes.includes(NORMALIZED_SUI_COINTYPE) &&
        new BigNumber(
          getBalance(NORMALIZED_SUI_COINTYPE).minus(SUI_GAS_MIN),
        ).lt(
          new BigNumber(
            (pool.coinTypes.indexOf(NORMALIZED_SUI_COINTYPE) === 0
              ? quote.depositA
              : quote.depositB
            ).toString(),
          )
            .div(10 ** SUI_DECIMALS)
            .times(1 + slippagePercent / 100),
        )
      )
        return {
          isDisabled: true,
          title: `${SUI_GAS_MIN} SUI should be saved for gas`,
        };

      for (let i = 0; i < pool.coinTypes.length; i++) {
        const coinType = pool.coinTypes[i];
        const coinMetadata = appData.poolCoinMetadataMap[coinType];

        if (
          getBalance(coinType).lt(
            new BigNumber(
              (i === 0 ? quote.depositA : quote.depositB).toString(),
            )
              .div(10 ** coinMetadata.decimals)
              .times(1 + slippagePercent / 100),
          )
        )
          return {
            isDisabled: true,
            title: `Insufficient ${coinMetadata.symbol}`,
          };
      }
    }

    return {
      title: "Deposit",
      isDisabled: fetchingQuoteForIndex !== undefined || !quote,
    };
  })();

  const onSubmitClick = async () => {
    console.log("DepositTab.onSubmitClick");

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
          value={fetchingQuoteForIndex === 0 ? undefined : values[0]}
          onChange={(value) => onValueChange(value, 0)}
          onBalanceClick={() => onCoinBalanceClick(0)}
        />
        <CoinInput
          coinType={pool.coinTypes[1]}
          value={fetchingQuoteForIndex === 1 ? undefined : values[1]}
          onChange={(value) => onValueChange(value, 1)}
          onBalanceClick={() => onCoinBalanceClick(1)}
        />
      </div>

      <SubmitButton
        submitButtonState={submitButtonState}
        onClick={onSubmitClick}
      />
    </>
  );
}

function WithdrawTab() {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const {
    steammClient,
    appData,
    getBalance,
    refresh,
    slippagePercent,
    hasRootlets,
    isWhitelisted,
  } = useLoadedAppContext();
  const { pool } = usePoolContext();

  // Value
  const [value, setValue] = useState<string>("0");
  const valueRef = useRef<string>(value);

  const [isFetchingQuote, setIsFetchingQuote] = useState<boolean>(false);
  const [quote, setQuote] = useState<RedeemQuote | undefined>(undefined);

  const fetchQuote = async (_steammClient: SteammSDK, _value: string) => {
    console.log(
      "WithdrawTab.fetchQuote - _value:",
      _value,
      "valueRef.current:",
      valueRef.current,
    );

    if (valueRef.current !== _value) return;

    try {
      const submitAmount = new BigNumber(
        new BigNumber(_value).div(100).times(getBalance(pool.lpTokenType)),
      )
        .times(10 ** appData.poolCoinMetadataMap[pool.lpTokenType].decimals)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();
      const quote = await _steammClient.Pool.quoteRedeem({
        pool: pool.id,
        lpTokens: BigInt(submitAmount),
      });

      if (valueRef.current !== _value) return;
      console.log("WithdrawTab.fetchQuote - quote:", quote);

      setIsFetchingQuote(false);
      setQuote(quote);
    } catch (err) {
      showErrorToast("Failed to fetch quote", err as Error);
      console.error(err);
    }
  };
  const debouncedFetchQuote = useRef(debounce(fetchQuote, 100)).current;

  const onValueChange = async (_value: string, isImmediate?: boolean) => {
    console.log("WithdrawTab.onValueChange - _value:", _value);

    const newValue = _value;
    valueRef.current = _value;
    setValue(newValue);

    setIsFetchingQuote(true);
    (isImmediate ? fetchQuote : debouncedFetchQuote)(steammClient, _value);
  };

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (!hasRootlets && !isWhitelisted)
      return { isDisabled: true, title: "Beta for Rootlets only" };
    if (isSubmitting) return { isDisabled: true, isLoading: true };

    if (value === "") return { isDisabled: true, title: "Enter an amount" };
    if (new BigNumber(value).lt(0))
      return { isDisabled: true, title: "Enter a +ve amount" };
    if (
      new BigNumber(
        new BigNumber(value).div(100).times(getBalance(pool.lpTokenType)),
      ).eq(0)
    )
      return { isDisabled: true, title: "Enter a non-zero amount" };

    if (getBalance(NORMALIZED_SUI_COINTYPE).lt(SUI_GAS_MIN))
      return {
        isDisabled: true,
        title: `${SUI_GAS_MIN} SUI should be saved for gas`,
      };

    return {
      title: "Withdraw",
      isDisabled: isFetchingQuote || !quote,
    };
  })();

  const onSubmitClick = async () => {
    console.log("WithdrawTab.onSubmitClick");

    if (submitButtonState.isDisabled) return;
    if (!address || !quote) return;

    try {
      setIsSubmitting(true);

      const [lpTokenType, coinTypeA, coinTypeB] = [
        pool.lpTokenType,
        ...pool.coinTypes,
      ];
      const [coinMetadataLpToken, coinMetadataA, coinMetadataB] = [
        appData.poolCoinMetadataMap[lpTokenType],
        appData.poolCoinMetadataMap[coinTypeA],
        appData.poolCoinMetadataMap[coinTypeB],
      ];

      const submitAmountLp = new BigNumber(
        new BigNumber(value).div(100).times(getBalance(pool.lpTokenType)),
      )
        .times(10 ** coinMetadataLpToken.decimals)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const submitAmountA = quote.withdrawA.toString();
      const submitAmountB = new BigNumber(quote.withdrawB.toString())
        .div(1 + slippagePercent / 100)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const transaction = new Transaction();

      const lpCoin = coinWithBalance({
        balance: BigInt(submitAmountLp),
        type: lpTokenType,
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
      setValue("0");
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
      <div className="flex w-full flex-col gap-2">
        <p className="text-p2 text-secondary-foreground">
          % of LP tokens to withdraw
        </p>

        <div className="flex w-full flex-row items-center gap-2">
          <input
            className="h-6 min-w-0 flex-1 appearance-none bg-[transparent] [&::-webkit-slider-runnable-track]:rounded-[10px] [&::-webkit-slider-runnable-track]:bg-border/50 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-[10px] [&::-webkit-slider-thumb]:bg-foreground"
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
          />
          <p className="w-16 text-right text-p1 text-foreground">
            {formatPercent(new BigNumber(value))}
          </p>
        </div>

        <div className="flex w-full flex-row justify-between">
          <div className="flex w-full flex-row items-center gap-2">
            <TokenLogos coinTypes={pool.coinTypes} size={16} />
            <p className="text-p2 text-foreground">
              {formatToken(
                new BigNumber(value)
                  .div(100)
                  .times(getBalance(pool.lpTokenType)),
                { dp: appData.poolCoinMetadataMap[pool.lpTokenType].decimals },
              )}
            </p>
          </div>

          <div className="flex flex-row items-center gap-1">
            {[50, 100].map((percent) => (
              <button
                key={percent}
                className="group flex h-6 flex-row items-center rounded-md border px-2 transition-colors hover:bg-border/50"
                onClick={() => onValueChange(percent.toString(), true)}
              >
                <p className="text-p3 text-secondary-foreground transition-colors group-hover:text-foreground">
                  {formatPercent(new BigNumber(percent), { dp: 0 })}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2">
        <p className="text-p2 text-secondary-foreground">You receive</p>

        <div className="flex w-full flex-col gap-3 rounded-md border p-4">
          {pool.coinTypes.map((coinType, index) => {
            const coinMetadata = appData.poolCoinMetadataMap[coinType];

            return (
              <div
                key={coinType}
                className="flex w-full flex-row items-center justify-between"
              >
                <div className="flex flex-row items-center gap-2">
                  <TokenLogo
                    token={getToken(coinType, coinMetadata)}
                    size={24}
                  />
                  <p className="text-p1 text-foreground">
                    {coinMetadata.symbol}
                  </p>
                </div>

                {isFetchingQuote ? (
                  <Skeleton className="h-[24px] w-24" />
                ) : (
                  <p className="text-p1 text-foreground">
                    {quote
                      ? formatToken(
                          new BigNumber(
                            (index === 0
                              ? quote.withdrawA
                              : quote.withdrawB
                            ).toString(),
                          ).div(10 ** coinMetadata.decimals),
                          { dp: coinMetadata.decimals },
                        )
                      : "--"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SubmitButton
        submitButtonState={submitButtonState}
        onClick={onSubmitClick}
      />
    </>
  );
}

interface SwapTabProps {
  formatValue: (_value: string, dp: number) => string;
}

function SwapTab({ formatValue }: SwapTabProps) {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const {
    steammClient,
    appData,
    getBalance,
    refresh,
    slippagePercent,
    hasRootlets,
    isWhitelisted,
  } = useLoadedAppContext();
  const { pool } = usePoolContext();

  // Active index
  const [activeCoinIndex, setActiveCoinIndex] = useState<0 | 1>(0);
  const activeCoinType = pool.coinTypes[activeCoinIndex];
  const activeCoinMetadata = appData.poolCoinMetadataMap[activeCoinType];

  const inactiveIndex = (1 - activeCoinIndex) as 0 | 1;
  const inactiveCoinType = pool.coinTypes[inactiveIndex];
  const inactiveCoinMetadata = appData.poolCoinMetadataMap[inactiveCoinType];

  // Value
  const [value, setValue] = useState<string>("");
  const valueRef = useRef<string>(value);

  const [isFetchingQuote, setIsFetchingQuote] = useState<boolean>(false);
  const [quote, setQuote] = useState<SwapQuote | undefined>(undefined);

  const fetchQuote = async (
    _steammClient: SteammSDK,
    _value: string,
    _activeCoinIndex: number,
  ) => {
    console.log(
      "SwapTab.fetchQuote - _value(=formattedValue):",
      _value,
      "_activeCoinIndex:",
      _activeCoinIndex,
      "valueRef.current:",
      valueRef.current,
    );

    if (valueRef.current !== _value) return;

    try {
      const submitAmount = new BigNumber(_value)
        .times(
          10 **
            appData.poolCoinMetadataMap[pool.coinTypes[_activeCoinIndex]]
              .decimals,
        )
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();
      const quote = await _steammClient.Pool.quoteSwap({
        pool: pool.id,
        a2b: _activeCoinIndex === 0,
        amountIn: BigInt(submitAmount),
      });

      if (valueRef.current !== _value) return;
      console.log("SwapTab.fetchQuote - quote:", quote);

      setIsFetchingQuote(false);
      setQuote(quote);
    } catch (err) {
      showErrorToast("Failed to fetch quote", err as Error);
      console.error(err);
    }
  };
  const debouncedFetchQuote = useRef(debounce(fetchQuote, 100)).current;

  const onValueChange = (_value: string, isImmediate?: boolean) => {
    console.log("SwapTab.onValueChange - _value:", _value);

    const formattedValue = formatValue(_value, activeCoinMetadata.decimals);

    const newValue = formattedValue;
    valueRef.current = newValue;
    setValue(newValue);

    // formattedValue === "" || formattedValue <= 0
    if (new BigNumber(formattedValue || 0).lte(0)) {
      setIsFetchingQuote(false);
      setQuote(undefined);
      return;
    }

    // formattedValue > 0
    setIsFetchingQuote(true);
    (isImmediate ? fetchQuote : debouncedFetchQuote)(
      steammClient,
      formattedValue,
      activeCoinIndex,
    );
  };

  // Ratio
  const currentRatio = pool.balances[inactiveIndex].div(
    pool.balances[activeCoinIndex],
  );

  const [isShowingReversedQuoteRatio, setIsShowingReversedQuoteRatio] =
    useState<boolean>(false);
  const quoteRatio =
    quote !== undefined
      ? new BigNumber(
          new BigNumber(quote.amountOut.toString()).div(
            10 ** inactiveCoinMetadata.decimals,
          ),
        ).div(
          new BigNumber(quote.amountIn.toString()).div(
            10 ** activeCoinMetadata.decimals,
          ),
        )
      : undefined;
  const reversedQuoteRatio =
    quoteRatio !== undefined ? quoteRatio.pow(-1) : undefined;

  const priceDifferencePercent =
    quoteRatio !== undefined
      ? BigNumber.max(
          0,
          new BigNumber(currentRatio.minus(quoteRatio))
            .div(currentRatio)
            .times(100),
        )
      : undefined;
  const PriceDifferenceIcon = priceDifferencePercent?.gte(
    PRICE_DIFFERENCE_PERCENT_WARNING_THRESHOLD,
  )
    ? AlertTriangle
    : Info;

  // Value - max
  const onCoinBalanceClick = () => {
    const coinType = pool.coinTypes[activeCoinIndex];
    const coinMetadata = appData.poolCoinMetadataMap[coinType];
    const balance = getBalance(coinType);

    onValueChange(
      (isSui(coinType)
        ? BigNumber.max(0, balance.minus(SUI_GAS_MIN))
        : balance
      ).toFixed(coinMetadata.decimals, BigNumber.ROUND_DOWN),
      true,
    );
    document.getElementById(getCoinInputId(coinType))?.focus();
  };

  // Reverse
  const reverseAssets = () => {
    const newActiveCoinIndex = (1 - activeCoinIndex) as 0 | 1;
    setActiveCoinIndex(newActiveCoinIndex);
    setQuote(undefined);

    document.getElementById(getCoinInputId(activeCoinType))?.focus();

    // value === "" || value <= 0
    if (new BigNumber(value || 0).lte(0)) return;

    // value > 0
    setIsFetchingQuote(true);
    fetchQuote(steammClient, value, newActiveCoinIndex);
  };

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (!hasRootlets && !isWhitelisted)
      return { isDisabled: true, title: "Beta for Rootlets only" };
    if (isSubmitting) return { isDisabled: true, isLoading: true };

    if (value === "") return { isDisabled: true, title: "Enter an amount" };
    if (new BigNumber(value).lt(0))
      return { isDisabled: true, title: "Enter a +ve amount" };
    if (new BigNumber(value).eq(0))
      return { isDisabled: true, title: "Enter a non-zero amount" };

    if (getBalance(NORMALIZED_SUI_COINTYPE).lt(SUI_GAS_MIN))
      return {
        isDisabled: true,
        title: `${SUI_GAS_MIN} SUI should be saved for gas`,
      };

    if (quote) {
      if (
        isSui(activeCoinType) &&
        new BigNumber(getBalance(activeCoinType).minus(SUI_GAS_MIN)).lt(
          new BigNumber(quote.amountIn.toString()).div(
            10 ** activeCoinMetadata.decimals,
          ),
        )
      )
        return {
          isDisabled: true,
          title: `${SUI_GAS_MIN} SUI should be saved for gas`,
        };

      if (
        getBalance(activeCoinType).lt(
          new BigNumber(quote.amountIn.toString()).div(
            10 ** activeCoinMetadata.decimals,
          ),
        )
      )
        return {
          isDisabled: true,
          title: `Insufficient ${activeCoinMetadata.symbol}`,
        };
    }

    return {
      title: "Swap",
      isDisabled: isFetchingQuote || !quote,
    };
  })();

  const onSubmitClick = async () => {
    console.log("SwapTab.onSubmitClick");

    if (submitButtonState.isDisabled) return;
    if (!address || !quote) return;

    try {
      setIsSubmitting(true);

      const [coinTypeA, coinTypeB] = pool.coinTypes;
      const [coinMetadataA, coinMetadataB] = [
        appData.poolCoinMetadataMap[coinTypeA],
        appData.poolCoinMetadataMap[coinTypeB],
      ];

      const amountIn = quote.amountIn.toString();
      const minAmountOut = new BigNumber(quote.amountOut.toString())
        .div(1 + slippagePercent / 100)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const transaction = new Transaction();

      const coinA = coinWithBalance({
        balance: BigInt(activeCoinIndex === 0 ? amountIn : minAmountOut),
        type: coinTypeA,
        useGasCoin: isSui(coinTypeA),
      })(transaction);
      const coinB = coinWithBalance({
        balance: BigInt(activeCoinIndex === 0 ? minAmountOut : amountIn),
        type: coinTypeB,
        useGasCoin: isSui(coinTypeB),
      })(transaction);

      await steammClient.Pool.swap(transaction, {
        pool: pool.id,
        coinTypeA,
        coinTypeB,
        coinA,
        coinB,
        a2b: activeCoinIndex === 0,
        amountIn: BigInt(amountIn),
        minAmountOut: BigInt(minAmountOut),
      });

      transaction.transferObjects([coinA, coinB], address);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      const balanceChangeA = getBalanceChange(
        res,
        address,
        getToken(coinTypeA, appData.poolCoinMetadataMap[coinTypeA]),
        activeCoinIndex === 0 ? -1 : 1,
      );
      const balanceChangeB = getBalanceChange(
        res,
        address,
        getToken(coinTypeB, appData.poolCoinMetadataMap[coinTypeB]),
        activeCoinIndex === 0 ? 1 : -1,
      );

      const balanceChangeAFormatted = formatToken(
        balanceChangeA !== undefined
          ? balanceChangeA
          : new BigNumber(activeCoinIndex === 0 ? amountIn : minAmountOut),
        { dp: coinMetadataA.decimals, trimTrailingZeros: true },
      );
      const balanceChangeBFormatted = formatToken(
        balanceChangeB !== undefined
          ? balanceChangeB
          : new BigNumber(activeCoinIndex === 0 ? minAmountOut : amountIn),
        { dp: coinMetadataB.decimals, trimTrailingZeros: true },
      );

      showSuccessTxnToast("Swapped", txUrl, {
        description: `${balanceChangeAFormatted} ${coinMetadataA.symbol} for ${balanceChangeBFormatted} ${coinMetadataB.symbol}`,
      });
      setValue("");
      setQuote(undefined);
    } catch (err) {
      showErrorToast("Failed to swap", err as Error, undefined, true);
      console.error(err);
    } finally {
      document.getElementById(getCoinInputId(pool.coinTypes[0]))?.focus();
      setIsSubmitting(false);
      refresh();
    }
  };

  return (
    <>
      <div className="relative flex w-full min-w-0 flex-col items-center gap-1">
        <CoinInput
          className="relative z-[1]"
          coinType={pool.coinTypes[activeCoinIndex]}
          value={value}
          onChange={(value) => onValueChange(value)}
          onBalanceClick={() => onCoinBalanceClick()}
        />

        <div className="relative z-[2] -my-[18px] flex h-8 w-8 rounded-[16px] bg-background">
          <button
            className="flex h-full w-full flex-row items-center justify-center rounded-[16px] bg-button-1 transition-colors hover:bg-button-1/80"
            onClick={reverseAssets}
          >
            <ArrowUpDown className="h-4 w-4 text-button-1-foreground" />
          </button>
        </div>

        <CoinInput
          className="relative z-[1]"
          coinType={inactiveCoinType}
          value={
            isFetchingQuote
              ? undefined
              : quote
                ? formatValue(
                    new BigNumber(quote.amountOut.toString())
                      .div(10 ** inactiveCoinMetadata.decimals)
                      .toFixed(
                        inactiveCoinMetadata.decimals,
                        BigNumber.ROUND_DOWN,
                      ),
                    inactiveCoinMetadata.decimals,
                  )
                : ""
          }
        />
      </div>

      {(isFetchingQuote || quote) && (
        <div className="flex w-full flex-col gap-1">
          {/* Price difference */}
          {isFetchingQuote || !quote ? (
            <Skeleton className="h-[21px] w-40" />
          ) : (
            <p
              className={cn(
                "text-p2 text-foreground",
                priceDifferencePercent!.gte(
                  PRICE_DIFFERENCE_PERCENT_WARNING_THRESHOLD,
                ) &&
                  cn(
                    "text-warning",
                    priceDifferencePercent!.gte(
                      PRICE_DIFFERENCE_PERCENT_DESTRUCTIVE_THRESHOLD,
                    ) && "text-error",
                  ),
              )}
            >
              <PriceDifferenceIcon className="mb-0.5 mr-1.5 inline h-3.5 w-3.5" />
              {formatPercent(BigNumber.max(0, priceDifferencePercent!))} Price
              difference
            </p>
          )}
        </div>
      )}

      <SubmitButton
        submitButtonState={submitButtonState}
        onClick={onSubmitClick}
      />

      {(isFetchingQuote || quote) && (
        <div className="flex w-full flex-col gap-2">
          {/* Exchange rate */}
          <div className="flex w-full flex-row items-center justify-between">
            <p className="text-p2 text-secondary-foreground">Exchange rate</p>

            {isFetchingQuote || !quote ? (
              <Skeleton className="h-[21px] w-48" />
            ) : (
              <button
                className="group flex flex-row items-center gap-2"
                onClick={() => setIsShowingReversedQuoteRatio((prev) => !prev)}
              >
                <p className="text-p2 text-foreground">
                  {!isShowingReversedQuoteRatio ? (
                    <>
                      1 {activeCoinMetadata.symbol}
                      {" ≈ "}
                      {formatToken(quoteRatio!, {
                        dp: inactiveCoinMetadata.decimals,
                      })}{" "}
                      {inactiveCoinMetadata.symbol}
                    </>
                  ) : (
                    <>
                      1 {inactiveCoinMetadata.symbol}
                      {" ≈ "}
                      {formatToken(reversedQuoteRatio!, {
                        dp: activeCoinMetadata.decimals,
                      })}{" "}
                      {activeCoinMetadata.symbol}
                    </>
                  )}
                </p>
                <ArrowRightLeft className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Minimum received */}
          <div className="flex w-full flex-row items-center justify-between">
            <p className="text-p2 text-secondary-foreground">
              Minimum received
            </p>

            {isFetchingQuote || !quote ? (
              <Skeleton className="h-[21px] w-24" />
            ) : (
              <p className="text-p2 text-foreground">
                {formatToken(
                  new BigNumber(quote.amountOut.toString())
                    .div(1 + slippagePercent / 100)
                    .div(10 ** inactiveCoinMetadata.decimals),
                  { dp: inactiveCoinMetadata.decimals },
                )}{" "}
                {inactiveCoinMetadata.symbol}
              </p>
            )}
          </div>

          {/* Fees */}
          <div className="flex w-full flex-row items-center justify-between">
            <p className="text-p2 text-secondary-foreground">Included fees</p>

            {isFetchingQuote || !quote ? (
              <Skeleton className="h-[21px] w-24" />
            ) : (
              <p className="text-p2 text-foreground">
                {formatToken(
                  new BigNumber(
                    (
                      quote.outputFees.poolFees + quote.outputFees.protocolFees
                    ).toString(),
                  ).div(10 ** inactiveCoinMetadata.decimals),
                  { dp: inactiveCoinMetadata.decimals },
                )}{" "}
                {inactiveCoinMetadata.symbol}
              </p>
            )}
          </div>
        </div>
      )}
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
      <div className="flex w-full flex-row items-center justify-between">
        {/* Tabs */}
        <div className="flex flex-row gap-1">
          {Object.values(Action).map((action) => {
            if (
              pool.tvlUsd.eq(0) &&
              [Action.WITHDRAW, Action.SWAP].includes(action)
            )
              return null;

            return (
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
            );
          })}
        </div>

        <SlippagePopover />
      </div>

      {selectedAction === Action.DEPOSIT && (
        <DepositTab formatValue={formatValue} />
      )}
      {selectedAction === Action.WITHDRAW && <WithdrawTab />}
      {selectedAction === Action.SWAP && <SwapTab formatValue={formatValue} />}
    </div>
  );
}
