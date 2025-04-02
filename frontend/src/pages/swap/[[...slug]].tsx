import Head from "next/head";
import { useRouter } from "next/router";
import { Fragment, useCallback, useMemo, useRef, useState } from "react";

import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import * as Sentry from "@sentry/nextjs";
import BigNumber from "bignumber.js";
import { clone, debounce } from "lodash";
import { ArrowRight } from "lucide-react";

import {
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_USDC_COINTYPE,
  SUI_GAS_MIN,
  Token,
  formatToken,
  getBalanceChange,
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

import CoinInput, { getCoinInputId } from "@/components/CoinInput";
import ExchangeRateParameter from "@/components/ExchangeRateParameter";
import Parameter from "@/components/Parameter";
import SuggestedPools from "@/components/pool/SuggestedPools";
import SlippagePopover from "@/components/SlippagePopover";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import PriceDifferenceLabel from "@/components/swap/PriceDifferenceLabel";
import ReverseAssetsButton from "@/components/swap/ReverseAssetsButton";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import useTokenUsdPrices from "@/hooks/useTokenUsdPrices";
import { rebalanceBanksIfNeeded } from "@/lib/banks";
import { formatTextInputValue } from "@/lib/format";
import { getBirdeyeRatio } from "@/lib/swap";
import { showSuccessTxnToast } from "@/lib/toasts";
import { ParsedPool, TokenDirection } from "@/lib/types";
import { cn, hoverUnderlineClassName } from "@/lib/utils";

export default function SwapPage() {
  const router = useRouter();
  const slug = router.query.slug as string[] | undefined;

  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData, banksData, poolsData, slippagePercent } =
    useLoadedAppContext();
  const { getBalance, refresh } = useUserContext();

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
    ? BigNumber.max(0, getBalance(inCoinType).minus(1))
    : getBalance(inCoinType);

  const valueRef = useRef<string>("");
  const [value, setValue] = useState<string>("");

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

      if (valueRef.current !== _value) return;

      try {
        const submitAmount = new BigNumber(_value)
          .times(10 ** appData.coinMetadataMap[_inCoinType].decimals)
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
      steammClient,
      formattedValue,
      inCoinType,
      outCoinType,
    );
  };

  // USD prices - current
  const { tokenUsdPricesMap, fetchTokenUsdPrice } = useTokenUsdPrices([
    inCoinType,
    outCoinType,
  ]);

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
      isFetchingQuote || inUsdPrice === undefined
        ? undefined
        : quote
          ? new BigNumber(quote.amountIn.toString())
              .div(10 ** inCoinMetadata.decimals)
              .times(inUsdPrice)
          : "",
    [isFetchingQuote, inUsdPrice, quote, inCoinMetadata],
  );
  const outUsdValue = useMemo(
    () =>
      isFetchingQuote || outUsdPrice === undefined
        ? undefined
        : quote
          ? new BigNumber(quote.amountOut.toString())
              .div(10 ** outCoinMetadata.decimals)
              .times(outUsdPrice)
          : "",
    [isFetchingQuote, outUsdPrice, quote, outCoinMetadata],
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
  const tokens: Token[] | undefined = useMemo(
    () =>
      banksData === undefined
        ? undefined
        : Object.values(banksData.bTokenTypeCoinTypeMap)
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
    [banksData, appData.coinMetadataMap],
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
      250,
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
      isDisabled: isFetchingQuote || !quote || !route,
      title: "Swap",
    };
  })();

  const onSubmitClick = async () => {
    console.log("SwapPage.onSubmitClick");

    if (submitButtonState.isDisabled) return;

    if (banksData === undefined) return;
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

      const banks = [
        banksData.bankMap[inCoinType],
        banksData.bankMap[outCoinType],
      ];
      rebalanceBanksIfNeeded(banks, steammClient, transaction);

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
          : new BigNumber(quote.amountIn.toString()).div(
              10 ** inCoinMetadata.decimals,
            ),
        { dp: inCoinMetadata.decimals, trimTrailingZeros: true },
      );
      const balanceChangeOutFormatted = formatToken(
        balanceChangeOut !== undefined
          ? balanceChangeOut
          : new BigNumber(quote.amountOut.toString()).div(
              10 ** outCoinMetadata.decimals,
            ),
        { dp: outCoinMetadata.decimals, trimTrailingZeros: true },
      );

      showSuccessTxnToast("Swapped", txUrl, {
        description: [
          `${balanceChangeInFormatted} ${inCoinMetadata.symbol}`,
          "for",
          `${balanceChangeOutFormatted} ${outCoinMetadata.symbol}`,
        ].join(" "),
      });
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
  const suggestedPools: ParsedPool[] | undefined = useMemo(() => {
    if (poolsData === undefined) return undefined;

    return [
      ...poolsData.pools
        .filter(
          (_pool) =>
            _pool.coinTypes[0] === inCoinType &&
            _pool.coinTypes[1] === outCoinType,
        )
        .sort((a, b) => +b.tvlUsd - +a.tvlUsd),
      ...poolsData.pools
        .filter(
          (_pool) =>
            _pool.coinTypes[0] === inCoinType &&
            _pool.coinTypes[1] !== outCoinType,
        )
        .sort((a, b) => +b.tvlUsd - +a.tvlUsd),
      ...poolsData.pools
        .filter(
          (_pool) =>
            _pool.coinTypes[0] !== inCoinType &&
            _pool.coinTypes[1] === outCoinType,
        )
        .sort((a, b) => +b.tvlUsd - +a.tvlUsd),
    ];
  }, [poolsData, inCoinType, outCoinType]);

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
                token={getToken(inCoinType, inCoinMetadata)}
                value={value}
                usdValue={inUsdValue}
                onChange={(value) => onValueChange(value)}
                onBalanceClick={() => onBalanceClick()}
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
                tokens={tokens}
                onSelectToken={(token) =>
                  onSelectToken(token, TokenDirection.OUT)
                }
              />
            </div>

            {(isFetchingQuote || quote) && (
              <div className="flex w-full flex-col gap-2">
                <div className="flex w-full flex-row items-center justify-between">
                  <ExchangeRateParameter
                    className="w-max"
                    labelClassName="text-secondary-foreground"
                    inToken={getToken(inCoinType, inCoinMetadata)}
                    outToken={getToken(outCoinType, outCoinMetadata)}
                    isFetchingQuote={isFetchingQuote}
                    quote={quote}
                    label=""
                  />

                  {isFetchingQuote ||
                  !quote ||
                  !route ||
                  banksData === undefined ? (
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
                                    banksData.bTokenTypeCoinTypeMap[
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
                  )}
                </div>

                <PriceDifferenceLabel
                  inToken={getToken(inCoinType, inCoinMetadata)}
                  outToken={getToken(outCoinType, outCoinMetadata)}
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
