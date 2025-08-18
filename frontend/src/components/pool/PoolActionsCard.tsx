import { useRouter } from "next/router";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Transaction, TransactionArgument } from "@mysten/sui/transactions";
import * as Sentry from "@sentry/nextjs";
import BigNumber from "bignumber.js";
import { debounce } from "lodash";
import { Plus } from "lucide-react";

import {
  ParsedObligation,
  QuoteProvider,
  createObligationIfNoneExists,
  getAggSortedQuotesAll,
  getSwapTransaction,
  sendObligationToUser,
} from "@suilend/sdk";
import {
  DepositQuote,
  ParsedPool,
  QuoterId,
  RedeemQuote,
  SteammSDK,
  SwapQuote,
} from "@suilend/steamm-sdk";
import {
  MAX_U64,
  formatToken,
  getAllCoins,
  getBalanceChange,
  getToken,
  isSui,
  mergeAllCoins,
} from "@suilend/sui-fe";
import {
  shallowPushQuery,
  shallowReplaceQuery,
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import CoinInput, { getCoinInputId } from "@/components/CoinInput";
import ExchangeRateParameter from "@/components/ExchangeRateParameter";
import Parameter from "@/components/Parameter";
import PercentInput from "@/components/PercentInput";
import SlippagePopover from "@/components/SlippagePopover";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import PriceDifferenceLabel from "@/components/swap/PriceDifferenceLabel";
import ReverseAssetsButton from "@/components/swap/ReverseAssetsButton";
import TokenLogo from "@/components/TokenLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { AppData, useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { useUserContext } from "@/contexts/UserContext";
import useCachedUsdPrices from "@/hooks/useCachedUsdPrices";
import { useAggSdks } from "@/lib/agg-swap";
import { rebalanceBanks } from "@/lib/banks";
import {
  MAX_BALANCE_SUI_SUBTRACTED_AMOUNT,
  MAX_DEPOSITS_PER_OBLIGATION,
} from "@/lib/constants";
import { formatPercentInputValue, formatTextInputValue } from "@/lib/format";
import {
  getIndexesOfObligationsWithDeposit,
  getObligationDepositPosition,
  getObligationDepositedAmount,
} from "@/lib/obligation";
import { getCachedUsdPriceRatio } from "@/lib/swap";
import { showSuccessTxnToast } from "@/lib/toasts";
import { cn } from "@/lib/utils";

enum Action {
  SWAP = "swap",
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

const actionNameMap: Record<Action, string> = {
  [Action.SWAP]: "Swap",
  [Action.DEPOSIT]: "Deposit",
  [Action.WITHDRAW]: "Withdraw",
};

enum QueryParams {
  ACTION = "action",
}

interface DepositTabProps {
  onDeposit: () => void;
}

function DepositTab({ onDeposit }: DepositTabProps) {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const {
    steammClient,
    appData,
    slippagePercent,
    openLedgerHashDialog,
    closeLedgerHashDialog,
  } = useLoadedAppContext();
  const { getBalance, userData, refresh } = useUserContext();
  const { pool } = usePoolContext();

  // send.ag
  const { sdkMap, partnerIdMap } = useAggSdks();

  const activeProviders = useMemo(
    () => [
      // QuoteProvider.AFTERMATH,
      QuoteProvider.CETUS,
      QuoteProvider._7K,
      QuoteProvider.FLOWX,
      // QuoteProvider.OKX_DEX,
    ],
    [],
  );

  // Deposited assets
  const [depositedIndexes, setDepositedIndexes] = useState<number[]>([0, 1]);

  // Value
  const dps = [
    appData.coinMetadataMap[pool.coinTypes[0]].decimals,
    appData.coinMetadataMap[pool.coinTypes[1]].decimals,
  ];

  const maxValues = pool.coinTypes.map((coinType, index) =>
    (isSui(coinType)
      ? BigNumber.max(
          0,
          getBalance(coinType).minus(MAX_BALANCE_SUI_SUBTRACTED_AMOUNT),
        )
      : getBalance(coinType)
    ).decimalPlaces(
      appData.coinMetadataMap[pool.coinTypes[index]].decimals,
      BigNumber.ROUND_DOWN,
    ),
  ) as [BigNumber, BigNumber];
  const smartMaxValues =
    pool.tvlUsd.eq(0) || depositedIndexes.length === 1
      ? maxValues
      : [
          BigNumber.min(
            maxValues[0],
            new BigNumber(
              maxValues[1].div(pool.balances[1]).times(pool.balances[0]),
            )
              .div(1 + slippagePercent / 100)
              .decimalPlaces(
                appData.coinMetadataMap[pool.coinTypes[1]].decimals,
                BigNumber.ROUND_DOWN,
              ),
          ),
          BigNumber.min(
            maxValues[1],
            new BigNumber(
              maxValues[0].div(pool.balances[0]).times(pool.balances[1]),
            )
              .div(1 + slippagePercent / 100)
              .decimalPlaces(
                appData.coinMetadataMap[pool.coinTypes[0]].decimals,
                BigNumber.ROUND_DOWN,
              ),
          ),
        ];

  const [values, setValues] = useState<[string, string]>(["", ""]);
  const [lastActiveInputIndex, setLastActiveInputIndex] = useState<
    number | undefined
  >(undefined);
  const [sliderValue, setSliderValue] = useState<string>("0");

  const [quote, setQuote] = useState<DepositQuote | undefined>(undefined);

  const onValueChange = (_value: string, index: number) => {
    console.log("DepositTab.onValueChange - _value:", _value, "index:", index);

    setValues(
      [0, 1].map((_index) =>
        _index === index
          ? formatTextInputValue(_value, dps[_index])
          : pool.tvlUsd.eq(0)
            ? values[_index]
            : formatTextInputValue(
                new BigNumber(_value || 0)
                  .div(pool.balances[1 - _index])
                  .times(pool.balances[_index])
                  .toFixed(dps[_index], BigNumber.ROUND_DOWN),
                dps[_index],
              ),
      ) as [string, string],
    );
    setLastActiveInputIndex(index);
    setSliderValue(
      new BigNumber(_value || 0)
        .div(smartMaxValues[index])
        .times(100)
        .toFixed(2),
    );

    setQuote(
      [0, 1].reduce(
        (acc, _index) => ({
          ...acc,
          [_index === 0 ? "depositA" : "depositB"]: BigInt(
            (_index === index
              ? new BigNumber(_value || 0)
              : pool.tvlUsd.eq(0)
                ? new BigNumber(values[_index] || 0)
                : new BigNumber(_value || 0)
                    .div(pool.balances[1 - _index])
                    .times(pool.balances[_index])
            )
              .times(10 ** dps[_index])
              .integerValue(BigNumber.ROUND_DOWN)
              .toString(),
          ),
        }),
        {} as DepositQuote,
      ),
    );
  };

  // Value - max
  const onBalanceClick = (index: number) => {
    const coinType = pool.coinTypes[index];

    onValueChange(
      smartMaxValues[index].toFixed(
        appData.coinMetadataMap[coinType].decimals,
        BigNumber.ROUND_DOWN,
      ),
      index,
    );
    document.getElementById(getCoinInputId(coinType))?.focus();
  };

  // Value - slider
  const onSliderValueChange = (percent: string) => {
    const formattedValue = formatPercentInputValue(percent, 2);

    const index = depositedIndexes.length === 1 ? depositedIndexes[0] : 0;

    onValueChange(
      smartMaxValues[index]
        .times(formattedValue || "0")
        .div(100)
        .toFixed(
          appData.coinMetadataMap[pool.coinTypes[index]].decimals,
          BigNumber.ROUND_DOWN,
        ),
      index,
    );

    setSliderValue(formattedValue);
  };

  // USD prices - current
  const usdValues = useMemo(
    () =>
      [0, 1].map((index) =>
        quote
          ? new BigNumber(
              (index === 0 ? quote.depositA : quote.depositB).toString(),
            )
              .div(
                10 ** appData.coinMetadataMap[pool.coinTypes[index]].decimals,
              )
              .times(pool.prices[index])
          : "",
      ),
    [quote, appData.coinMetadataMap, pool.coinTypes, pool.prices],
  );

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) return { isDisabled: true, isLoading: true };

    if (values.some((value) => value === ""))
      return { isDisabled: true, title: "Enter an amount" };
    if (values.some((value) => new BigNumber(value).lt(0)))
      return { isDisabled: true, title: "Enter a +ve amount" };
    if (values.some((value) => new BigNumber(value).eq(0)))
      return { isDisabled: true, title: "Enter a non-zero amount" };

    if (quote) {
      for (let i = 0; i < pool.coinTypes.length; i++) {
        const coinType = pool.coinTypes[i];
        if (depositedIndexes.length === 1 && i !== depositedIndexes[0])
          continue;

        if (
          getBalance(coinType).lt(
            new BigNumber(
              (i === 0 ? quote.depositA : quote.depositB).toString(),
            )
              .div(10 ** appData.coinMetadataMap[coinType].decimals)
              .times(
                i === lastActiveInputIndex || pool.tvlUsd.eq(0)
                  ? 1
                  : 1 + slippagePercent / 100,
              ),
          )
        )
          return {
            isDisabled: true,
            title: `Insufficient ${appData.coinMetadataMap[coinType].symbol}`,
          };
      }
    }

    return {
      isDisabled: !quote,
      title: "Deposit",
    };
  })();

  const onSubmitClick = async () => {
    console.log("DepositTab.onSubmitClick - quote:", quote);

    if (submitButtonState.isDisabled) return;

    if (userData === undefined) return;
    if (!address || !quote) return;

    try {
      setIsSubmitting(true);

      const [coinTypeA, coinTypeB] = pool.coinTypes;
      const [coinMetadataA, coinMetadataB] = [
        appData.coinMetadataMap[coinTypeA],
        appData.coinMetadataMap[coinTypeB],
      ];
      const [allCoinsA, allCoinsB] = await Promise.all([
        getAllCoins(suiClient, address, coinTypeA),
        getAllCoins(suiClient, address, coinTypeB),
      ]);

      let transaction = new Transaction();
      const [mergeCoinA, mergeCoinB] = [
        mergeAllCoins(coinTypeA, transaction, allCoinsA),
        mergeAllCoins(coinTypeB, transaction, allCoinsB),
      ];

      let maxA: bigint | TransactionArgument,
        maxB: bigint | TransactionArgument;
      let depositCoinA, depositCoinB;
      if (depositedIndexes.length === 1) {
        // Swap
        const index = depositedIndexes[0];

        const [indexCoinType, nonIndexCoinType] =
          index === 0 ? [coinTypeA, coinTypeB] : [coinTypeB, coinTypeA];
        const [indexCoinMetadata, nonIndexCoinMetadata] = [
          appData.coinMetadataMap[indexCoinType],
          appData.coinMetadataMap[nonIndexCoinType],
        ];
        const [allCoinsIndex, allCoinsNonIndex] =
          index === 0 ? [allCoinsA, allCoinsB] : [allCoinsB, allCoinsA];
        const [mergeCoinIndex, mergeCoinNonIndex] =
          index === 0 ? [mergeCoinA, mergeCoinB] : [mergeCoinB, mergeCoinA];

        const indexQuoteDeposit =
          index === 0 ? quote.depositA.toString() : quote.depositB.toString();

        const indexSwapAmountIn = new BigNumber(indexQuoteDeposit)
          .times(
            new BigNumber(1).minus(
              new BigNumber(pool.balances[index].times(pool.prices[index])).div(
                pool.tvlUsd,
              ),
            ),
          )
          .integerValue(BigNumber.ROUND_DOWN)
          .toString();
        const [indexSwapCoinIn] = transaction.splitCoins(
          isSui(indexCoinType)
            ? transaction.gas
            : transaction.object(mergeCoinIndex.coinObjectId),
          [BigInt(indexSwapAmountIn)],
        );

        const swapQuotes = await getAggSortedQuotesAll(
          sdkMap,
          activeProviders,
          getToken(indexCoinType, indexCoinMetadata),
          getToken(nonIndexCoinType, nonIndexCoinMetadata),
          indexSwapAmountIn,
        );
        const swapQuote = swapQuotes[0];
        if (!swapQuote) throw new Error("No swap quotes found");

        const { transaction: _transaction, coinOut: swapCoinOut } =
          await getSwapTransaction(
            suiClient,
            address,
            swapQuote,
            +slippagePercent,
            sdkMap,
            partnerIdMap,
            transaction,
            indexSwapCoinIn,
          );
        if (!swapCoinOut) throw new Error("Missing coin to deposit");

        transaction = _transaction;

        // Deposit
        const indexDepositAmount = new BigNumber(
          new BigNumber(indexQuoteDeposit).minus(indexSwapAmountIn),
        )
          .integerValue(BigNumber.ROUND_DOWN)
          .toString();
        const [indexDepositCoin] = transaction.splitCoins(
          isSui(indexCoinType)
            ? transaction.gas
            : transaction.object(mergeCoinIndex.coinObjectId),
          [BigInt(indexDepositAmount)],
        );

        maxA =
          index === 0
            ? BigInt(indexDepositAmount)
            : transaction.moveCall({
                target: "0x2::coin::value",
                typeArguments: [nonIndexCoinType],
                arguments: [swapCoinOut],
              });
        maxB =
          index === 0
            ? transaction.moveCall({
                target: "0x2::coin::value",
                typeArguments: [nonIndexCoinType],
                arguments: [swapCoinOut],
              })
            : BigInt(indexDepositAmount);

        depositCoinA = index === 0 ? indexDepositCoin : swapCoinOut;
        depositCoinB = index === 0 ? swapCoinOut : indexDepositCoin;
      } else {
        maxA = BigInt(
          new BigNumber(quote.depositA.toString())
            .times(
              lastActiveInputIndex === 0 || pool.tvlUsd.eq(0)
                ? 1
                : 1 + slippagePercent / 100,
            )
            .integerValue(BigNumber.ROUND_DOWN)
            .toString(),
        );
        maxB = BigInt(
          new BigNumber(quote.depositB.toString())
            .times(
              lastActiveInputIndex === 1 || pool.tvlUsd.eq(0)
                ? 1
                : 1 + slippagePercent / 100,
            )
            .integerValue(BigNumber.ROUND_DOWN)
            .toString(),
        );

        [depositCoinA] = transaction.splitCoins(
          isSui(coinTypeA)
            ? transaction.gas
            : transaction.object(mergeCoinA.coinObjectId),
          [maxA],
        );
        [depositCoinB] = transaction.splitCoins(
          isSui(coinTypeB)
            ? transaction.gas
            : transaction.object(mergeCoinB.coinObjectId),
          [maxB],
        );
      }

      const banks = [appData.bankMap[coinTypeA], appData.bankMap[coinTypeB]];

      const [lpCoin] = await steammClient.Pool.depositLiquidity(transaction, {
        coinA: depositCoinA,
        coinB: depositCoinB,
        maxA,
        maxB,
        poolInfo: pool.poolInfo,
        bankInfoA: banks[0].bankInfo,
        bankInfoB: banks[1].bankInfo,
      });
      transaction.transferObjects([depositCoinA, depositCoinB], address);

      rebalanceBanks(banks, steammClient, transaction);

      // Stake LP tokens (if reserve exists)
      if (!!appData.suilend.lmMarket.reserveMap[pool.lpTokenType]) {
        let obligationIndexes = getIndexesOfObligationsWithDeposit(
          userData.obligations,
          pool.lpTokenType,
        );
        if (obligationIndexes.length === 0)
          obligationIndexes = [
            userData.obligations.findIndex(
              (obligation) =>
                obligation.depositPositionCount < MAX_DEPOSITS_PER_OBLIGATION,
            ),
          ]; // Get first obligation with less than MAX_DEPOSITS_PER_OBLIGATION deposits (if any)
        console.log("XXX obligationIndexes:", obligationIndexes);

        const { obligationOwnerCapId, didCreate } =
          createObligationIfNoneExists(
            appData.suilend.lmMarket.suilendClient,
            transaction,
            obligationIndexes[0] !== -1
              ? userData.obligationOwnerCaps[obligationIndexes[0]] // Deposit into first obligation with deposits of the LP token type, or with less than 5 deposits
              : undefined, // Create obligation (no obligations OR no obligations with less than 5 deposits)
          );
        appData.suilend.lmMarket.suilendClient.deposit(
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

      const res = await signExecuteAndWaitForTransaction(
        transaction,
        undefined,
        (tx: Transaction) => openLedgerHashDialog(tx),
      );
      const txUrl = explorer.buildTxUrl(res.digest);

      const [depositedAmountA, depositedAmountB] = (() => {
        const depositResultEvent = res.events?.find(
          (event) =>
            event.type ===
              "0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261::events::Event<0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261::pool::DepositResult>" &&
            (event.parsedJson as any).event.pool_id === pool.id,
        );
        const mintBTokenEventA = res.events?.find(
          (event) =>
            event.type ===
              "0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261::events::Event<0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261::bank::MintBTokenEvent>" &&
            (event.parsedJson as any).event.bank_id ===
              appData.bankMap[coinTypeA].bankInfo.bankId,
        );
        const mintBTokenEventB = res.events?.find(
          (event) =>
            event.type ===
              "0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261::events::Event<0x4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261::bank::MintBTokenEvent>" &&
            (event.parsedJson as any).event.bank_id ===
              appData.bankMap[coinTypeB].bankInfo.bankId,
        );
        if (!depositResultEvent || !mintBTokenEventA || !mintBTokenEventB)
          return [undefined, undefined];

        const bTokenExchangeRateA = new BigNumber(
          (mintBTokenEventA.parsedJson as any).event.deposited_amount,
        ).div((mintBTokenEventA.parsedJson as any).event.minted_amount);
        const bTokenExchangeRateB = new BigNumber(
          (mintBTokenEventB.parsedJson as any).event.deposited_amount,
        ).div((mintBTokenEventB.parsedJson as any).event.minted_amount);

        const depositedAmountA = new BigNumber(
          (depositResultEvent.parsedJson as any).event.deposit_a,
        )
          .times(bTokenExchangeRateA)
          .div(10 ** appData.coinMetadataMap[coinTypeA].decimals);
        const depositedAmountB = new BigNumber(
          (depositResultEvent.parsedJson as any).event.deposit_b,
        )
          .times(bTokenExchangeRateB)
          .div(10 ** appData.coinMetadataMap[coinTypeB].decimals);
        return [depositedAmountA, depositedAmountB];
      })();

      onDeposit();
      showSuccessTxnToast(
        [
          "Deposited",
          depositedAmountA !== undefined
            ? formatToken(depositedAmountA, {
                dp: coinMetadataA.decimals,
                trimTrailingZeros: true,
              })
            : null,
          coinMetadataA.symbol,
          "and",
          depositedAmountB !== undefined
            ? formatToken(depositedAmountB, {
                dp: coinMetadataB.decimals,
                trimTrailingZeros: true,
              })
            : null,
          coinMetadataB.symbol,
        ]
          .filter(Boolean)
          .join(" "),
        txUrl,
      );

      setValues(["", ""]);
      setLastActiveInputIndex(undefined);
      setSliderValue("0");

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

      closeLedgerHashDialog();
    }
  };

  return (
    <>
      {/* Deposited assets */}
      {pool.tvlUsd.gt(0) && (
        <div className="relative flex w-full flex-row rounded-full bg-card/75">
          <Plus
            className={cn(
              "absolute left-1/2 top-1/2 z-[3] h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-secondary-foreground transition-opacity",
              depositedIndexes.length === 1 && "opacity-0",
            )}
          />
          {pool.coinTypes.map((coinType, index) => (
            <button
              key={coinType}
              className="group relative z-[2] flex h-10 flex-1 flex-row items-center justify-center rounded-full px-3"
              onClick={() =>
                setDepositedIndexes((prev) =>
                  prev.includes(index)
                    ? prev.length === 1
                      ? [0, 1]
                      : [index]
                    : [...prev, index],
                )
              }
            >
              <div className="flex flex-row items-center gap-2">
                <TokenLogo
                  token={getToken(coinType, appData.coinMetadataMap[coinType])}
                  size={16}
                />
                <p
                  className={cn(
                    "!text-p2 transition-colors",
                    depositedIndexes.includes(index)
                      ? "text-foreground"
                      : "text-secondary-foreground group-hover:text-foreground",
                  )}
                >
                  {appData.coinMetadataMap[coinType].symbol}
                </p>
              </div>
            </button>
          ))}
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 z-[1] rounded-full border border-button-1 bg-button-1/25",
              depositedIndexes.length === 2
                ? "inset-x-0"
                : cn(
                    "w-1/2",
                    depositedIndexes.includes(0) ? "left-0" : "right-0",
                  ),
            )}
          />
        </div>
      )}

      {pool.coinTypes.map((coinType, index) => (
        <Fragment key={index}>
          {depositedIndexes.includes(index) && (
            <CoinInput
              key={coinType}
              token={getToken(coinType, appData.coinMetadataMap[coinType])}
              value={values[index]}
              usdValue={usdValues[index]}
              onChange={(_value) => onValueChange(_value, index)}
              onMaxAmountClick={() => onBalanceClick(index)}
            />
          )}
        </Fragment>
      ))}

      {/* Slider */}
      {!pool.tvlUsd.eq(0) && (
        <div className="flex w-full flex-row items-center gap-2">
          <div className="relative flex h-4 flex-1 flex-row items-center">
            <div className="absolute inset-0 z-[1] rounded-[calc(16px/2)] bg-card/50" />

            {!(+sliderValue === Infinity || isNaN(+sliderValue)) && (
              <div
                className="absolute inset-y-0 left-0 z-[2] max-w-full rounded-l-[calc(16px/2)] bg-button-2"
                style={{
                  width: `calc(${16 / 2}px + ${sliderValue || "0"}% - ${((16 / 2) * 2 * +(sliderValue || "0")) / 100}px)`,
                }}
              />
            )}

            <div className="absolute inset-x-[calc(16px/2)] inset-y-0 z-[3]">
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
                "relative z-[4] h-6 w-full min-w-0 appearance-none bg-[transparent] !shadow-none !outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-[calc(16px/2)] [&::-webkit-slider-thumb]:bg-foreground",
                (+sliderValue === Infinity || isNaN(+sliderValue)) &&
                  "opacity-0",
              )}
              type="range"
              min={0}
              max={100}
              step={1}
              value={sliderValue || "0"}
              onChange={(e) => onSliderValueChange(e.target.value)}
              autoComplete="off"
            />
          </div>

          <button
            className="group flex h-10 flex-row items-center justify-center rounded-md bg-button-2 px-3 transition-colors hover:bg-button-2/80"
            onClick={() => onSliderValueChange("100")}
          >
            <p className="text-p2 text-button-2-foreground">Max</p>
          </button>

          <div className="w-24">
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
    </>
  );
}

