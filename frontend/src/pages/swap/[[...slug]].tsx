import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useMemo, useRef, useState } from "react";

import { AggregatorClient as CetusSdk } from "@cetusprotocol/aggregator-sdk";
import { AggregatorQuoter as FlowXAggregatorQuoter } from "@flowx-finance/sdk";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import * as Sentry from "@sentry/nextjs";
import { Aftermath as AftermathSdk } from "aftermath-ts-sdk";
import BigNumber from "bignumber.js";
import { clone, debounce } from "lodash";

import {
  QuoteProvider,
  StandardizedQuote,
  getAggSortedQuotesAll,
} from "@suilend/sdk";
import { ParsedPool } from "@suilend/steamm-sdk";
import {
  NORMALIZED_SEND_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  Token,
  formatToken,
  getBalanceChange,
  getToken,
  isSui,
} from "@suilend/sui-fe";
import {
  shallowPushQuery,
  shallowReplaceQuery,
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";
import useIsTouchscreen from "@suilend/sui-fe-next/hooks/useIsTouchscreen";

import CoinInput, { getCoinInputId } from "@/components/CoinInput";
import Parameter from "@/components/Parameter";
import SuggestedPools from "@/components/pool/SuggestedPools";
import SlippagePopover from "@/components/SlippagePopover";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import PriceDifferenceLabel from "@/components/swap/PriceDifferenceLabel";
import ReverseAssetsButton from "@/components/swap/ReverseAssetsButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import useCachedUsdPrices from "@/hooks/useCachedUsdPrices";
import { useAggSdks } from "@/lib/agg-swap";
import { rebalanceBanks } from "@/lib/banks";
import { MAX_BALANCE_SUI_SUBTRACTED_AMOUNT } from "@/lib/constants";
import { formatTextInputValue } from "@/lib/format";
import { getAvgPoolPrice } from "@/lib/pools";
import { getCachedUsdPriceRatio } from "@/lib/swap";
import { showSuccessTxnToast } from "@/lib/toasts";
import { TokenDirection } from "@/lib/types";

export default function SwapPage() {
  const router = useRouter();
  const slug = router.query.slug as string[] | undefined;

  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData, slippagePercent } = useLoadedAppContext();
  const { getBalance, refresh } = useUserContext();

  const isTouchscreen = useIsTouchscreen();

  // send.ag
  const { sdkMap, partnerIdMap } = useAggSdks();

  const activeProviders = useMemo(
    () => [
      QuoteProvider.AFTERMATH,
      QuoteProvider.CETUS,
      QuoteProvider._7K,
      QuoteProvider.FLOWX,
      // QuoteProvider.OKX_DEX,
    ],
    [],
  );

  // CoinTypes
  const [inCoinType, outCoinType] = useMemo(() => {
    if (
      !slug ||
      slug.length !== 1 ||
      slug[0].split("-").length !== 2 ||
      slug[0]
        .split("-")
        .some(
          (symbol) =>
            !Object.values(appData.coinMetadataMap).find(
              (coinMetadata) => coinMetadata.symbol === symbol,
            ),
        )
    ) {
      shallowReplaceQuery(router, {
        slug: "SUI-SEND",
      });
      return [NORMALIZED_SUI_COINTYPE, NORMALIZED_SEND_COINTYPE];
    }

    return slug[0].split("-").map((symbol) => {
      return Object.entries(appData.coinMetadataMap).find(
        ([coinType, coinMetadata]) => coinMetadata.symbol === symbol,
      )![0];
    });
  }, [slug, appData.coinMetadataMap, router]);

  const [inCoinMetadata, outCoinMetadata] = [
    appData.coinMetadataMap[inCoinType],
    appData.coinMetadataMap[outCoinType],
  ];

  // Value
  const inMaxValue = isSui(inCoinType)
    ? BigNumber.max(
        0,
        getBalance(inCoinType).minus(MAX_BALANCE_SUI_SUBTRACTED_AMOUNT),
      )
    : getBalance(inCoinType);

  const valueRef = useRef<string>("");
  const [value, setValue] = useState<string>("");

  const [isFetchingQuote, setIsFetchingQuote] = useState<boolean>(false);
  const [quote, setQuote] = useState<StandardizedQuote | undefined>(undefined);

  const fetchQuote = useCallback(
    async (
      _sdkMap: {
        [QuoteProvider.AFTERMATH]: AftermathSdk;
        [QuoteProvider.CETUS]: CetusSdk;
        [QuoteProvider.FLOWX]: FlowXAggregatorQuoter;
      },
      _activeProviders: QuoteProvider[],
      _tokenIn: Token,
      _tokenOut: Token,
      _value: string,
    ) => {
      console.log(
        "SwapPage.fetchQuote",
        { _sdkMap, _activeProviders, _tokenIn, _tokenOut, _value },
        "valueRef.current:",
        valueRef.current,
      );

      if (valueRef.current !== _value) return;

      try {
        const amountIn = new BigNumber(_value)
          .times(10 ** _tokenIn.decimals)
          .integerValue(BigNumber.ROUND_DOWN)
          .toString();

        const swapQuotes = await getAggSortedQuotesAll(
          _sdkMap,
          _activeProviders,
          _tokenIn,
          _tokenOut,
          amountIn,
        );
        console.log("SwapPage.fetchQuote - swapQuotes:", swapQuotes);

        const sortedSwapQuotes = (
          swapQuotes.filter(Boolean) as StandardizedQuote[]
        )
          .slice()
          .sort((a, b) => +b.out.amount.minus(a.out.amount));
        if (sortedSwapQuotes.length === 0) throw new Error("No quotes found");

        const swapQuote = sortedSwapQuotes[0]; // Best quote by amount out

        if (valueRef.current !== _value) return;

        setIsFetchingQuote(false);
        setQuote(swapQuote);
      } catch (err) {
        showErrorToast("Failed to fetch quote", err as Error);
        console.error(err);
      }
    },
    [],
  );
  const debouncedFetchQuote = useRef(debounce(fetchQuote, 100)).current;

  const onValueChange = (_value: string, isImmediate?: boolean) => {
    console.log("SwapPage.onValueChange - _value:", _value);

    const formattedValue = formatTextInputValue(
      _value,
      inCoinMetadata.decimals,
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
      sdkMap,
      activeProviders,
      getToken(inCoinType, inCoinMetadata),
      getToken(outCoinType, outCoinMetadata),
      formattedValue,
    );
  };

  // USD prices - current
  const inPoolPrice = getAvgPoolPrice(appData.pools, inCoinType)!;
  const outPoolPrice = getAvgPoolPrice(appData.pools, outCoinType)!;

  const inUsdValue = useMemo(
    () =>
      isFetchingQuote || inPoolPrice === undefined
        ? undefined
        : quote
          ? quote.in.amount.times(inPoolPrice)
          : "",
    [isFetchingQuote, inPoolPrice, quote],
  );
  console.log("XXXX", +quote?.in.amount, +quote?.out.amount);
  const outUsdValue = useMemo(
    () =>
      isFetchingQuote || outPoolPrice === undefined
        ? undefined
        : quote
          ? quote.out.amount.times(outPoolPrice)
          : "",
    [isFetchingQuote, outPoolPrice, quote],
  );

  // Cached USD prices - current
  const { cachedUsdPricesMap, fetchCachedUsdPrice } = useCachedUsdPrices([
    inCoinType,
    outCoinType,
  ]);

  // Ratios
  const cachedUsdPriceRatio = useMemo(
    () =>
      getCachedUsdPriceRatio(
        cachedUsdPricesMap[inCoinType],
        cachedUsdPricesMap[outCoinType],
      ),
    [cachedUsdPricesMap, inCoinType, outCoinType],
  );
  // console.log("SwapPage - cachedUsdPriceRatio:", cachedUsdPriceRatio, cachedUsdPricesMap);

  // Value - max
  const onBalanceClick = () => {
    onValueChange(
      inMaxValue.toFixed(inCoinMetadata.decimals, BigNumber.ROUND_DOWN),
      true,
    );
    document.getElementById(getCoinInputId(inCoinType))?.focus();
  };

  // Select
  const tokens: Token[] | undefined = useMemo(
    () =>
      Object.values(appData.bTokenTypeCoinTypeMap)
        .sort(
          (a, b) =>
            appData.coinMetadataMap[a].symbol.toLowerCase() <
            appData.coinMetadataMap[b].symbol.toLowerCase()
              ? -1
              : 1, // Sort by symbol (ascending)
        )
        .map((coinType) =>
          getToken(coinType, appData.coinMetadataMap[coinType]),
        ),
    [appData.bTokenTypeCoinTypeMap, appData.coinMetadataMap],
  );

  const onSelectToken = (token: Token, direction: TokenDirection) => {
    const newInCoinType =
      direction === TokenDirection.IN
        ? token.coinType
        : token.coinType === inCoinType
          ? outCoinType
          : inCoinType;
    const newInCoinMetadata = appData.coinMetadataMap[newInCoinType];
    const newOutCoinType =
      direction === TokenDirection.IN
        ? token.coinType === outCoinType
          ? inCoinType
          : outCoinType
        : token.coinType;
    const newOutCoinMetadata = appData.coinMetadataMap[newOutCoinType];

    if (cachedUsdPricesMap[newInCoinType] === undefined)
      fetchCachedUsdPrice(newInCoinType);
    if (cachedUsdPricesMap[newOutCoinType] === undefined)
      fetchCachedUsdPrice(newOutCoinType);

    shallowPushQuery(router, {
      slug: `${newInCoinMetadata.symbol}-${newOutCoinMetadata.symbol}`,
    });

    setQuote(undefined);

    setTimeout(
      () => document.getElementById(getCoinInputId(newInCoinType))?.focus(),
      250,
    );

    // value === "" || value <= 0
    if (new BigNumber(value || 0).lte(0)) return;

    // value > 0
    setIsFetchingQuote(true);
    fetchQuote(
      sdkMap,
      activeProviders,
      getToken(inCoinType, inCoinMetadata),
      getToken(outCoinType, outCoinMetadata),
      value,
    );
  };

  // Reverse
  const reverseAssets = () => {
    const newInCoinType = outCoinType;
    const newInCoinMetadata = outCoinMetadata;
    const newOutCoinType = inCoinType;
    const newOutCoinMetadata = inCoinMetadata;

    shallowPushQuery(router, {
      slug: `${newInCoinMetadata.symbol}-${newOutCoinMetadata.symbol}`,
    });

    setQuote(undefined);

    setTimeout(
      () => document.getElementById(getCoinInputId(newInCoinType))?.focus(),
      50,
    );

    // value === "" || value <= 0
    if (new BigNumber(value || 0).lte(0)) return;

    // value > 0
    setIsFetchingQuote(true);
    fetchQuote(
      sdkMap,
      activeProviders,
      getToken(inCoinType, inCoinMetadata),
      getToken(outCoinType, outCoinMetadata),
      value,
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
    if (new BigNumber(value).eq(0))
      return { isDisabled: true, title: "Enter a non-zero amount" };

    if (quote) {
      if (getBalance(inCoinType).lt(quote.in.amount))
        return {
          isDisabled: true,
          title: `Insufficient ${inCoinMetadata.symbol}`,
        };
    }

    return {
      isDisabled: isFetchingQuote || !quote,
      title: "Swap",
    };
  })();

  const onSubmitClick = async () => {
    console.log("SwapPage.onSubmitClick");

    if (submitButtonState.isDisabled) return;

    if (!address || !quote) return;

    return;
    try {
      setIsSubmitting(true);

      const transaction = new Transaction();

      const coinIn = coinWithBalance({
        balance: BigInt(quote.amountIn.toString()),
        type: inCoinType,
        useGasCoin: isSui(inCoinType),
      })(transaction);

      const _quote = clone(quote);
      _quote.amountOut = BigInt(
        new BigNumber(_quote.amountOut.toString())
          .div(1 + slippagePercent / 100)
          .integerValue(BigNumber.ROUND_DOWN)
          .toString(),
      );
      await steammClient.Router.swapWithRoute(transaction, {
        coinIn,
        route,
        quote: _quote,
      });

      transaction.transferObjects([coinIn], address);

      const banks = [appData.bankMap[inCoinType], appData.bankMap[outCoinType]];
      rebalanceBanks(
        banks.filter((b) => !isSui(b.coinType)),
        steammClient,
        transaction,
      );

      const res = await signExecuteAndWaitForTransaction(transaction, {
        auction: true,
      });
      const txUrl = explorer.buildTxUrl(res.digest);

      const balanceChangeIn = getBalanceChange(
        res,
        address,
        getToken(inCoinType, inCoinMetadata),
        -1,
      );
      const balanceChangeOut = getBalanceChange(
        res,
        address,
        getToken(outCoinType, outCoinMetadata),
        1,
      );

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
      document.getElementById(getCoinInputId(inCoinType))?.focus();
      setIsSubmitting(false);
      refresh();
    }
  };

  // Suggested pools
  const suggestedPools: ParsedPool[] = useMemo(
    () => [
      ...appData.pools.filter(
        (_pool) =>
          _pool.coinTypes[0] === inCoinType &&
          _pool.coinTypes[1] === outCoinType,
      ),
      ...appData.pools.filter(
        (_pool) =>
          _pool.coinTypes[0] === inCoinType &&
          _pool.coinTypes[1] !== outCoinType,
      ),
      ...appData.pools.filter(
        (_pool) =>
          _pool.coinTypes[0] !== inCoinType &&
          _pool.coinTypes[1] === outCoinType,
      ),
    ],
    [appData.pools, inCoinType, outCoinType],
  );

  return (
    <>
      <Head>
        <title>STEAMM | Swap</title>
      </Head>

      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <div className="flex w-full flex-row items-center justify-between">
            <h1 className="text-h1 text-foreground">Swap</h1>
            <SlippagePopover />
          </div>

          <div className="flex w-full flex-col gap-4">
            <div className="relative flex w-full min-w-0 flex-col items-center gap-2">
              <CoinInput
                className="relative z-[1]"
                autoFocus
                token={getToken(inCoinType, inCoinMetadata)}
                value={value}
                usdValue={inUsdValue}
                onChange={(value) => onValueChange(value)}
                onMaxAmountClick={() => onBalanceClick()}
                tokens={tokens}
                onSelectToken={(token) =>
                  onSelectToken(token, TokenDirection.IN)
                }
              />

              <ReverseAssetsButton onClick={reverseAssets} />

              <CoinInput
                className="relative z-[1]"
                token={getToken(outCoinType, outCoinMetadata)}
                value={
                  isFetchingQuote
                    ? undefined
                    : quote
                      ? formatTextInputValue(
                          quote.out.amount.toFixed(
                            outCoinMetadata.decimals,
                            BigNumber.ROUND_DOWN,
                          ),
                          outCoinMetadata.decimals,
                        )
                      : ""
                }
                usdValue={outUsdValue}
                tokens={tokens}
                onSelectToken={(token) =>
                  onSelectToken(token, TokenDirection.OUT)
                }
              />
            </div>

            <div className="flex w-full flex-col gap-4">
              <div className="relative flex w-full min-w-0 flex-col items-center gap-2">
                <CoinInput
                  className="relative z-[1]"
                  autoFocus={!isTouchscreen}
                  token={getToken(inCoinType, inCoinMetadata)}
                  value={value}
                  usdValue={inUsdValue}
                  onChange={(value) => onValueChange(value)}
                  onMaxAmountClick={() => onBalanceClick()}
                  tokens={tokens}
                  onSelectToken={(token) =>
                    onSelectToken(token, TokenDirection.IN)
                  }
                />

                {/* {isFetchingQuote || !quote ? (
                      <Skeleton className="h-[21px] w-16" />
                    ) : (
                      <Tooltip
                        content={
                          <div className="flex flex-row items-center gap-1">
                            {flattenedRoute!.map((r, index) => (
                              <Fragment key={r.bTokenType}>
                                <p className="text-p3 text-foreground">
                                  {
                                    appData.coinMetadataMap[
                                      appData.bTokenTypeCoinTypeMap[
                                        r.bTokenType
                                      ]
                                    ].symbol
                                  }
                                </p>
                                {index !== flattenedRoute!.length - 1 && (
                                  <ArrowRight className="h-3 w-3 text-foreground" />
                                )}
                              </Fragment>
                            ))}
                          </div>
                        }
                      >
                        <p
                          className={cn(
                            "text-p2 text-secondary-foreground decoration-secondary-foreground/50",
                            hoverUnderlineClassName,
                          )}
                        >
                          {route.length} hop
                          {route.length > 1 && "s"}
                        </p>
                      </Tooltip>
                    )} */}
              </div>

              <PriceDifferenceLabel
                inToken={getToken(inCoinType, inCoinMetadata)}
                outToken={getToken(outCoinType, outCoinMetadata)}
                cachedUsdPriceRatio={cachedUsdPriceRatio}
                isFetchingQuote={isFetchingQuote}
                quote={quote}
              />
            </div>

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
                    <p className="text-p2 text-foreground">
                      {formatToken(
                        quote.out.amount.div(1 + slippagePercent / 100),
                        { dp: outCoinMetadata.decimals },
                      )}{" "}
                      {outCoinMetadata.symbol}
                    </p>
                  )}
                </Parameter>
              </div>
            )}
          </div>
        </div>

        <SuggestedPools
          tableId="swap"
          title="Suggested pools"
          pools={suggestedPools}
          isTvlOnly
        />
      </div>
    </>
  );
}
