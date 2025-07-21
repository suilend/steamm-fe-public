import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AggregatorClient as CetusSdk } from "@cetusprotocol/aggregator-sdk";
import { AggregatorQuoter as FlowXAggregatorQuoter } from "@flowx-finance/sdk";
import { Transaction } from "@mysten/sui/transactions";
import * as Sentry from "@sentry/nextjs";
import { Aftermath as AftermathSdk } from "aftermath-ts-sdk";
import BigNumber from "bignumber.js";

import {
  QuoteProvider,
  StandardizedQuote,
  getAggQuotes,
  getSwapTransaction,
} from "@suilend/sdk";
import { ParsedPool } from "@suilend/steamm-sdk";
import {
  NORMALIZED_SEND_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  Token,
  formatInteger,
  formatToken,
  getBalanceChange,
  getToken,
  isSui,
} from "@suilend/sui-fe";
import {
  shallowPushQuery,
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";
import useIsTouchscreen from "@suilend/sui-fe-next/hooks/useIsTouchscreen";

import CoinInput, { getCoinInputId } from "@/components/CoinInput";
import ExchangeRateParameter from "@/components/ExchangeRateParameter";
import SuggestedPools from "@/components/pool/SuggestedPools";
import SlippagePopover from "@/components/SlippagePopover";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { useAggSdks } from "@/lib/agg-swap";
import { MAX_BALANCE_SUI_SUBTRACTED_AMOUNT } from "@/lib/constants";
import { formatTextInputValue } from "@/lib/format";
import { SWAP_URL } from "@/lib/navigation";
import { getAvgPoolPrice } from "@/lib/pools";
import { showSuccessTxnToast } from "@/lib/toasts";
import { TokenDirection } from "@/lib/types";

const DEFAULT_TOKEN_IN_COINTYPE = NORMALIZED_SUI_COINTYPE;
const DEFAULT_TOKEN_OUT_COINTYPE = NORMALIZED_SEND_COINTYPE;

const getSwapUrl = (inCoinType?: string, outCoinType?: string) =>
  `${SWAP_URL}/${inCoinType ?? DEFAULT_TOKEN_IN_COINTYPE}-${
    outCoinType ?? DEFAULT_TOKEN_OUT_COINTYPE
  }`;

export default function SwapPage() {
  const router = useRouter();
  const slug = router.query.slug as string[] | undefined;

  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { appData, slippagePercent } = useLoadedAppContext();
  const { getBalance, refresh } = useUserContext();

  const isTouchscreen = useIsTouchscreen();

  // send.ag
  const { sdkMap, partnerIdMap } = useAggSdks();

  const activeProviders = useMemo(
    () =>
      [
        QuoteProvider.AFTERMATH,
        QuoteProvider.CETUS,
        QuoteProvider._7K,
        QuoteProvider.FLOWX,
        // QuoteProvider.OKX_DEX,
      ].filter(Boolean) as QuoteProvider[],
    [],
  );

  // Tokens
  const [inCoinType, outCoinType] = !(
    slug === undefined ||
    slug[0].split("-").length !== 2 ||
    slug[0].split("-")[0] === slug[0].split("-")[1] ||
    slug[0].split("-").some((coinType) => !appData.coinMetadataMap[coinType])
  )
    ? slug[0].split("-")
    : [DEFAULT_TOKEN_IN_COINTYPE, DEFAULT_TOKEN_OUT_COINTYPE];

  useEffect(() => {
    if (
      slug === undefined ||
      slug[0].split("-").length !== 2 ||
      slug[0].split("-")[0] === slug[0].split("-")[1] ||
      slug[0].split("-").some((coinType) => !appData.coinMetadataMap[coinType])
    )
      router.replace({ pathname: getSwapUrl() }, undefined, { shallow: true });
  }, [slug, appData.coinMetadataMap, router]);

  const [inCoinMetadata, outCoinMetadata] = useMemo(
    () => [
      appData.coinMetadataMap[inCoinType],
      appData.coinMetadataMap[outCoinType],
    ],
    [appData.coinMetadataMap, inCoinType, outCoinType],
  );
  const [tokenIn, tokenOut] = useMemo(
    () => [
      getToken(inCoinType, inCoinMetadata),
      getToken(outCoinType, outCoinMetadata),
    ],
    [inCoinType, inCoinMetadata, outCoinType, outCoinMetadata],
  );

  // State
  const [value, setValue] = useState<string>("");

  // Quote
  const [quotesMap, setQuotesMap] = useState<
    Record<number, (StandardizedQuote | null)[]>
  >({});

  const quotes = useMemo(() => {
    const timestampsS = Object.entries(quotesMap)
      .filter(([, value]) => value.length > 0)
      .map(([timestampS]) => +timestampS);
    if (timestampsS.length === 0) return undefined;

    const maxTimestampS = Math.max(...timestampsS);
    if (quotesMap[maxTimestampS].filter(Boolean).length === 0) return undefined;

    const sortedQuotes = (
      quotesMap[maxTimestampS].filter(Boolean) as StandardizedQuote[]
    )
      .slice()
      .sort((a, b) => +b.out.amount.minus(a.out.amount));
    return sortedQuotes;
  }, [quotesMap]);

  const quote = quotes?.find(
    (q) => q.in.coinType === inCoinType && q.out.coinType === outCoinType,
  ); // Best quote by amount out

  const isFetchingQuotes = useMemo(() => {
    const timestampsS = Object.keys(quotesMap).map((timestampS) => +timestampS);
    if (timestampsS.length === 0) return false;

    const maxTimestampS = Math.max(...timestampsS);
    return quotesMap[maxTimestampS].filter(Boolean).length < 1; // < numActiveProviders;
  }, [quotesMap]);

  const fetchQuotes = useCallback(
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
      if (_tokenIn.coinType === _tokenOut.coinType) return;
      if (new BigNumber(_value || 0).lte(0)) return;

      const amountIn = new BigNumber(_value)
        .times(10 ** _tokenIn.decimals)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const timestamp = new Date().getTime();
      setQuotesMap((o) => ({ ...(o ?? {}), [timestamp]: [] }));

      await getAggQuotes(
        _sdkMap,
        _activeProviders,
        (quote) => {
          setQuotesMap((o) => ({
            ...(o ?? {}),
            [timestamp]: [...((o ?? {})[timestamp] ?? []), quote],
          }));
        },
        _tokenIn,
        _tokenOut,
        amountIn,
      );
    },
    [],
  );

  // USD prices - current
  const inPoolPrice = getAvgPoolPrice(appData.pools, inCoinType)!;
  const outPoolPrice = getAvgPoolPrice(appData.pools, outCoinType)!;

  const inUsdValue = useMemo(
    () =>
      isFetchingQuotes || inPoolPrice === undefined
        ? undefined
        : quote
          ? quote.in.amount.times(inPoolPrice)
          : "",
    [isFetchingQuotes, inPoolPrice, quote],
  );
  const outUsdValue = useMemo(
    () =>
      isFetchingQuotes || outPoolPrice === undefined
        ? undefined
        : quote
          ? quote.out.amount.times(outPoolPrice)
          : "",
    [isFetchingQuotes, outPoolPrice, quote],
  );

  // Value
  const formatAndSetValue = useCallback((_value: string, token: Token) => {
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
  }, []);

  const onValueChange = (_value: string) => {
    formatAndSetValue(_value, tokenIn);

    if (new BigNumber(_value || 0).gt(0))
      fetchQuotes(sdkMap, activeProviders, tokenIn, tokenOut, _value);
    else setQuotesMap({});
  };

  // Value - max
  const inMaxValue = isSui(inCoinType)
    ? BigNumber.max(
        0,
        getBalance(inCoinType).minus(MAX_BALANCE_SUI_SUBTRACTED_AMOUNT),
      )
    : getBalance(inCoinType);

  const onBalanceClick = () => {
    onValueChange(inMaxValue.toFixed(tokenIn.decimals, BigNumber.ROUND_DOWN));
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
    const newOutCoinType =
      direction === TokenDirection.IN
        ? token.coinType === outCoinType
          ? inCoinType
          : outCoinType
        : token.coinType;

    shallowPushQuery(router, {
      slug: `${newInCoinType}-${newOutCoinType}`,
    });

    setQuotesMap({});

    setTimeout(
      () => document.getElementById(getCoinInputId(newInCoinType))?.focus(),
      500,
    );

    // value === "" || value <= 0
    if (new BigNumber(value || 0).lte(0)) return;

    // value > 0
    fetchQuotes(
      sdkMap,
      activeProviders,
      direction === TokenDirection.IN ? token : tokenIn,
      direction === TokenDirection.IN ? tokenOut : token,
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

    return {
      title: `Swap ${tokenIn.symbol} for ${tokenOut.symbol}`,
      isDisabled: !quote || isFetchingQuotes,
    };
  })();

  const onSubmitClick = async () => {
    if (!address) throw new Error("Wallet not connected");
    if (!quote) throw new Error("No quote found");

    if (submitButtonState.isDisabled) return;
    setIsSubmitting(true);

    try {
      let transaction = new Transaction();
      const { transaction: _transaction, coinOut } = await getSwapTransaction(
        suiClient,
        address,
        quote,
        +slippagePercent,
        sdkMap,
        partnerIdMap,
        transaction,
        undefined,
      );
      if (!coinOut) throw new Error("Missing coin to deposit/transfer to user");

      transaction = _transaction;

      // TRANSFER out token
      transaction.transferObjects(
        [coinOut!], // Checked above
        transaction.pure.address(address),
      );

      const res = await signExecuteAndWaitForTransaction(transaction, {
        auction: true,
      });
      const txUrl = explorer.buildTxUrl(res.digest);

      const balanceChangeIn = getBalanceChange(res, address, tokenIn, -1);
      const balanceChangeOut = getBalanceChange(res, address, tokenOut);

      showSuccessTxnToast(
        [
          "Swapped",
          balanceChangeIn !== undefined
            ? formatToken(balanceChangeIn, {
                dp: tokenIn.decimals,
                trimTrailingZeros: true,
              })
            : null,
          tokenIn.symbol,
          "for",
          balanceChangeOut !== undefined
            ? formatToken(balanceChangeOut, {
                dp: tokenOut.decimals,
                trimTrailingZeros: true,
              })
            : null,
          tokenOut.symbol,
        ]
          .filter(Boolean)
          .join(" "),
        txUrl,
      );

      formatAndSetValue("", tokenIn);
      setQuotesMap({});
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
                autoFocus={!isTouchscreen}
                token={tokenIn}
                value={value}
                usdValue={inUsdValue}
                onChange={(value) => onValueChange(value)}
                onMaxAmountClick={() => onBalanceClick()}
                tokens={tokens}
                onSelectToken={(token) =>
                  onSelectToken(token, TokenDirection.IN)
                }
              />

              <CoinInput
                className="relative z-[1]"
                token={tokenOut}
                value={
                  isFetchingQuotes
                    ? undefined
                    : quote
                      ? formatTextInputValue(
                          new BigNumber(quote.out.amount).toFixed(
                            tokenOut.decimals,
                            BigNumber.ROUND_DOWN,
                          ),
                          tokenOut.decimals,
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

            {(isFetchingQuotes || quote) && (
              <div className="flex w-full flex-col gap-2">
                <div className="flex w-full flex-row items-center justify-between">
                  <ExchangeRateParameter
                    className="w-max"
                    labelClassName="text-secondary-foreground"
                    inToken={tokenIn}
                    inPrice={inPoolPrice}
                    outToken={tokenOut}
                    outPrice={outPoolPrice}
                    isFetchingQuote={isFetchingQuotes}
                    quote={quote}
                    isInverted
                    label=""
                  />
                </div>
              </div>
            )}

            <SubmitButton
              submitButtonState={submitButtonState}
              onClick={onSubmitClick}
            />
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