interface WithdrawTabProps {
  onWithdraw: () => void;
}

function WithdrawTab({ onWithdraw }: WithdrawTabProps) {
  const { explorer, suiClient } = useSettingsContext();
  const { address, dryRunTransaction, signExecuteAndWaitForTransaction } =
    useWalletContext();
  const {
    steammClient,
    appData,
    slippagePercent,
    openLedgerHashDialog,
    closeLedgerHashDialog,
  } = useLoadedAppContext();
  const { getBalance, userData, refresh } = useUserContext();
  const { pool } = usePoolContext();

  const lpTokenBalance = getBalance(pool.lpTokenType);
  const lpTokenDepositedAmount = useMemo(() => {
    if (userData === undefined) return undefined;

    const obligationIndexes = getIndexesOfObligationsWithDeposit(
      userData.obligations,
      pool.lpTokenType,
    );

    return obligationIndexes.reduce(
      (acc, obligationIndex) =>
        acc.plus(
          getObligationDepositedAmount(
            userData.obligations[obligationIndex],
            pool.lpTokenType,
          ),
        ),
      new BigNumber(0),
    );
  }, [userData, pool.lpTokenType]);
  const lpTokenTotalAmount = lpTokenBalance.plus(lpTokenDepositedAmount ?? 0);

  // Value
  const dps = [
    appData.coinMetadataMap[pool.coinTypes[0]].decimals,
    appData.coinMetadataMap[pool.coinTypes[1]].decimals,
  ];

  const maxValues = [0, 1].map((index) =>
    lpTokenTotalAmount.div(pool.lpSupply).times(pool.balances[index]),
  );

  const [values, setValues] = useState<[string, string]>(["", ""]);
  const [sliderValue, setSliderValue] = useState<string>("0");

  const [quote, setQuote] = useState<RedeemQuote | undefined>(undefined);

  const onValueChange = (_value: string, index: number) => {
    console.log("WithdrawTab.onValueChange - _value:", _value, "index:", index);

    const lpTokens = new BigNumber(_value || 0).div(
      pool.balances[index].div(pool.lpSupply),
    );

    setValues(
      [0, 1].map((_index) =>
        _index === index
          ? formatTextInputValue(_value, dps[_index])
          : formatTextInputValue(
              lpTokens
                .div(pool.lpSupply)
                .times(pool.balances[_index])
                .toFixed(dps[_index], BigNumber.ROUND_DOWN),
              dps[_index],
            ),
      ) as [string, string],
    );
    setSliderValue(lpTokens.div(lpTokenTotalAmount).times(100).toFixed(2));

    setQuote(
      [0, 1].reduce(
        (acc, _index) => ({
          ...acc,
          [_index === 0 ? "withdrawA" : "withdrawB"]: BigInt(
            lpTokens
              .div(pool.lpSupply)
              .times(pool.balances[_index])
              .times(10 ** dps[_index])
              .integerValue(BigNumber.ROUND_DOWN)
              .toString(),
          ),
        }),
        {} as RedeemQuote,
      ),
    );
  };

  // Value - slider
  const onSliderValueChange = (_value: string) => {
    console.log("WithdrawTab.onSliderValueChange - _value:", _value);

    const lpTokens = lpTokenTotalAmount.times(+_value / 100);

    setValues(
      [0, 1].map((_index) =>
        formatTextInputValue(
          lpTokens
            .div(pool.lpSupply)
            .times(pool.balances[_index])
            .toFixed(dps[_index]),
          dps[_index],
        ),
      ) as [string, string],
    );
    setSliderValue(formatPercentInputValue(_value, 2));

    setQuote(
      [0, 1].reduce(
        (acc, _index) => ({
          ...acc,
          [_index === 0 ? "withdrawA" : "withdrawB"]: BigInt(
            lpTokens
              .div(pool.lpSupply)
              .times(pool.balances[_index])
              .times(10 ** dps[_index])
              .integerValue(BigNumber.ROUND_DOWN)
              .toString(),
          ),
        }),
        {} as RedeemQuote,
      ),
    );
  };

  // USD prices - current
  const usdValues = useMemo(
    () =>
      [0, 1].map((index) =>
        quote
          ? new BigNumber(
              (index === 0 ? quote.withdrawA : quote.withdrawB).toString(),
            )
              .div(
                10 ** appData.coinMetadataMap[pool.coinTypes[index]].decimals,
              )
              .times(pool.prices[index])
          : "",
      ),
    [quote, appData.coinMetadataMap, pool.coinTypes, pool.prices],
  );

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) return { isDisabled: true, isLoading: true };

    if (sliderValue === "")
      return { isDisabled: true, title: "Enter an amount" };
    if (new BigNumber(sliderValue).lt(0))
      return { isDisabled: true, title: "Enter a +ve amount" };
    if (
      new BigNumber(
        new BigNumber(sliderValue).div(100).times(lpTokenTotalAmount),
      ).eq(0)
    )
      return { isDisabled: true, title: "Enter a non-zero amount" };

    if (new BigNumber(sliderValue).gt(100))
      return {
        isDisabled: true,
        title: "Insufficient balance",
      };

    return {
      isDisabled: !quote,
      title: "Withdraw",
    };
  })();

  const buildTransaction = async (withoutProvision: boolean) => {
    if (userData === undefined) return;
    if (!address || !quote) return;

    const [lpTokenType, coinTypeA, coinTypeB] = [
      pool.lpTokenType,
      ...pool.coinTypes,
    ];
    const [coinMetadataLpToken, coinMetadataA, coinMetadataB] = [
      appData.coinMetadataMap[lpTokenType],
      appData.coinMetadataMap[coinTypeA],
      appData.coinMetadataMap[coinTypeB],
    ];
    const allCoinsLpToken = await getAllCoins(suiClient, address, lpTokenType);

    const lpTokenValue = lpTokenTotalAmount.times(sliderValue).div(100);

    const transaction = new Transaction();
    const mergeCoinLpToken = mergeAllCoins(
      lpTokenType,
      transaction,
      allCoinsLpToken,
    );

    let lpCoin;
    if (lpTokenBalance.gte(lpTokenValue)) {
      console.log("XXX withdraw from wallet");
      // Withdraw from wallet only
      [lpCoin] = transaction.splitCoins(
        transaction.object(mergeCoinLpToken.coinObjectId),
        [
          BigInt(
            new BigNumber(lpTokenValue)
              .times(10 ** coinMetadataLpToken.decimals)
              .integerValue(BigNumber.ROUND_DOWN)
              .toString(),
          ),
        ],
      );
    } else {
      const obligationIndexes = getIndexesOfObligationsWithDeposit(
        userData.obligations,
        pool.lpTokenType,
      );
      if (obligationIndexes.length === 0) throw Error("Obligation not found"); // Should never happen as the amount can't be greater than the balance if there are no deposits
      console.log("XXX obligationIndexes:", obligationIndexes);

      const lpCoins = [];
      if (lpTokenBalance.gt(0)) {
        // Withdraw MAX from wallet
        console.log("XXX withdraw MAX from wallet, and...");
        const [_lpCoin] = transaction.splitCoins(
          transaction.object(mergeCoinLpToken.coinObjectId),
          [
            BigInt(
              new BigNumber(lpTokenBalance)
                .times(10 ** coinMetadataLpToken.decimals)
                .integerValue(BigNumber.ROUND_DOWN)
                .toString(),
            ),
          ],
        );
        lpCoins.push(_lpCoin);
      }

      if (lpTokenValue.eq(lpTokenTotalAmount)) {
        for (const obligationIndex of obligationIndexes) {
          // Withdraw MAX from obligation
          console.log("XXX withdraw MAX from obligation", obligationIndex);

          const submitAmount = MAX_U64.toString();

          const [_lpCoin] =
            await appData.suilend.lmMarket.suilendClient.withdraw(
              userData.obligationOwnerCaps[obligationIndex].id,
              userData.obligations[obligationIndex].id,
              pool.lpTokenType,
              submitAmount,
              transaction,
            );
          lpCoins.push(_lpCoin);
        }
      } else {
        const lpTokenDepositPositions = obligationIndexes.map(
          (obligationIndex) =>
            getObligationDepositPosition(
              userData.obligations[obligationIndex],
              pool.lpTokenType,
            ),
        ) as ParsedObligation["deposits"][0][];
        if (lpTokenDepositPositions.length === 0) return; // Should never happen as obligationIndexes.length !== 0
        console.log("XXX lpTokenDepositPositions:", lpTokenDepositPositions);

        const requiredCtokenAmount = new BigNumber(
          new BigNumber(lpTokenValue.minus(lpTokenBalance))
            .times(10 ** coinMetadataLpToken.decimals)
            .integerValue(BigNumber.ROUND_DOWN)
            .toString(),
        )
          .div(
            appData.suilend.lmMarket.reserveMap[pool.lpTokenType]
              .cTokenExchangeRate,
          )
          .integerValue(BigNumber.ROUND_UP);
        let withdrawnCtokenAmount = new BigNumber(0);

        for (const obligationIndex of obligationIndexes) {
          const remainingCtokenAmount = requiredCtokenAmount.minus(
            withdrawnCtokenAmount,
          );
          if (remainingCtokenAmount.eq(0)) break;

          let submitAmount;
          if (
            remainingCtokenAmount.gte(
              lpTokenDepositPositions[obligationIndex].depositedCtokenAmount,
            )
          ) {
            submitAmount = MAX_U64.toString();
            withdrawnCtokenAmount = withdrawnCtokenAmount.plus(
              lpTokenDepositPositions[obligationIndex].depositedCtokenAmount,
            );

            // Withdraw MAX from obligation
            console.log("XXX withdraw MAX from obligation", obligationIndex);
          } else {
            submitAmount = remainingCtokenAmount.toString();
            withdrawnCtokenAmount = withdrawnCtokenAmount.plus(submitAmount);

            // Withdraw from obligation
            console.log(
              "XXX withdraw from obligation",
              obligationIndex,
              submitAmount,
            );
          }

          const [_lpCoin] =
            await appData.suilend.lmMarket.suilendClient.withdraw(
              userData.obligationOwnerCaps[obligationIndex].id,
              userData.obligations[obligationIndex].id,
              pool.lpTokenType,
              submitAmount,
              transaction,
            );
          lpCoins.push(_lpCoin);
        }
      }

      // Merge coins (if multiple)
      console.log("XXX444 lpCoins:", lpCoins);
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
    const submitAmountA = new BigNumber(quote.withdrawA.toString())
      .div(1 + slippagePercent / 100)
      .integerValue(BigNumber.ROUND_DOWN)
      .toString();
    const submitAmountB = new BigNumber(quote.withdrawB.toString())
      .div(1 + slippagePercent / 100)
      .integerValue(BigNumber.ROUND_DOWN)
      .toString();

    const redeemFunc = (
      withoutProvision
        ? steammClient.Pool.redeemLiquidity
        : steammClient.Pool.redeemLiquidityWithProvision
    ).bind(steammClient.Pool);

    const banks = [appData.bankMap[coinTypeA], appData.bankMap[coinTypeB]];

    const [coinA, coinB] = await redeemFunc(transaction, {
      lpCoin: transaction.object(lpCoin),
      minA: BigInt(submitAmountA),
      minB: BigInt(submitAmountB),
      poolInfo: pool.poolInfo,
      bankInfoA: banks[0].bankInfo,
      bankInfoB: banks[1].bankInfo,
    });
    transaction.transferObjects([coinA, coinB], address);

    rebalanceBanks(banks, steammClient, transaction);

    return transaction;
  };

  const onSubmitClick = async () => {
    console.log("WithdrawTab.onSubmitClick - quote:", quote);

    if (submitButtonState.isDisabled) return;

    if (userData === undefined) return;
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

      let transaction = await buildTransaction(true); // Try without provision first
      if (!transaction) return;

      let didFailWithoutProvision = false;
      try {
        await dryRunTransaction(transaction);
      } catch (err) {
        didFailWithoutProvision = true;
      }

      if (didFailWithoutProvision) {
        transaction = await buildTransaction(false); // With provision if failed
        if (!transaction) return;
      }

      const res = await signExecuteAndWaitForTransaction(
        transaction,
        undefined,
        (tx: Transaction) => openLedgerHashDialog(tx),
      );
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

      onWithdraw();
      showSuccessTxnToast(
        [
          "Withdrew",
          balanceChangeA !== undefined
            ? formatToken(balanceChangeA, {
                dp: coinMetadataA.decimals,
                trimTrailingZeros: true,
              })
            : null,
          coinMetadataA.symbol,
          "and",
          balanceChangeB !== undefined
            ? formatToken(balanceChangeB, {
                dp: coinMetadataB.decimals,
                trimTrailingZeros: true,
              })
            : null,
          coinMetadataB.symbol,
        ]
          .filter(Boolean)
          .join(" "),
        txUrl,
      );

      setValues(["", ""]);
      setSliderValue("0");

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

      closeLedgerHashDialog();
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
          value={values[index]}
          usdValue={usdValues[index]}
          onChange={(_value) => onValueChange(_value, index)}
          maxAmountDecorator={
            <p className="text-p2 text-secondary-foreground transition-colors group-hover:text-foreground">
              Max
            </p>
          }
          maxAmount={maxValues[index]}
          onMaxAmountClick={() => onSliderValueChange("100")}
        />
      ))}

      {/* Slider */}
      {!pool.tvlUsd.eq(0) && (
        <div className="flex w-full flex-row items-center gap-2">
          <div className="relative flex h-4 flex-1 flex-row items-center">
            <div className="absolute inset-0 z-[1] rounded-[calc(16px/2)] bg-card/50" />

            {!(+sliderValue === Infinity || isNaN(+sliderValue)) && (
              <div
                className="absolute inset-y-0 left-0 z-[2] max-w-full rounded-l-[calc(16px/2)] bg-button-2"
                style={{
                  width: `calc(${16 / 2}px + ${sliderValue || "0"}% - ${((16 / 2) * 2 * +(sliderValue || "0")) / 100}px)`,
                }}
              />
            )}

            <div className="absolute inset-x-[calc(16px/2)] inset-y-0 z-[3]">
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
                "relative z-[4] h-6 w-full min-w-0 appearance-none bg-[transparent] !shadow-none !outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-[calc(16px/2)] [&::-webkit-slider-thumb]:bg-foreground",
                (+sliderValue === Infinity || isNaN(+sliderValue)) &&
                  "opacity-0",
              )}
              type="range"
              min={0}
              max={100}
              step={1}
              value={sliderValue || "0"}
              onChange={(e) => onSliderValueChange(e.target.value)}
              autoComplete="off"
            />
          </div>

          <button
            className="group flex h-10 flex-row items-center justify-center rounded-md bg-button-2 px-3 transition-colors hover:bg-button-2/80"
            onClick={() => onSliderValueChange("100")}
          >
            <p className="text-p2 text-button-2-foreground">Max</p>
          </button>

          <div className="w-24">
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
    </>
  );
}

