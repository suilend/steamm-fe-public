import { useRouter } from "next/router";
import { Fragment, useCallback, useMemo, useRef, useState } from "react";

import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import { SUI_DECIMALS } from "@mysten/sui/utils";
import * as Sentry from "@sentry/nextjs";
import BigNumber from "bignumber.js";
import { debounce } from "lodash";

import {
  MAX_U64,
  NORMALIZED_SUI_COINTYPE,
  SUI_GAS_MIN,
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
  createObligationIfNoneExists,
  sendObligationToUser,
} from "@suilend/sdk";
import {
  DepositQuote,
  RedeemQuote,
  SteammSDK,
  SwapQuote,
} from "@suilend/steamm-sdk";

import ExchangeRateParameter from "@/components/ExchangeRateParameter";
import Parameter from "@/components/Parameter";
import PercentInput from "@/components/PercentInput";
import CoinInput, { getCoinInputId } from "@/components/pool/CoinInput";
import SlippagePopover from "@/components/SlippagePopover";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import PriceDifferenceLabel from "@/components/swap/PriceDifferenceLabel";
import ReverseAssetsButton from "@/components/swap/ReverseAssetsButton";
import TokenLogo from "@/components/TokenLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { useLoadedUserContext } from "@/contexts/UserContext";
import useTokenUsdPrices from "@/hooks/useTokenUsdPrices";
import { formatPercentInputValue, formatTextInputValue } from "@/lib/format";
import {
  getIndexOfObligationWithDeposit,
  getObligationDepositPosition,
  getObligationDepositedAmount,
} from "@/lib/obligation";
import { getBirdeyeRatio } from "@/lib/swap";
import { showSuccessTxnToast } from "@/lib/toasts";
import { cn } from "@/lib/utils";

import { quotePoolDeposit } from "@/utils";

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

interface DepositTabProps {
  tokenUsdPricesMap: Record<string, BigNumber>;
}

