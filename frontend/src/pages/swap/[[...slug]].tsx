import Head from "next/head";
import { useRouter } from "next/router";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import * as Sentry from "@sentry/nextjs";
import BigNumber from "bignumber.js";
import { clone, debounce } from "lodash";
import { ArrowRight } from "lucide-react";

import {
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_USDC_COINTYPE,
  SUI_GAS_MIN,
  formatInteger,
  formatToken,
  getBalanceChange,
  getPrice,
  getToken,
  isSui,
} from "@suilend/frontend-sui";
import {
  shallowPushQuery,
  shallowReplaceQuery,
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import { MultiSwapQuote, Route, SteammSDK } from "@suilend/steamm-sdk";

import ExchangeRateParameter from "@/components/ExchangeRateParameter";
import Parameter from "@/components/Parameter";
import CoinInput, { getCoinInputId } from "@/components/pool/CoinInput";
import SuggestedPools from "@/components/pool/SuggestedPools";
import SlippagePopover from "@/components/SlippagePopover";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import PriceDifferenceLabel from "@/components/swap/PriceDifferenceLabel";
import ReverseAssetsButton from "@/components/swap/ReverseAssetsButton";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedUserContext } from "@/contexts/UserContext";
import { getBirdeyeRatio } from "@/lib/swap";
import { showSuccessTxnToast } from "@/lib/toasts";
import { cn, hoverUnderlineClassName } from "@/lib/utils";