interface SwapTabProps {
  onSwap: () => void;
  isCpmmOffsetPoolWithNoQuoteAssets: boolean;
}

function SwapTab({ onSwap, isCpmmOffsetPoolWithNoQuoteAssets }: SwapTabProps) {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const {
    steammClient,
    appData,
    slippagePercent,
    openLedgerHashDialog,
    closeLedgerHashDialog,
  } = useLoadedAppContext();
  const { getBalance, refresh } = useUserContext();
  const { pool, isOmmV2Paused } = usePoolContext();

  // CoinTypes
  const [activeCoinIndex, setActiveCoinIndex] = useState<0 | 1>(
    isCpmmOffsetPoolWithNoQuoteAssets ? 1 : 0,
  );
  const activeCoinType = pool.coinTypes[activeCoinIndex];
  const activeCoinMetadata = appData.coinMetadataMap[activeCoinType];

  const inactiveCoinIndex = (1 - activeCoinIndex) as 0 | 1;
  const inactiveCoinType = pool.coinTypes[inactiveCoinIndex];
  const inactiveCoinMetadata = appData.coinMetadataMap[inactiveCoinType];

  // Value
  const activeMaxValue = isSui(activeCoinType)
    ? BigNumber.max(
        0,
        getBalance(activeCoinType).minus(MAX_BALANCE_SUI_SUBTRACTED_AMOUNT),
      )
    : getBalance(activeCoinType);

  const [value, setValue] = useState<string>("");
  const valueRef = useRef<string>(value);

  const [isFetchingQuote, setIsFetchingQuote] = useState<boolean>(false);
  const [quote, setQuote] = useState<SwapQuote | undefined>(undefined);

  const fetchQuote = useCallback(
    async (
      _steammClient: SteammSDK,
      _value: string,
      _bankMap: AppData["bankMap"] | undefined,
      _pool: ParsedPool,
      _activeCoinIndex: number,
    ) => {
      console.log(
        "SwapTab.fetchQuote - _value(=formattedValue):",
        _value,
        "_bankMap:",
        _bankMap,
        "_pool:",
        _pool,
        "_activeCoinIndex:",
        _activeCoinIndex,
        "valueRef.current:",
        valueRef.current,
      );

      if (_bankMap === undefined) return;
      if (valueRef.current !== _value) return;

      try {
        const submitAmount = new BigNumber(_value)
          .times(
            10 **
              appData.coinMetadataMap[_pool.coinTypes[_activeCoinIndex]]
                .decimals,
          )
          .integerValue(BigNumber.ROUND_DOWN)
          .toString();

        const quote = await _steammClient.Pool.quoteSwap({
          a2b: _activeCoinIndex === 0,
          amountIn: BigInt(submitAmount),
          poolInfo: _pool.poolInfo,
          bankInfoA: _bankMap[_pool.coinTypes[0]].bankInfo,
          bankInfoB: _bankMap[_pool.coinTypes[1]].bankInfo,
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
    [appData.coinMetadataMap],
  );
  const debouncedFetchQuote = useRef(debounce(fetchQuote, 100)).current;

  const onValueChange = (_value: string, isImmediate?: boolean) => {
    console.log(
      "SwapTab.onValueChange - _value:",
      _value,
      "isImmediate:",
      isImmediate,
    );

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
      appData.bankMap,
      pool,
      activeCoinIndex,
    );
  };

  // USD prices - current
  const activeUsdValue = useMemo(
    () =>
      isFetchingQuote
        ? undefined
        : quote
          ? new BigNumber(quote.amountIn.toString())
              .div(10 ** activeCoinMetadata.decimals)
              .times(pool.prices[activeCoinIndex])
          : "",
    [isFetchingQuote, quote, activeCoinMetadata, pool.prices, activeCoinIndex],
  );
  const inactiveUsdValue = useMemo(
    () =>
      isFetchingQuote
        ? undefined
        : quote
          ? new BigNumber(quote.amountOut.toString())
              .div(10 ** inactiveCoinMetadata.decimals)
              .times(pool.prices[inactiveCoinIndex])
          : "",
    [
      isFetchingQuote,
      quote,
      inactiveCoinMetadata,
      pool.prices,
      inactiveCoinIndex,
    ],
  );

  // Cached USD prices - current
  const { cachedUsdPricesMap } = useCachedUsdPrices(pool.coinTypes);

  // Ratios
  const cachedUsdPriceRatio = useMemo(
    () =>
      getCachedUsdPriceRatio(
        cachedUsdPricesMap[activeCoinType],
        cachedUsdPricesMap[inactiveCoinType],
      ),
    [cachedUsdPricesMap, activeCoinType, inactiveCoinType],
  );
  // console.log("SwapTab - cachedUsdPriceRatio:", cachedUsdPriceRatio);

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
    fetchQuote(steammClient, value, appData.bankMap, pool, newActiveCoinIndex);
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

    if (quote) {
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

      if (new BigNumber(quote.amountOut.toString()).eq(0))
        return {
          isDisabled: true,
          title: "Quote not available",
          description: `Insufficient ${inactiveCoinMetadata.symbol} liquidity to execute swap`,
        };
    }

    return {
      isDisabled:
        isFetchingQuote ||
        !quote ||
        (pool.quoterId === QuoterId.ORACLE_V2 && isOmmV2Paused),
      title: "Swap",
    };
  })();

  const onSubmitClick = async () => {
    console.log("SwapTab.onSubmitClick - quote:", quote);

    if (submitButtonState.isDisabled) return;

    if (!address || !quote) return;

    try {
      setIsSubmitting(true);

      const [coinTypeA, coinTypeB] = pool.coinTypes;
      const [coinMetadataA, coinMetadataB] = [
        appData.coinMetadataMap[coinTypeA],
        appData.coinMetadataMap[coinTypeB],
      ];
      const [allCoinsA, allCoinsB] = await Promise.all([
        getAllCoins(suiClient, address, coinTypeA),
        getAllCoins(suiClient, address, coinTypeB),
      ]);

      const amountIn = quote.amountIn.toString();
      const minAmountOut = new BigNumber(quote.amountOut.toString())
        .div(1 + slippagePercent / 100)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const transaction = new Transaction();
      const [mergeCoinA, mergeCoinB] = [
        mergeAllCoins(coinTypeA, transaction, allCoinsA),
        mergeAllCoins(coinTypeB, transaction, allCoinsB),
      ];

      const coinA =
        activeCoinIndex === 0
          ? transaction.splitCoins(
              isSui(coinTypeA)
                ? transaction.gas
                : transaction.object(mergeCoinA.coinObjectId),
              [BigInt(amountIn)],
            )
          : steammClient.fullClient.zeroCoin(transaction, coinTypeA);
      const coinB =
        activeCoinIndex === 0
          ? steammClient.fullClient.zeroCoin(transaction, coinTypeB)
          : transaction.splitCoins(
              isSui(coinTypeB)
                ? transaction.gas
                : transaction.object(mergeCoinB.coinObjectId),
              [BigInt(amountIn)],
            );

      const banks = [appData.bankMap[coinTypeA], appData.bankMap[coinTypeB]];

      await steammClient.Pool.swap(transaction, {
        coinA,
        coinB,
        a2b: activeCoinIndex === 0,
        amountIn: BigInt(amountIn),
        minAmountOut: BigInt(minAmountOut),
        poolInfo: pool.poolInfo,
        bankInfoA: banks[0].bankInfo,
        bankInfoB: banks[1].bankInfo,
      });
      transaction.transferObjects([coinA, coinB], address);

      rebalanceBanks(banks, steammClient, transaction);

      const res = await signExecuteAndWaitForTransaction(
        transaction,
        { auction: true },
        (tx: Transaction) => openLedgerHashDialog(tx),
      );
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

      const balanceChangeIn =
        activeCoinIndex === 0 ? balanceChangeA : balanceChangeB;
      const balanceChangeOut =
        activeCoinIndex === 0 ? balanceChangeB : balanceChangeA;

      const inCoinMetadata =
        activeCoinIndex === 0 ? coinMetadataA : coinMetadataB;
      const outCoinMetadata =
        activeCoinIndex === 0 ? coinMetadataB : coinMetadataA;

      onSwap();
      showSuccessTxnToast(
        [
          "Swapped",
          balanceChangeIn !== undefined
            ? formatToken(balanceChangeIn, {
                dp: inCoinMetadata.decimals,
                trimTrailingZeros: true,
              })
            : null,
          inCoinMetadata.symbol,
          "for",
          balanceChangeOut !== undefined
            ? formatToken(balanceChangeOut, {
                dp: outCoinMetadata.decimals,
                trimTrailingZeros: true,
              })
            : null,
          outCoinMetadata.symbol,
        ]
          .filter(Boolean)
          .join(" "),
        txUrl,
      );

      valueRef.current = "";
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

      closeLedgerHashDialog();
    }
  };

  return (
    <>
      <div
        className={cn(
          "relative flex w-full min-w-0 flex-col items-center",
          isCpmmOffsetPoolWithNoQuoteAssets ? "gap-4" : "gap-2",
        )}
      >
        <CoinInput
          className="relative z-[1]"
          token={getToken(activeCoinType, activeCoinMetadata)}
          value={value}
          usdValue={activeUsdValue}
          onChange={(value) => onValueChange(value)}
          onMaxAmountClick={() => onBalanceClick()}
        />

        {!isCpmmOffsetPoolWithNoQuoteAssets && (
          <ReverseAssetsButton onClick={reverseAssets} />
        )}

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
            priceLabelClassName="text-tertiary-foreground"
            inToken={getToken(activeCoinType, activeCoinMetadata)}
            inPrice={pool.prices[activeCoinIndex]}
            outToken={getToken(inactiveCoinType, inactiveCoinMetadata)}
            outPrice={pool.prices[inactiveCoinIndex]}
            isFetchingQuote={isFetchingQuote}
            quote={quote}
            isInverted
            label=""
          />

          <PriceDifferenceLabel
            inToken={getToken(activeCoinType, activeCoinMetadata)}
            outToken={getToken(inactiveCoinType, inactiveCoinMetadata)}
            cachedUsdPriceRatio={cachedUsdPriceRatio}
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
          <Parameter label="Minimum inflow" isHorizontal>
            {isFetchingQuote || !quote ? (
              <Skeleton className="h-[21px] w-24" />
            ) : (
              <div className="flex flex-row items-center gap-2">
                <TokenLogo
                  token={getToken(inactiveCoinType, inactiveCoinMetadata)}
                  size={16}
                />
                <p className="text-p2 text-foreground">
                  {formatToken(
                    new BigNumber(quote.amountOut.toString())
                      .div(1 + slippagePercent / 100)
                      .div(10 ** inactiveCoinMetadata.decimals),
                    { dp: inactiveCoinMetadata.decimals },
                  )}{" "}
                  {inactiveCoinMetadata.symbol}
                </p>
              </div>
            )}
          </Parameter>
        </div>
      )}
    </>
  );
}