function DepositTab({ tokenUsdPricesMap }: DepositTabProps) {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData, slippagePercent } = useLoadedAppContext();
  const { getBalance, userData, refresh } = useLoadedUserContext();
  const { pool } = usePoolContext();

  const currentRatio = pool.balances[0].div(pool.balances[1]); // NaN if pool.balances[1] === 0 (i.e. tvlUsd === 0)

  // Value
  const maxValues = pool.coinTypes.map((coinType, index) =>
    (isSui(coinType)
      ? BigNumber.max(0, getBalance(coinType).minus(SUI_GAS_MIN))
      : getBalance(coinType)
    )
      .div(index === 0 || pool.tvlUsd.eq(0) ? 1 : 1 + slippagePercent / 100)
      .decimalPlaces(
        appData.coinMetadataMap[pool.coinTypes[index]].decimals,
        BigNumber.ROUND_DOWN,
      ),
  ) as [BigNumber, BigNumber];
  const smartMaxValues = pool.tvlUsd.eq(0)
    ? maxValues
    : [
        BigNumber.min(
          maxValues[0],
          new BigNumber(maxValues[1].times(currentRatio)).decimalPlaces(
            appData.coinMetadataMap[pool.coinTypes[1]].decimals,
            BigNumber.ROUND_DOWN,
          ),
        ),
        BigNumber.min(
          maxValues[1],
          new BigNumber(maxValues[0].div(currentRatio)).decimalPlaces(
            appData.coinMetadataMap[pool.coinTypes[0]].decimals,
            BigNumber.ROUND_DOWN,
          ),
        ),
      ];

  const [values, setValues] = useState<[string, string]>(["", ""]);
  const valuesRef = useRef<[string, string]>(values);
  const [sliderValue, setSliderValue] = useState<string>("0");

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
      appData.coinMetadataMap[pool.coinTypes[0]].decimals,
      appData.coinMetadataMap[pool.coinTypes[1]].decimals,
    ];

    if (valuesRef.current[index] !== _value) return;

    try {
      const submitAmount = new BigNumber(_value)
        .times(10 ** dps[index])
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const poolState = await steammClient.fullClient.fetchPool(pool.id);

      const quote = quotePoolDeposit(
        poolState,
        index === 0 ? BigInt(submitAmount) : BigInt(MAX_U64.toString()),
        index === 0 ? BigInt(MAX_U64.toString()) : BigInt(submitAmount),
      );

      // TODO: add back after
      // const quote = await _steammClient.Pool.quoteDeposit({
      //   pool: pool.id,
      //   maxA: index === 0 ? BigInt(submitAmount) : BigInt(MAX_U64.toString()),
      //   maxB: index === 0 ? BigInt(MAX_U64.toString()) : BigInt(submitAmount),
      // });

      if (valuesRef.current[index] !== _value) return;
      console.log("DepositTab.fetchQuote - quote:", quote);

      setValues((prev) => [
        index === 0
          ? prev[0]
          : formatTextInputValue(
              new BigNumber(quote.depositA.toString())
                .div(10 ** dps[0])
                .toFixed(dps[0], BigNumber.ROUND_DOWN),
              dps[0],
            ),
        index === 0
          ? formatTextInputValue(
              new BigNumber(quote.depositB.toString())
                .div(10 ** dps[1])
                .toFixed(dps[1], BigNumber.ROUND_DOWN),
              dps[1],
            )
          : prev[1],
      ]);
      // setSliderValue (no need, should match the existing value)

      setFetchingQuoteForIndex(undefined);
      setQuote(quote);
    } catch (err) {
      showErrorToast("Failed to fetch quote", err as Error);
      console.error(err);
      Sentry.captureException(err);
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
      appData.coinMetadataMap[pool.coinTypes[0]].decimals,
      appData.coinMetadataMap[pool.coinTypes[1]].decimals,
    ];

    const formattedValue = formatTextInputValue(_value, dps[index]);

    // formattedValue === "" || formattedValue < 0
    if (formattedValue === "" || new BigNumber(formattedValue).lt(0)) {
      const newValues: [string, string] = [
        index === 0 ? formattedValue : "",
        index === 0 ? "" : formattedValue,
      ];
      valuesRef.current = newValues;
      setValues(newValues);
      setSliderValue("0");

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
      setSliderValue("0"); // Slider is hidden if TVL is 0

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
      setSliderValue("0");

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
    setSliderValue(
      new BigNumber(newValues[index])
        .div(smartMaxValues[index])
        .times(100)
        .toFixed(1),
    );

    setFetchingQuoteForIndex(1 - index);
    (isImmediate ? fetchQuote : debouncedFetchQuote)(
      steammClient,
      formattedValue,
      index,
    );
  };

  // Value - max
  const onBalanceClick = (index: number) => {
    const coinType = pool.coinTypes[index];
    const coinMetadata = appData.coinMetadataMap[coinType];

    onValueChange(
      smartMaxValues[index].toFixed(
        coinMetadata.decimals,
        BigNumber.ROUND_DOWN,
      ),
      index,
      true,
    );
    document.getElementById(getCoinInputId(coinType))?.focus();
  };

  // Value - slider
  const onSliderValueChange = (percent: string) => {
    const formattedValue = formatPercentInputValue(percent, 1);

    onValueChange(
      smartMaxValues[0]
        .times(formattedValue || "0")
        .div(100)
        .toFixed(
          appData.coinMetadataMap[pool.coinTypes[0]].decimals,
          BigNumber.ROUND_DOWN,
        ),
      0,
    );

    setSliderValue(formattedValue);
  };

  // USD prices - current
  const usdValues = useMemo(
    () =>
      [0, 1].map((index) =>
        fetchingQuoteForIndex !== undefined ||
        tokenUsdPricesMap[pool.coinTypes[index]] === undefined
          ? undefined
          : quote
            ? new BigNumber(
                (index === 0 ? quote.depositA : quote.depositB).toString(),
              )
                .div(
                  10 ** appData.coinMetadataMap[pool.coinTypes[index]].decimals,
                )
                .times(tokenUsdPricesMap[pool.coinTypes[index]])
            : "",
      ),
    [
      fetchingQuoteForIndex,
      tokenUsdPricesMap,
      pool.coinTypes,
      quote,
      appData.coinMetadataMap,
    ],
  );

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
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
            .times(
              pool.coinTypes.indexOf(NORMALIZED_SUI_COINTYPE) === 0 ||
                pool.tvlUsd.eq(0)
                ? 1
                : 1 + slippagePercent / 100,
            ),
        )
      )
        return {
          isDisabled: true,
          title: `${SUI_GAS_MIN} SUI should be saved for gas`,
        };

      for (let i = 0; i < pool.coinTypes.length; i++) {
        const coinType = pool.coinTypes[i];
        const coinMetadata = appData.coinMetadataMap[coinType];

        if (
          getBalance(coinType).lt(
            new BigNumber(
              (i === 0 ? quote.depositA : quote.depositB).toString(),
            )
              .div(10 ** coinMetadata.decimals)
              .times(
                i === 0 || pool.tvlUsd.eq(0) ? 1 : 1 + slippagePercent / 100,
              ),
          )
        )
          return {
            isDisabled: true,
            title: `Insufficient ${coinMetadata.symbol}`,
          };
      }
    }

    return {
      isDisabled: fetchingQuoteForIndex !== undefined || !quote,
      title: "Deposit",
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
        appData.coinMetadataMap[coinTypeA],
        appData.coinMetadataMap[coinTypeB],
      ];

      const submitAmountA = quote.depositA.toString();
      const submitAmountB = new BigNumber(quote.depositB.toString())
        .times(pool.tvlUsd.eq(0) ? 1 : 1 + slippagePercent / 100)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const transaction = new Transaction();

      // Deposit into pool
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

      const [lpCoin] = await steammClient.Pool.depositLiquidity(transaction, {
        pool: pool.id,
        coinTypeA,
        coinTypeB,
        coinA,
        coinB,
        maxA: BigInt(submitAmountA),
        maxB: BigInt(submitAmountB),
      });

      transaction.transferObjects([coinA, coinB], address);

      // Stake LP tokens (if reserve exists)
      if (appData.lm.reserveMap[pool.lpTokenType]) {
        let obligationIndex = getIndexOfObligationWithDeposit(
          userData.obligations,
          pool.lpTokenType,
        ); // Assumes up to one obligation has deposits of the LP token type
        if (obligationIndex === -1)
          obligationIndex = userData.obligations.findIndex(
            (obligation) => obligation.depositPositionCount < 5,
          ); // Get obligation with less than 5 deposits (if any)
        console.log("XXX obligationIndex:", obligationIndex);

        const { obligationOwnerCapId, didCreate } =
          createObligationIfNoneExists(
            appData.lm.suilendClient,
            transaction,
            obligationIndex !== -1
              ? userData.obligationOwnerCaps[obligationIndex]
              : undefined, // Create new obligation
          );
        appData.lm.suilendClient.deposit(
          lpCoin,
          pool.lpTokenType,
          obligationOwnerCapId,
          transaction,
        );
        if (didCreate)
          sendObligationToUser(obligationOwnerCapId, address, transaction);
      } else {
        transaction.transferObjects([lpCoin], address);
      }

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      const balanceChangeA = getBalanceChange(
        res,
        address,
        getToken(coinTypeA, appData.coinMetadataMap[coinTypeA]),
        -1,
      );
      const balanceChangeB = getBalanceChange(
        res,
        address,
        getToken(coinTypeB, appData.coinMetadataMap[coinTypeB]),
        -1,
      );

      const balanceChangeAFormatted = formatToken(
        balanceChangeA !== undefined
          ? balanceChangeA
          : new BigNumber(quote.depositA.toString()),
        { dp: coinMetadataA.decimals, trimTrailingZeros: true },
      );
      const balanceChangeBFormatted = formatToken(
        balanceChangeB !== undefined
          ? balanceChangeB
          : new BigNumber(quote.depositB.toString()),
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
      Sentry.captureException(err);
    } finally {
      document.getElementById(getCoinInputId(pool.coinTypes[0]))?.focus();
      setIsSubmitting(false);
      refresh();
    }
  };

  return (
    <>
      {[0, 1].map((index) => (
        <CoinInput
          key={index}
          token={getToken(
            pool.coinTypes[index],
            appData.coinMetadataMap[pool.coinTypes[index]],
          )}
          value={fetchingQuoteForIndex === index ? undefined : values[index]}
          usdValue={usdValues[index]}
          onChange={(value) => onValueChange(value, index)}
          onBalanceClick={() => onBalanceClick(index)}
        />
      ))}

      {/* Slider */}
      {!pool.tvlUsd.eq(0) && (
        <div className="flex w-full flex-row items-center gap-2">
          <div className="relative flex h-4 flex-1 flex-row items-center">
            <div className="absolute inset-0 z-[1] rounded-[calc(16px/2)] bg-card/50" />

            <div className="absolute inset-x-[calc(16px/2)] inset-y-0 z-[2]">
              {Array.from({ length: 5 }).map((_, detentIndex, array) => (
                <div
                  key={detentIndex}
                  className={cn(
                    "absolute inset-y-1/2 h-[4px] w-[4px] -translate-x-1/2 -translate-y-1/2",
                    detentIndex !== 0 &&
                      detentIndex !== array.length - 1 &&
                      "rounded-[calc(4px/2)] bg-tertiary-foreground",
                  )}
                  style={{
                    left: `${detentIndex * (100 / (array.length - 1))}%`,
                  }}
                />
              ))}
            </div>

            <input
              className={cn(
                "relative z-[3] h-6 w-full min-w-0 appearance-none bg-[transparent] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-[calc(16px/2)] [&::-webkit-slider-thumb]:bg-foreground",
                +sliderValue === Infinity && "opacity-0",
              )}
              type="range"
              min={0}
              max={100}
              step={1}
              value={sliderValue || "0"}
              onChange={(e) => onSliderValueChange(e.target.value)}
            />
          </div>

          <div className="w-20">
            <PercentInput
              inputClassName="!text-p1 text-right pl-0"
              value={sliderValue}
              onChange={onSliderValueChange}
            />
          </div>
        </div>
      )}

      <SubmitButton
        submitButtonState={submitButtonState}
        onClick={onSubmitClick}
      />

      {(fetchingQuoteForIndex !== undefined || quote) && (
        <div className="flex w-full flex-col gap-2">
          <Parameter label="Maximum outflow" isHorizontal>
            <div className="flex flex-col items-end gap-1">
              {pool.coinTypes.map((coinType, index) => {
                const coinMetadata = appData.coinMetadataMap[coinType];

                return (
                  <Fragment key={coinType}>
                    {fetchingQuoteForIndex !== undefined || !quote ? (
                      <Skeleton className="h-[21px] w-24" />
                    ) : (
                      <p className="text-p2 text-foreground">
                        {formatToken(
                          new BigNumber(
                            (index === 0
                              ? quote.depositA
                              : quote.depositB
                            ).toString(),
                          )
                            .times(
                              index === 0 || pool.tvlUsd.eq(0)
                                ? 1
                                : 1 + slippagePercent / 100,
                            )
                            .div(10 ** coinMetadata.decimals),
                          { dp: coinMetadata.decimals },
                        )}{" "}
                        {coinMetadata.symbol}
                      </p>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </Parameter>
        </div>
      )}
    </>
  );
}

function WithdrawTab() {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData, slippagePercent } = useLoadedAppContext();
  const { getBalance, userData, refresh } = useLoadedUserContext();
  const { pool } = usePoolContext();

  const lpTokenObligationIndex = getIndexOfObligationWithDeposit(
    userData.obligations,
    pool.lpTokenType,
  ); // Assumes up to one obligation has deposits of the LP token type

  const lpTokenBalance = getBalance(pool.lpTokenType);
  const lpTokenDepositedAmount = getObligationDepositedAmount(
    userData.obligations[lpTokenObligationIndex],
    pool.lpTokenType,
  );
  const lpTokenTotalAmount = lpTokenBalance.plus(lpTokenDepositedAmount);

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
        new BigNumber(_value || "0").div(100).times(lpTokenTotalAmount),
      )
        .times(10 ** appData.coinMetadataMap[pool.lpTokenType].decimals)
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
      Sentry.captureException(err);
    }
  };
  const debouncedFetchQuote = useRef(debounce(fetchQuote, 100)).current;

  const onValueChange = async (_value: string, isImmediate?: boolean) => {
    console.log("WithdrawTab.onValueChange - _value:", _value);

    const formattedValue = formatPercentInputValue(_value, 1);

    const newValue = formattedValue;
    valueRef.current = newValue;
    setValue(newValue);

    setIsFetchingQuote(true);
    (isImmediate ? fetchQuote : debouncedFetchQuote)(
      steammClient,
      formattedValue,
    );
  };

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) return { isDisabled: true, isLoading: true };

    if (value === "") return { isDisabled: true, title: "Enter an amount" };
    if (new BigNumber(value).lt(0))
      return { isDisabled: true, title: "Enter a +ve amount" };
    if (
      new BigNumber(new BigNumber(value).div(100).times(lpTokenTotalAmount)).eq(
        0,
      )
    )
      return { isDisabled: true, title: "Enter a non-zero amount" };

    if (getBalance(NORMALIZED_SUI_COINTYPE).lt(SUI_GAS_MIN))
      return {
        isDisabled: true,
        title: `${SUI_GAS_MIN} SUI should be saved for gas`,
      };

    return {
      isDisabled: isFetchingQuote || !quote,
      title: "Withdraw",
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
        appData.coinMetadataMap[lpTokenType],
        appData.coinMetadataMap[coinTypeA],
        appData.coinMetadataMap[coinTypeB],
      ];

      const lpTokenValue = new BigNumber(value)
        .div(100)
        .times(lpTokenTotalAmount);

      const transaction = new Transaction();

      let lpCoin;
      if (lpTokenBalance.gte(lpTokenValue)) {
        console.log("XXX wallet");
        // Withdraw from wallet only
        lpCoin = coinWithBalance({
          balance: BigInt(
            new BigNumber(lpTokenValue)
              .times(10 ** coinMetadataLpToken.decimals)
              .integerValue(BigNumber.ROUND_DOWN)
              .toString(),
          ),
          type: lpTokenType,
          useGasCoin: false,
        })(transaction);
      } else {
        const obligationIndex = getIndexOfObligationWithDeposit(
          userData.obligations,
          pool.lpTokenType,
        ); // Assumes up to one obligation has deposits of the LP token type
        if (obligationIndex === -1) throw Error("Obligation not found"); // Should never happen as the amount can't be greater than the balance if there are no deposits
        console.log("XXX obligationIndex:", obligationIndex);

        const lpCoins = [];
        if (lpTokenBalance.gt(0)) {
          // Withdraw MAX from wallet
          console.log("XXX max wallet, and");
          lpCoins.push(
            coinWithBalance({
              balance: BigInt(
                new BigNumber(lpTokenBalance)
                  .times(10 ** coinMetadataLpToken.decimals)
                  .integerValue(BigNumber.ROUND_DOWN)
                  .toString(),
              ),
              type: lpTokenType,
              useGasCoin: false,
            })(transaction),
          );
        }

        if (lpTokenValue.eq(lpTokenTotalAmount)) {
          // Withdraw MAX from Suilend
          console.log("XXX max suilend");
          const submitAmount = MAX_U64.toString();

          const [_lpCoin] = await appData.lm.suilendClient.withdraw(
            userData.obligationOwnerCaps[obligationIndex].id,
            userData.obligations[obligationIndex].id,
            pool.lpTokenType,
            submitAmount,
            transaction,
          );
          lpCoins.push(_lpCoin);
        } else {
          // Withdraw from Suilend
          console.log("XXX suilend");

          const lpTokenDepositPosition = getObligationDepositPosition(
            userData.obligations[obligationIndex],
            pool.lpTokenType,
          );
          if (!lpTokenDepositPosition) return; // Should never happen as obligationIndex !== -1
          console.log("XXX lpTokenDepositPosition:", lpTokenDepositPosition);

          const submitAmount = BigNumber.min(
            new BigNumber(
              new BigNumber(lpTokenValue.minus(lpTokenBalance))
                .times(10 ** coinMetadataLpToken.decimals)
                .integerValue(BigNumber.ROUND_DOWN)
                .toString(),
            )
              .div(appData.lm.reserveMap[pool.lpTokenType].cTokenExchangeRate)
              .integerValue(BigNumber.ROUND_UP),
            lpTokenDepositPosition.depositedCtokenAmount,
          ).toString();

          const [_lpCoin] = await appData.lm.suilendClient.withdraw(
            userData.obligationOwnerCaps[obligationIndex].id,
            userData.obligations[obligationIndex].id,
            pool.lpTokenType,
            submitAmount,
            transaction,
          );
          lpCoins.push(_lpCoin);
        }

        // Merge coins (if multiple)
        if (lpCoins.length === 1) lpCoin = lpCoins[0];
        else {
          lpCoin = lpCoins[0];
          transaction.mergeCoins(
            transaction.object(lpCoins[0]),
            lpCoins.map((c) => transaction.object(c)).slice(1),
          );
        }
      }

      // Withdraw from pool
      const submitAmountA = quote.withdrawA.toString();
      const submitAmountB = new BigNumber(quote.withdrawB.toString())
        .div(1 + slippagePercent / 100)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

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
        getToken(coinTypeA, appData.coinMetadataMap[coinTypeA]),
        1,
      );
      const balanceChangeB = getBalanceChange(
        res,
        address,
        getToken(coinTypeB, appData.coinMetadataMap[coinTypeB]),
        1,
      );

      const balanceChangeAFormatted = formatToken(
        balanceChangeA !== undefined
          ? balanceChangeA
          : new BigNumber(quote.withdrawA.toString()).div(
              10 ** coinMetadataA.decimals,
            ),
        { dp: coinMetadataA.decimals, trimTrailingZeros: true },
      );
      const balanceChangeBFormatted = formatToken(
        balanceChangeB !== undefined
          ? balanceChangeB
          : new BigNumber(quote.withdrawB.toString()).div(
              10 ** coinMetadataB.decimals,
            ),
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
      Sentry.captureException(err);
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

        {/* Slider */}
        <div className="flex h-6 w-full flex-row items-center gap-2">
          <div className="relative flex h-4 flex-1 flex-row items-center">
            <div className="absolute inset-0 z-[1] rounded-[calc(16px/2)] bg-card/50" />

            <div className="absolute inset-x-[calc(16px/2)] inset-y-0 z-[2]">
              {Array.from({ length: 5 }).map((_, detentIndex, array) => (
                <div
                  key={detentIndex}
                  className={cn(
                    "absolute inset-y-1/2 h-[4px] w-[4px] -translate-x-1/2 -translate-y-1/2",
                    detentIndex !== 0 &&
                      detentIndex !== array.length - 1 &&
                      "rounded-[calc(4px/2)] bg-tertiary-foreground",
                  )}
                  style={{
                    left: `${detentIndex * (100 / (array.length - 1))}%`,
                  }}
                />
              ))}
            </div>

            <input
              className="relative z-[3] h-6 w-full min-w-0 appearance-none bg-[transparent] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-[calc(16px/2)] [&::-webkit-slider-thumb]:bg-foreground"
              type="range"
              min={0}
              max={100}
              step={1}
              value={value || "0"}
              onChange={(e) => onValueChange(e.target.value)}
            />
          </div>

          <div className="w-20">
            <PercentInput
              inputClassName="!text-p1 text-right pl-0"
              value={value}
              onChange={onValueChange}
            />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2">
        <p className="text-p2 text-secondary-foreground">You receive</p>

        <div className="flex w-full flex-col gap-2 rounded-md border p-4">
          {pool.coinTypes.map((coinType, index) => {
            const coinMetadata = appData.coinMetadataMap[coinType];

            return (
              <div
                key={coinType}
                className="flex w-full flex-row items-center justify-between"
              >
                <div className="flex flex-row items-center gap-2">
                  <TokenLogo
                    token={getToken(coinType, coinMetadata)}
                    size={20}
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

      {(isFetchingQuote || quote) && (
        <div className="flex w-full flex-col gap-2">
          <Parameter label="Minimum inflow" isHorizontal>
            <div className="flex flex-col items-end gap-1">
              {pool.coinTypes.map((coinType, index) => {
                const coinMetadata = appData.coinMetadataMap[coinType];

                return (
                  <Fragment key={coinType}>
                    {isFetchingQuote || !quote ? (
                      <Skeleton className="h-[21px] w-24" />
                    ) : (
                      <p className="text-p2 text-foreground">
                        {formatToken(
                          new BigNumber(
                            (index === 0
                              ? quote.withdrawA
                              : quote.withdrawB
                            ).toString(),
                          )
                            .div(index === 0 ? 1 : 1 + slippagePercent / 100)
                            .div(10 ** coinMetadata.decimals),
                          { dp: coinMetadata.decimals },
                        )}{" "}
                        {coinMetadata.symbol}
                      </p>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </Parameter>
        </div>
      )}
    </>
  );
}

interface SwapTabProps {
  tokenUsdPricesMap: Record<string, BigNumber>;
}

function SwapTab({ tokenUsdPricesMap }: SwapTabProps) {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData, slippagePercent } = useLoadedAppContext();
  const { getBalance, refresh } = useLoadedUserContext();
  const { pool } = usePoolContext();

  // CoinTypes
  const [activeCoinIndex, setActiveCoinIndex] = useState<0 | 1>(0);
  const activeCoinType = pool.coinTypes[activeCoinIndex];
  const activeCoinMetadata = appData.coinMetadataMap[activeCoinType];

  const inactiveIndex = (1 - activeCoinIndex) as 0 | 1;
  const inactiveCoinType = pool.coinTypes[inactiveIndex];
  const inactiveCoinMetadata = appData.coinMetadataMap[inactiveCoinType];

  // Value
  const activeMaxValue = isSui(activeCoinType)
    ? BigNumber.max(0, getBalance(activeCoinType).minus(SUI_GAS_MIN))
    : getBalance(activeCoinType);

  const [value, setValue] = useState<string>("");
  const valueRef = useRef<string>(value);

  const [isFetchingQuote, setIsFetchingQuote] = useState<boolean>(false);
  const [quote, setQuote] = useState<SwapQuote | undefined>(undefined);

  const fetchQuote = useCallback(
    async (
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
              appData.coinMetadataMap[pool.coinTypes[_activeCoinIndex]]
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
        Sentry.captureException(err);
      }
    },
    [appData.coinMetadataMap, pool.coinTypes, pool.id],
  );
  const debouncedFetchQuote = useRef(debounce(fetchQuote, 100)).current;

  const onValueChange = (_value: string, isImmediate?: boolean) => {
    console.log("SwapTab.onValueChange - _value:", _value);

    const formattedValue = formatTextInputValue(
      _value,
      activeCoinMetadata.decimals,
    );

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

  // USD prices - current
  const activeUsdPrice = useMemo(
    () => tokenUsdPricesMap[activeCoinType],
    [tokenUsdPricesMap, activeCoinType],
  );
  const inactiveUsdPrice = useMemo(
    () => tokenUsdPricesMap[inactiveCoinType],
    [tokenUsdPricesMap, inactiveCoinType],
  );

  const activeUsdValue = useMemo(
    () =>
      isFetchingQuote || activeUsdPrice === undefined
        ? undefined
        : quote
          ? new BigNumber(quote.amountIn.toString())
              .div(10 ** activeCoinMetadata.decimals)
              .times(activeUsdPrice)
          : "",
    [isFetchingQuote, activeUsdPrice, quote, activeCoinMetadata],
  );
  const inactiveUsdValue = useMemo(
    () =>
      isFetchingQuote || inactiveUsdPrice === undefined
        ? undefined
        : quote
          ? new BigNumber(quote.amountOut.toString())
              .div(10 ** inactiveCoinMetadata.decimals)
              .times(inactiveUsdPrice)
          : "",
    [isFetchingQuote, inactiveUsdPrice, quote, inactiveCoinMetadata],
  );

  // Ratios
  const birdeyeRatio = getBirdeyeRatio(activeUsdPrice, inactiveUsdPrice);
  console.log("SwapTab - birdeyeRatio:", birdeyeRatio?.toString());

  // Value - max
  const onBalanceClick = () => {
    onValueChange(
      activeMaxValue.toFixed(activeCoinMetadata.decimals, BigNumber.ROUND_DOWN),
      true,
    );
    document.getElementById(getCoinInputId(activeCoinType))?.focus();
  };

  // Reverse
  const reverseAssets = () => {
    const newActiveCoinIndex = (1 - activeCoinIndex) as 0 | 1;
    const newActiveCoinType = pool.coinTypes[newActiveCoinIndex];
    const newInactiveCoinType = pool.coinTypes[1 - newActiveCoinIndex];

    setActiveCoinIndex(newActiveCoinIndex);

    setQuote(undefined);

    setTimeout(
      () => document.getElementById(getCoinInputId(newActiveCoinType))?.focus(),
      50,
    );

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
      isDisabled: isFetchingQuote || !quote,
      title: "Swap",
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
        appData.coinMetadataMap[coinTypeA],
        appData.coinMetadataMap[coinTypeB],
      ];

      const amountIn = quote.amountIn.toString();
      const minAmountOut = new BigNumber(quote.amountOut.toString())
        .div(1 + slippagePercent / 100)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const transaction = new Transaction();

      const coinA =
        activeCoinIndex === 0
          ? coinWithBalance({
              balance: BigInt(amountIn),
              type: coinTypeA,
              useGasCoin: isSui(coinTypeA),
            })(transaction)
          : steammClient.fullClient.zeroCoin(transaction, coinTypeA);
      const coinB =
        activeCoinIndex === 0
          ? steammClient.fullClient.zeroCoin(transaction, coinTypeB)
          : coinWithBalance({
              balance: BigInt(amountIn),
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

      const res = await signExecuteAndWaitForTransaction(transaction, {
        auction: true,
      });
      const txUrl = explorer.buildTxUrl(res.digest);

      const balanceChangeA = getBalanceChange(
        res,
        address,
        getToken(coinTypeA, appData.coinMetadataMap[coinTypeA]),
        activeCoinIndex === 0 ? -1 : 1,
      );
      const balanceChangeB = getBalanceChange(
        res,
        address,
        getToken(coinTypeB, appData.coinMetadataMap[coinTypeB]),
        activeCoinIndex === 0 ? 1 : -1,
      );

      const balanceChangeAFormatted = formatToken(
        balanceChangeA !== undefined
          ? balanceChangeA
          : new BigNumber(
              activeCoinIndex === 0
                ? quote.amountIn.toString()
                : quote.amountOut.toString(),
            ),
        { dp: coinMetadataA.decimals, trimTrailingZeros: true },
      );
      const balanceChangeBFormatted = formatToken(
        balanceChangeB !== undefined
          ? balanceChangeB
          : new BigNumber(
              activeCoinIndex === 0
                ? quote.amountOut.toString()
                : quote.amountIn.toString(),
            ),
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
      Sentry.captureException(err);
    } finally {
      document.getElementById(getCoinInputId(activeCoinType))?.focus();
      setIsSubmitting(false);
      refresh();
    }
  };

  return (
    <>
      <div className="relative flex w-full min-w-0 flex-col items-center gap-1">
        <CoinInput
          className="relative z-[1]"
          token={getToken(activeCoinType, activeCoinMetadata)}
          value={value}
          usdValue={activeUsdValue}
          onChange={(value) => onValueChange(value)}
          onBalanceClick={() => onBalanceClick()}
        />

        <ReverseAssetsButton onClick={reverseAssets} />

        <CoinInput
          className="relative z-[1]"
          token={getToken(inactiveCoinType, inactiveCoinMetadata)}
          value={
            isFetchingQuote
              ? undefined
              : quote
                ? formatTextInputValue(
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
          usdValue={inactiveUsdValue}
        />
      </div>

      {(isFetchingQuote || quote) && (
        <div className="flex w-full flex-col gap-2">
          <ExchangeRateParameter
            labelClassName="text-secondary-foreground"
            inToken={getToken(activeCoinType, activeCoinMetadata)}
            outToken={getToken(inactiveCoinType, inactiveCoinMetadata)}
            isFetchingQuote={isFetchingQuote}
            quote={quote}
            label=""
          />

          <PriceDifferenceLabel
            inToken={getToken(activeCoinType, activeCoinMetadata)}
            outToken={getToken(inactiveCoinType, inactiveCoinMetadata)}
            birdeyeRatio={birdeyeRatio}
            isFetchingQuote={isFetchingQuote}
            quote={quote}
          />
        </div>
      )}

      <SubmitButton
        submitButtonState={submitButtonState}
        onClick={onSubmitClick}
      />

      {(isFetchingQuote || quote) && (
        <div className="flex w-full flex-col gap-2">
          <Parameter label="Fees" isHorizontal>
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
          </Parameter>

          <Parameter label="Minimum inflow" isHorizontal>
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
          </Parameter>
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

  // USD prices - current
  const { tokenUsdPricesMap } = useTokenUsdPrices(pool.coinTypes);

  return (
    <div className="flex w-full flex-col gap-4 rounded-md border p-5">
      <div className="flex w-full flex-row justify-between">
        {/* Tabs */}
        <div className="flex flex-row">
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
                  "group relative flex h-8 flex-row px-2 transition-colors",
                  action === selectedAction ? "cursor-default" : "",
                )}
                onClick={() => onSelectedActionChange(action)}
              >
                <p
                  className={cn(
                    "!text-p2 transition-colors",
                    action === selectedAction
                      ? "text-foreground"
                      : "text-secondary-foreground group-hover:text-foreground",
                  )}
                >
                  {actionNameMap[action]}
                </p>
                <div
                  className={cn(
                    "absolute inset-x-0 top-full h-[2px] transition-all",
                    action === selectedAction
                      ? "bg-foreground"
                      : "bg-border group-hover:bg-foreground",
                  )}
                />
              </button>
            );
          })}
        </div>

        <SlippagePopover />
      </div>

      {selectedAction === Action.DEPOSIT && (
        <DepositTab tokenUsdPricesMap={tokenUsdPricesMap} />
      )}
      {selectedAction === Action.WITHDRAW && <WithdrawTab />}
      {selectedAction === Action.SWAP && (
        <SwapTab tokenUsdPricesMap={tokenUsdPricesMap} />
      )}
    </div>
  );
}