export default function SwapPage() {
  const router = useRouter();
  const slug = router.query.slug as string[] | undefined;

  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData, slippagePercent } = useLoadedAppContext();
  const { getBalance, refresh } = useLoadedUserContext();

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
        slug: "SUI-USDC",
      });
      return [NORMALIZED_SUI_COINTYPE, NORMALIZED_USDC_COINTYPE];
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
    ? BigNumber.max(0, getBalance(inCoinType).minus(SUI_GAS_MIN))
    : getBalance(inCoinType);

  const [value, setValue] = useState<string>("");
  const valueRef = useRef<string>(value);

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

  const [isFetchingQuote, setIsFetchingQuote] = useState<boolean>(false);
  const [quote, setQuote] = useState<MultiSwapQuote | undefined>(undefined);
  const [route, setRoute] = useState<Route | undefined>(undefined);
  const flattenedRoute = useMemo(() => {
    if (!route) return undefined;

    const result: { poolId: string; bTokenType: string }[] = [];
    for (let i = 0; i < route.length; i++) {
      const r = route[i];
      if (i === 0) {
        result.push(
          {
            poolId: r.poolId,
            bTokenType: r.a2b ? r.coinTypeA : r.coinTypeB,
          },
          {
            poolId: r.poolId,
            bTokenType: r.a2b ? r.coinTypeB : r.coinTypeA,
          },
        );
      } else {
        result.push({
          poolId: r.poolId,
          bTokenType: r.a2b ? r.coinTypeB : r.coinTypeA,
        });
      }
    }

    return result;
  }, [route]);

  const fetchQuote = useCallback(
    async (
      _steammClient: SteammSDK,
      _value: string,
      _inCoinType: string,
      _outCoinType: string,
    ) => {
      console.log(
        "SwapPage.fetchQuote - _value(=formattedValue):",
        _value,
        "_inCoinType:",
        _inCoinType,
        "_outCoinType:",
        _outCoinType,
        "valueRef.current:",
        valueRef.current,
      );

      const _inCoinMetadata = appData.coinMetadataMap[_inCoinType];

      if (valueRef.current !== _value) return;

      try {
        const submitAmount = new BigNumber(_value)
          .times(10 ** _inCoinMetadata.decimals)
          .integerValue(BigNumber.ROUND_DOWN)
          .toString();
        const { quote, route } = await _steammClient.Router.getBestSwapRoute(
          { coinIn: _inCoinType, coinOut: _outCoinType },
          BigInt(submitAmount),
        );

        if (valueRef.current !== _value) return;
        console.log("SwapPage.fetchQuote - quote:", quote, "route:", route);

        setIsFetchingQuote(false);
        setQuote(quote);
        setRoute(route);
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
    console.log("SwapPage.onValueChange - _value:", _value);

    const formattedValue = formatValue(_value, inCoinMetadata.decimals);

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
      inCoinType,
      outCoinType,
    );
  };

  // USD prices - current
  const [tokenUsdPricesMap, setTokenUsdPriceMap] = useState<
    Record<string, BigNumber>
  >({});

  const fetchTokenUsdPrice = useCallback(async (coinType: string) => {
    console.log("fetchTokenUsdPrice - coinType:", coinType);

    try {
      const result = await getPrice(coinType);
      if (result === undefined || isNaN(result)) return;

      setTokenUsdPriceMap((o) => ({
        ...o,
        [coinType]: BigNumber(result),
      }));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchedInitialTokenUsdPricesRef = useRef<boolean>(false);
  useEffect(() => {
    if (fetchedInitialTokenUsdPricesRef.current) return;

    fetchTokenUsdPrice(inCoinType);
    fetchTokenUsdPrice(outCoinType);
    fetchedInitialTokenUsdPricesRef.current = true;
  }, [fetchTokenUsdPrice, inCoinType, outCoinType]);

  const inUsdPrice = useMemo(
    () => tokenUsdPricesMap[inCoinType],
    [tokenUsdPricesMap, inCoinType],
  );
  const outUsdPrice = useMemo(
    () => tokenUsdPricesMap[outCoinType],
    [tokenUsdPricesMap, outCoinType],
  );

  const inUsdValue = useMemo(
    () =>
      quote !== undefined && inUsdPrice !== undefined
        ? new BigNumber(quote.amountIn.toString())
            .div(10 ** inCoinMetadata.decimals)
            .times(inUsdPrice)
        : undefined,
    [quote, inUsdPrice, inCoinMetadata],
  );
  const outUsdValue = useMemo(
    () =>
      quote !== undefined && outUsdPrice !== undefined
        ? new BigNumber(quote.amountOut.toString())
            .div(10 ** outCoinMetadata.decimals)
            .times(outUsdPrice)
        : undefined,
    [quote, outUsdPrice, outCoinMetadata],
  );

  // Ratios
  const birdeyeRatio = getBirdeyeRatio(inUsdPrice, outUsdPrice);
  console.log("SwapPage - birdeyeRatio:", birdeyeRatio?.toString());

  // Value - max
  const onBalanceClick = () => {
    onValueChange(
      inMaxValue.toFixed(inCoinMetadata.decimals, BigNumber.ROUND_DOWN),
      true,
    );
    document.getElementById(getCoinInputId(inCoinType))?.focus();
  };

  // Select
  const onPopoverCoinClick = (coinType: string, direction: "in" | "out") => {
    const newInCoinType =
      direction === "in"
        ? coinType
        : coinType === inCoinType
          ? outCoinType
          : inCoinType;
    const newInCoinMetadata = appData.coinMetadataMap[newInCoinType];
    const newOutCoinType =
      direction === "in"
        ? coinType === outCoinType
          ? inCoinType
          : outCoinType
        : coinType;
    const newOutCoinMetadata = appData.coinMetadataMap[newOutCoinType];

    if (tokenUsdPricesMap[newInCoinType] === undefined)
      fetchTokenUsdPrice(newInCoinType);
    if (tokenUsdPricesMap[newOutCoinType] === undefined)
      fetchTokenUsdPrice(newOutCoinType);

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
    fetchQuote(steammClient, value, newInCoinType, newOutCoinType);
  };

  // Reverse
  const reverseAssets = () => {
    const newInCoinType = outCoinType;
    const newInCoinMetadata = outCoinMetadata;
    const newOutCoinType = inCoinType;
    const newOutCoinMetadata = inCoinMetadata;

    if (tokenUsdPricesMap[newInCoinType] === undefined)
      fetchTokenUsdPrice(newInCoinType);
    if (tokenUsdPricesMap[newOutCoinType] === undefined)
      fetchTokenUsdPrice(newOutCoinType);

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
    fetchQuote(steammClient, value, newInCoinType, newOutCoinType);
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
        isSui(inCoinType) &&
        new BigNumber(getBalance(inCoinType).minus(SUI_GAS_MIN)).lt(
          new BigNumber(quote.amountIn.toString()).div(
            10 ** inCoinMetadata.decimals,
          ),
        )
      )
        return {
          isDisabled: true,
          title: `${SUI_GAS_MIN} SUI should be saved for gas`,
        };

      if (
        getBalance(inCoinType).lt(
          new BigNumber(quote.amountIn.toString()).div(
            10 ** inCoinMetadata.decimals,
          ),
        )
      )
        return {
          isDisabled: true,
          title: `Insufficient ${inCoinMetadata.symbol}`,
        };
    }

    return {
      title: "Swap",
      isDisabled: isFetchingQuote || !quote || !route,
    };
  })();

  const onSubmitClick = async () => {
    console.log("SwapPage.onSubmitClick");

    if (submitButtonState.isDisabled) return;
    if (!address || !quote || !route) return;

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

      const balanceChangeInFormatted = formatToken(
        balanceChangeIn !== undefined
          ? balanceChangeIn
          : new BigNumber(quote.amountIn.toString()),
        { dp: inCoinMetadata.decimals, trimTrailingZeros: true },
      );
      const balanceChangeOutFormatted = formatToken(
        balanceChangeOut !== undefined
          ? balanceChangeOut
          : new BigNumber(quote.amountOut.toString()),
        { dp: outCoinMetadata.decimals, trimTrailingZeros: true },
      );

      showSuccessTxnToast("Swapped", txUrl, {
        description: `${balanceChangeInFormatted} ${inCoinMetadata.symbol} for ${balanceChangeOutFormatted} ${outCoinMetadata.symbol}`,
      });
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
  const suggestedPools = appData.pools
    .filter(
      (_pool) =>
        _pool.coinTypes[0] === inCoinType || _pool.coinTypes[1] === outCoinType,
    )
    .sort((a, b) => +b.tvlUsd - +a.tvlUsd);

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
            <div className="relative flex w-full min-w-0 flex-col items-center gap-1">
              <CoinInput
                className="relative z-[1]"
                autoFocus
                coinType={inCoinType}
                value={value}
                usdValue={inUsdValue}
                onChange={(value) => onValueChange(value)}
                onBalanceClick={() => onBalanceClick()}
                onPopoverCoinClick={(coinType) =>
                  onPopoverCoinClick(coinType, "in")
                }
              />

              <ReverseAssetsButton onClick={reverseAssets} />

              <CoinInput
                className="relative z-[1]"
                coinType={outCoinType}
                value={
                  isFetchingQuote
                    ? undefined
                    : quote
                      ? formatValue(
                          new BigNumber(quote.amountOut.toString())
                            .div(10 ** outCoinMetadata.decimals)
                            .toFixed(
                              outCoinMetadata.decimals,
                              BigNumber.ROUND_DOWN,
                            ),
                          outCoinMetadata.decimals,
                        )
                      : ""
                }
                usdValue={outUsdValue}
                onPopoverCoinClick={(coinType) =>
                  onPopoverCoinClick(coinType, "out")
                }
              />
            </div>

            {(isFetchingQuote || quote) && (
              <div className="flex w-full flex-row items-center justify-between">
                <PriceDifferenceLabel
                  inCoinType={inCoinType}
                  outCoinType={outCoinType}
                  birdeyeRatio={birdeyeRatio}
                  isFetchingQuote={isFetchingQuote}
                  quote={quote}
                />

                {isFetchingQuote || !quote || !route ? (
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
                                  appData.bTokenTypeCoinTypeMap[r.bTokenType]
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
                )}
              </div>
            )}

            <SubmitButton
              submitButtonState={submitButtonState}
              onClick={onSubmitClick}
            />

            {(isFetchingQuote || quote) && (
              <div className="flex w-full flex-col gap-2">
                <ExchangeRateParameter
                  inCoinType={inCoinType}
                  outCoinType={outCoinType}
                  isFetchingQuote={isFetchingQuote}
                  quote={quote}
                  isHorizontal
                />

                <Parameter label="Minimum inflow" isHorizontal>
                  {isFetchingQuote || !quote ? (
                    <Skeleton className="h-[21px] w-24" />
                  ) : (
                    <p className="text-p2 text-foreground">
                      {formatToken(
                        new BigNumber(quote.amountOut.toString())
                          .div(1 + slippagePercent / 100)
                          .div(10 ** outCoinMetadata.decimals),
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
          containerClassName="grid-cols-1"
          title="Suggested pools"
          pools={suggestedPools}
          collapsedPoolCount={2}
        />
      </div>
    </>
  );
}