interface PoolActionsCardProps {
  onSwap: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
}

export default function PoolActionsCard({
  onSwap,
  onDeposit,
  onWithdraw,
}: PoolActionsCardProps) {
  const router = useRouter();
  const queryParams = useMemo(
    () => ({
      [QueryParams.ACTION]: router.query[QueryParams.ACTION] as
        | Action
        | undefined,
    }),
    [router.query],
  );

  const { pool } = usePoolContext();

  const isCpmmOffsetPoolWithNoQuoteAssets = useMemo(
    () => pool.quoterId === QuoterId.V_CPMM && pool.balances[1].eq(0),
    [pool.quoterId, pool.balances],
  );

  // Tabs
  const selectedAction = useMemo(
    () =>
      queryParams[QueryParams.ACTION] &&
      Object.values(Action).includes(queryParams[QueryParams.ACTION])
        ? queryParams[QueryParams.ACTION]
        : Action.SWAP,
    [queryParams],
  );
  useEffect(() => {
    if (queryParams[QueryParams.ACTION] === Action.DEPOSIT) {
      if (
        pool.quoterId === QuoterId.ORACLE ||
        isCpmmOffsetPoolWithNoQuoteAssets
      )
        shallowReplaceQuery(router, {
          ...router.query,
          [QueryParams.ACTION]: Action.SWAP,
        });
    } else if (queryParams[QueryParams.ACTION] === Action.WITHDRAW) {
      if (isCpmmOffsetPoolWithNoQuoteAssets)
        shallowReplaceQuery(router, {
          ...router.query,
          [QueryParams.ACTION]: Action.SWAP,
        });
    }
  }, [queryParams, pool.quoterId, isCpmmOffsetPoolWithNoQuoteAssets, router]);
  const onSelectedActionChange = (action: Action) => {
    shallowPushQuery(router, { ...router.query, [QueryParams.ACTION]: action });
  };

  return (
    <div className="flex w-full flex-col gap-4 rounded-md border p-5">
      <div className="flex w-full flex-row justify-between">
        {/* Tabs */}
        <div className="flex flex-row">
          {Object.values(Action).map((action) => {
            if (action === Action.DEPOSIT) {
              if (
                pool.quoterId === QuoterId.ORACLE ||
                isCpmmOffsetPoolWithNoQuoteAssets
              )
                return null;
            }
            if (action === Action.WITHDRAW) {
              if (isCpmmOffsetPoolWithNoQuoteAssets) return null;
            }

            return (
              <button
                key={action}
                className={cn(
                  "group relative flex h-8 flex-row px-3 transition-colors",
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

      {selectedAction === Action.SWAP && (
        <SwapTab
          onSwap={onSwap}
          isCpmmOffsetPoolWithNoQuoteAssets={isCpmmOffsetPoolWithNoQuoteAssets}
        />
      )}
      {selectedAction === Action.DEPOSIT &&
        !(
          pool.quoterId === QuoterId.ORACLE || isCpmmOffsetPoolWithNoQuoteAssets
        ) && <DepositTab onDeposit={onDeposit} />}
      {selectedAction === Action.WITHDRAW &&
        !isCpmmOffsetPoolWithNoQuoteAssets && (
          <WithdrawTab onWithdraw={onWithdraw} />
        )}
    </div>
  );
}
