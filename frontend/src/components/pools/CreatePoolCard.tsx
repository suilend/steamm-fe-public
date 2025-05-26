import { useCallback, useMemo, useRef, useState } from "react";

import BigNumber from "bignumber.js";
import { useFlags } from "launchdarkly-react-client-sdk";
import { Check } from "lucide-react";

import {
  API_URL,
  Token,
  formatPrice,
  formatToken,
  getToken,
  isSui,
} from "@suilend/frontend-sui";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import {
  ADMIN_ADDRESS,
  ParsedPool,
  QUOTER_ID_NAME_MAP,
  QuoterId,
  computeOptimalOffset,
} from "@suilend/steamm-sdk";
import { OracleQuoterV2 } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm_v2/structs";
import { Pool } from "@suilend/steamm-sdk/_codegen/_generated/steamm/pool/structs";

import CoinInput, { getCoinInputId } from "@/components/CoinInput";
import Parameter from "@/components/Parameter";
import CreatePoolStepsDialog from "@/components/pools/CreatePoolStepsDialog";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import TokenSelectionDialog from "@/components/swap/TokenSelectionDialog";
import TextInput from "@/components/TextInput";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import useBirdeyeUsdPrices from "@/hooks/useBirdeyeUsdPrices";
import { MAX_BALANCE_SUI_SUBTRACTED_AMOUNT } from "@/lib/constants";
import { CreateCoinResult, initializeCoinCreation } from "@/lib/createCoin";
import {
  AMPLIFIERS,
  CreateBTokenAndBankForTokenResult,
  CreatePoolAndDepositInitialLiquidityResult,
  FEE_TIER_PERCENTS,
  GetBTokenAndBankForTokenResult,
  PUBLIC_FEE_TIER_PERCENTS,
  PUBLIC_QUOTER_IDS,
  QUOTER_IDS,
  createBTokenAndBankForToken,
  createLpToken,
  createPoolAndDepositInitialLiquidity,
  getBTokenAndBankForToken,
  hasBTokenAndBankForToken,
} from "@/lib/createPool";
import {
  formatAmplifier,
  formatFeeTier,
  formatPair,
  formatTextInputValue,
} from "@/lib/format";
import { AMPLIFIER_TOOLTIP } from "@/lib/pools";
import { getBirdeyeRatio } from "@/lib/swap";
import { showSuccessTxnToast } from "@/lib/toasts";
import { cn, hoverUnderlineClassName } from "@/lib/utils";

export default function CreatePoolCard() {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { balancesCoinMetadataMap, getBalance, refresh } = useUserContext();

  const flags = useFlags();
  const isWhitelisted = useMemo(
    () =>
      !!address &&
      (address === ADMIN_ADDRESS ||
        (flags?.steammCreatePoolWhitelist ?? []).includes(address)),
    [address, flags?.steammCreatePoolWhitelist],
  );

  // State - progress
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  const [bTokensAndBankIds, setBTokensAndBankIds] = useState<
    [
      (
        | GetBTokenAndBankForTokenResult
        | CreateBTokenAndBankForTokenResult
        | undefined
      ),
      (
        | GetBTokenAndBankForTokenResult
        | CreateBTokenAndBankForTokenResult
        | undefined
      ),
    ]
  >([undefined, undefined]);
  const [createLpTokenResult, setCreateLpTokenResult] = useState<
    CreateCoinResult | undefined
  >(undefined);
  const [createPoolResult, setCreatePoolResult] = useState<
    CreatePoolAndDepositInitialLiquidityResult | undefined
  >(undefined);
  const [hasClearedCache, setHasClearedCache] = useState<boolean>(false);

  // CoinTypes
  const [coinTypes, setCoinTypes] = useState<[string, string]>(["", ""]);
  const baseAssetCoinInputRef = useRef<HTMLInputElement>(null);

  // Quoter
  const [quoterId, setQuoterId] = useState<QuoterId | undefined>(undefined);

  const onSelectQuoter = (newQuoterId: QuoterId) => {
    setQuoterId(newQuoterId);

    if ([QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(newQuoterId)) {
      setCoinTypes(
        (prev) =>
          prev.map((coinType) =>
            appData.COINTYPE_ORACLE_INDEX_MAP[coinType] === undefined
              ? ""
              : coinType,
          ) as [string, string],
      );
    }
  };

  // Values
  const maxValues = coinTypes.map((coinType) =>
    coinType !== ""
      ? isSui(coinType)
        ? BigNumber.max(
            0,
            getBalance(coinType).minus(MAX_BALANCE_SUI_SUBTRACTED_AMOUNT),
          )
        : getBalance(coinType)
      : new BigNumber(0),
  ) as [BigNumber, BigNumber];

  const [values, setValues] = useState<[string, string]>(["", ""]);
  const [lastActiveInputIndex, setLastActiveInputIndex] = useState<
    number | undefined
  >(undefined);

  const onValueChange = (_value: string, index: number, coinType?: string) => {
    console.log("onValueChange - _value:", _value, "index:", index);

    const formattedValue = formatTextInputValue(
      _value,
      (coinType ?? coinTypes[index])
        ? balancesCoinMetadataMap![coinType ?? coinTypes[index]].decimals
        : 9,
    );

    const newValues: [string, string] = [
      index === 0 ? formattedValue : values[0],
      index === 0 ? values[1] : formattedValue,
    ];
    setValues(newValues);
    setLastActiveInputIndex(index);
  };

  // Values - max
  const onBalanceClick = (index: number) => {
    const coinType = coinTypes[index];
    const coinMetadata = balancesCoinMetadataMap![coinType];

    onValueChange(
      maxValues[index].toFixed(coinMetadata.decimals, BigNumber.ROUND_DOWN),
      index,
    );
    document.getElementById(getCoinInputId(coinType))?.focus();
  };

  // Birdeye USD prices - current
  const { birdeyeUsdPricesMap, fetchBirdeyeUsdPrice } = useBirdeyeUsdPrices([]);

  const birdeyeUsdValues = useMemo(
    () =>
      coinTypes.map((coinType, index) =>
        coinType !== ""
          ? birdeyeUsdPricesMap[coinType] === undefined
            ? undefined
            : new BigNumber(values[index] || 0).times(
                birdeyeUsdPricesMap[coinType],
              )
          : "",
      ),
    [coinTypes, birdeyeUsdPricesMap, values],
  );

  // Ratios
  const birdeyeRatio = useMemo(
    () =>
      getBirdeyeRatio(
        birdeyeUsdPricesMap[coinTypes[0]],
        birdeyeUsdPricesMap[coinTypes[1]],
      ),
    [birdeyeUsdPricesMap, coinTypes],
  );
  // console.log("CreatePoolCard - birdeyeRatio:", birdeyeRatio);

  const onUseBirdeyePriceClick = () => {
    if (birdeyeRatio === undefined || birdeyeRatio === null) return;

    if (lastActiveInputIndex === undefined || lastActiveInputIndex === 0) {
      const valueA = new BigNumber(values[0] || 0).lte(0)
        ? new BigNumber(1)
        : new BigNumber(values[0]);
      setValues([
        valueA.toFixed(
          balancesCoinMetadataMap![coinTypes[0]].decimals,
          BigNumber.ROUND_DOWN,
        ),
        new BigNumber(valueA.times(birdeyeRatio)).toFixed(
          balancesCoinMetadataMap![coinTypes[1]].decimals,
          BigNumber.ROUND_DOWN,
        ),
      ]);
    } else {
      const valueB = new BigNumber(values[1] || 0).lte(0)
        ? new BigNumber(1)
        : new BigNumber(values[1]);
      setValues([
        new BigNumber(valueB.div(birdeyeRatio)).toFixed(
          balancesCoinMetadataMap![coinTypes[0]].decimals,
          BigNumber.ROUND_DOWN,
        ),
        valueB.toFixed(
          balancesCoinMetadataMap![coinTypes[1]].decimals,
          BigNumber.ROUND_DOWN,
        ),
      ]);
    }
  };

  // Select
  const baseTokens = useMemo(
    () =>
      Object.entries(balancesCoinMetadataMap ?? {})
        .filter(([coinType]) => getBalance(coinType).gt(0))
        .filter(
          ([coinType]) =>
            quoterId === undefined ||
            !(
              [QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(quoterId) &&
              appData.COINTYPE_ORACLE_INDEX_MAP[coinType] === undefined
            ),
        )
        .map(([coinType, coinMetadata]) => getToken(coinType, coinMetadata))
        .sort(
          (a, b) => (a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1), // Sort by symbol (ascending)
        ),
    [
      balancesCoinMetadataMap,
      getBalance,
      quoterId,
      appData.COINTYPE_ORACLE_INDEX_MAP,
    ],
  );

  const getQuotePrice = useCallback(
    (coinType: string) => appData.coinTypeOracleInfoPriceMap[coinType]?.price,
    [appData.coinTypeOracleInfoPriceMap],
  );

  const quoteTokens = useMemo(
    () =>
      baseTokens.filter((token) => getQuotePrice(token.coinType) !== undefined),
    [baseTokens, getQuotePrice],
  );

  const onSelectToken = (token: Token, index: number) => {
    const newCoinTypes: [string, string] = [
      index === 0
        ? token.coinType
        : token.coinType === coinTypes[0]
          ? coinTypes[1]
          : coinTypes[0],
      index === 0
        ? token.coinType === coinTypes[1]
          ? coinTypes[0]
          : coinTypes[1]
        : token.coinType,
    ];

    for (const coinType of newCoinTypes.filter((coinType) => coinType !== "")) {
      if (birdeyeUsdPricesMap[coinType] === undefined)
        fetchBirdeyeUsdPrice(coinType);
    }

    setCoinTypes(newCoinTypes);
    onValueChange(values[index], index, newCoinTypes[index]);

    setTimeout(() => {
      document.getElementById(getCoinInputId(newCoinTypes[index]))?.focus();
    }, 250);
  };

  // Amplifier
  const [amplifier, setAmplifier] = useState<number | undefined>(undefined);

  // Fee tier
  const [feeTierPercent, setFeeTierPercent] = useState<number | undefined>(
    undefined,
  );

  // CPMM offset
  const [useCpmmOffset, setUseCpmmOffset] = useState<boolean>(false);
  const [initialMarketCapUsd, setInitialMarketCapUsd] = useState<string>("");

  const onUseCpmmOffsetChange = () => {
    const newValue = !useCpmmOffset;
    if (newValue) {
      setValues((prev) => [prev[0], "0"] as [string, string]);
      onSelectQuoter(QuoterId.CPMM);

      setUseCpmmOffset(true);
      setInitialMarketCapUsd("");
    } else {
      setValues((prev) => [prev[0], ""] as [string, string]);
      setQuoterId(undefined);

      setUseCpmmOffset(false);
      setInitialMarketCapUsd("");
    }
  };

  const onInitialMarketCapUsdChange = useCallback((value: string) => {
    const formattedValue = formatTextInputValue(value, 2);
    setInitialMarketCapUsd(formattedValue);
  }, []);

  // CPMM offset - compute
  const {
    cpmmOffset,
    tokenInitialPriceQuote,
  }: {
    cpmmOffset: bigint | undefined;
    tokenInitialPriceQuote: BigNumber | undefined;
  } = useMemo(() => {
    if (
      coinTypes.some((coinType) => coinType === "") ||
      values[0] === "" ||
      initialMarketCapUsd === ""
    )
      return { cpmmOffset: undefined, tokenInitialPriceQuote: undefined };

    const quotePrice = getQuotePrice(coinTypes[1])!;

    const tokenInitialPriceUsd = new BigNumber(initialMarketCapUsd).div(
      values[0],
    );
    const tokenInitialPriceQuote = tokenInitialPriceUsd.div(quotePrice);

    return {
      cpmmOffset: computeOptimalOffset(
        tokenInitialPriceQuote.toFixed(20, BigNumber.ROUND_DOWN),
        BigInt(
          new BigNumber(values[0])
            .times(10 ** balancesCoinMetadataMap![coinTypes[0]].decimals)
            .integerValue(BigNumber.ROUND_DOWN)
            .toString(),
        ),
        balancesCoinMetadataMap![coinTypes[0]].decimals,
        balancesCoinMetadataMap![coinTypes[1]].decimals,
      ),
      tokenInitialPriceQuote,
    };
  }, [
    coinTypes,
    values,
    initialMarketCapUsd,
    getQuotePrice,
    balancesCoinMetadataMap,
  ]);

  // Existing pools
  const existingPools: ParsedPool[] = useMemo(
    () =>
      appData.pools.filter(
        (pool) =>
          pool.coinTypes[0] === coinTypes[0] &&
          pool.coinTypes[1] === coinTypes[1],
      ),
    [appData.pools, coinTypes],
  );

  const hasExistingPoolForQuoterFeeTierAndAmplifier = (
    _quoterId?: QuoterId,
    _feeTierPercent?: number,
    _amplifier?: number,
  ) =>
    !!existingPools.find(
      (pool) =>
        pool.quoterId === _quoterId &&
        +pool.feeTierPercent === _feeTierPercent &&
        (_quoterId === QuoterId.ORACLE_V2
          ? +(
              pool.pool as Pool<string, string, OracleQuoterV2, string>
            ).quoter.amp.toString() === _amplifier
          : true),
    );

  const existingPoolTooltip = coinTypes.every((coinType) => coinType !== "")
    ? `${formatPair(coinTypes.map((coinType) => balancesCoinMetadataMap![coinType].symbol))} pool with this quoter${quoterId === QuoterId.ORACLE_V2 ? ", amplifier, and fee tier" : " and fee tier"} already exists`
    : undefined;

  // Submit
  const reset = () => {
    // Progress
    setHasFailed(false);

    setBTokensAndBankIds([undefined, undefined]);
    setCreateLpTokenResult(undefined);
    setCreatePoolResult(undefined);
    setHasClearedCache(false);

    // Pool
    setCoinTypes(["", ""]);
    setTimeout(() => baseAssetCoinInputRef.current?.focus(), 100); // After dialog is closed

    setValues(["", ""]);
    setLastActiveInputIndex(undefined);
    setQuoterId(undefined);
    setAmplifier(undefined);
    setFeeTierPercent(undefined);

    setUseCpmmOffset(false);
    setInitialMarketCapUsd("");
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) {
      return {
        isDisabled: true,
        title: hasFailed ? "Retry" : "Create pool and deposit",
      };
    }
    if (hasClearedCache) return { isDisabled: true, isSuccess: true };

    if (coinTypes.some((coinType) => coinType === ""))
      return { isDisabled: true, title: "Select tokens" };
    if (useCpmmOffset ? values[0] === "" : values.some((value) => value === ""))
      return { isDisabled: true, title: "Enter amounts" };
    if (
      useCpmmOffset
        ? new BigNumber(values[0]).lt(0)
        : Object.values(values).some((value) => new BigNumber(value).lt(0))
    )
      return { isDisabled: true, title: "Enter a +ve amounts" };
    if (
      useCpmmOffset
        ? new BigNumber(values[0]).eq(0)
        : Object.values(values).some((value) => new BigNumber(value).eq(0))
    )
      return { isDisabled: true, title: "Enter a non-zero amounts" };
    if (quoterId === undefined)
      return { isDisabled: true, title: "Select a quoter" };
    if (quoterId === QuoterId.ORACLE_V2) {
      if (amplifier === undefined)
        return { isDisabled: true, title: "Select an amplifier" };
    }
    if (feeTierPercent === undefined)
      return { isDisabled: true, title: "Select a fee tier" };

    if (
      hasExistingPoolForQuoterFeeTierAndAmplifier(
        quoterId,
        feeTierPercent,
        amplifier,
      )
    )
      return {
        isDisabled: true,
        title: "Pool already exists",
      };

    //

    for (let i = 0; i < coinTypes.length; i++) {
      const coinType = coinTypes[i];
      const coinMetadata = balancesCoinMetadataMap![coinType];

      if (getBalance(coinType).lt(values[i]))
        return {
          isDisabled: true,
          title: `Insufficient ${coinMetadata.symbol}`,
        };
    }

    // Failed
    if (hasFailed) return { isDisabled: false, title: "Retry" };

    return {
      isDisabled: false,
      title: "Create pool and deposit",
    };
  })();

  const onSubmitClick = async () => {
    if (submitButtonState.isDisabled) return;
    if (!quoterId || !feeTierPercent) return;

    try {
      if (!address) throw new Error("Wallet not connected");

      setIsSubmitting(true);

      // 0) Prepare
      const tokens = coinTypes.map((coinType) =>
        getToken(coinType, balancesCoinMetadataMap![coinType]),
      ) as [Token, Token];
      if (!tokens.every((token) => !!token.id))
        throw new Error("Token coinMetadata id not found");

      await initializeCoinCreation();

      // 1) Get/create bTokens and banks (2 transactions for each missing bToken+bank pair = 0, 2, or 4 transactions in total)
      const _bTokensAndBankIds = bTokensAndBankIds;
      if (
        _bTokensAndBankIds.some(
          (bTokenAndBankId) => bTokenAndBankId === undefined,
        )
      ) {
        for (const index of [0, 1]) {
          if (_bTokensAndBankIds[index] === undefined) {
            _bTokensAndBankIds[index] = hasBTokenAndBankForToken(
              tokens[index],
              appData,
            )
              ? await getBTokenAndBankForToken(
                  tokens[index],
                  suiClient,
                  appData,
                )
              : await (async () => {
                  const result = await createBTokenAndBankForToken(
                    tokens[index],
                    steammClient,
                    appData,
                    address,
                    signExecuteAndWaitForTransaction,
                  );
                  await new Promise((resolve) => setTimeout(resolve, 2000));

                  return result;
                })();

            setBTokensAndBankIds(
              (prev) =>
                [0, 1].map((i) =>
                  i === index ? _bTokensAndBankIds[index] : prev[i],
                ) as [
                  (
                    | GetBTokenAndBankForTokenResult
                    | CreateBTokenAndBankForTokenResult
                    | undefined
                  ),
                  (
                    | GetBTokenAndBankForTokenResult
                    | CreateBTokenAndBankForTokenResult
                    | undefined
                  ),
                ],
            );
          }
        }
      }

      const bTokens = _bTokensAndBankIds.map(
        (bTokenAndBankId) => bTokenAndBankId!.bToken,
      ) as [Token, Token];
      const bankIds = _bTokensAndBankIds.map(
        (bTokenAndBankId) => bTokenAndBankId!.bankId,
      ) as [string, string];

      // 2) Create LP token (1 transaction)
      let _createLpTokenResult = createLpTokenResult;
      if (_createLpTokenResult === undefined) {
        _createLpTokenResult = await createLpToken(
          bTokens,
          address,
          signExecuteAndWaitForTransaction,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setCreateLpTokenResult(_createLpTokenResult);
      }

      // 3) Create pool and deposit initial liquidity (1 transaction)
      let _createPoolResult = createPoolResult;
      if (_createPoolResult === undefined) {
        _createPoolResult = await createPoolAndDepositInitialLiquidity(
          tokens,
          values,
          quoterId,
          useCpmmOffset ? cpmmOffset : undefined,
          amplifier,
          feeTierPercent,
          bTokens,
          bankIds,
          _createLpTokenResult,
          false,
          steammClient,
          appData,
          address,
          signExecuteAndWaitForTransaction,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setCreatePoolResult(_createPoolResult);
      }

      const _hasClearedCache = hasClearedCache;
      if (!_hasClearedCache) {
        await fetch(`${API_URL}/steamm/clear-cache`);

        await new Promise((resolve) => setTimeout(resolve, 2000));
        setHasClearedCache(true);
      }

      const txUrl = explorer.buildTxUrl(_createPoolResult.res.digest);
      showSuccessTxnToast(
        `Created ${formatPair(tokens.map((token) => token.symbol))} ${QUOTER_ID_NAME_MAP[quoterId]} ${formatFeeTier(new BigNumber(feeTierPercent))} pool`,
        txUrl,
        { description: "Deposited initial liquidity" },
      );
    } catch (err) {
      showErrorToast("Failed to create pool", err as Error, undefined, true);
      console.error(err);

      setHasFailed(true);
    } finally {
      setIsSubmitting(false);
      refresh();
    }
  };

  const isStepsDialogOpen = isSubmitting || hasClearedCache;

  return (
    <>
      <CreatePoolStepsDialog
        isOpen={isStepsDialogOpen}
        bTokensAndBankIds={bTokensAndBankIds}
        createdLpToken={createLpTokenResult}
        createPoolResult={createPoolResult}
        hasClearedCache={hasClearedCache}
        reset={reset}
      />

      <div className="flex w-full flex-col gap-6">
        <div
          className={cn(
            "flex w-full flex-col gap-4",
            hasFailed && "pointer-events-none",
          )}
        >
          {/* Base asset */}
          <div className="flex w-full flex-col gap-3">
            <p className="text-p2 text-secondary-foreground">Base asset</p>
            <CoinInput
              ref={baseAssetCoinInputRef}
              autoFocus
              token={
                coinTypes[0] !== ""
                  ? getToken(
                      coinTypes[0],
                      balancesCoinMetadataMap![coinTypes[0]],
                    )
                  : undefined
              }
              value={values[0]}
              usdValue={birdeyeUsdValues[0]}
              onChange={(value) => onValueChange(value, 0)}
              onMaxAmountClick={
                coinTypes[0] !== "" ? () => onBalanceClick(0) : undefined
              }
              tokens={baseTokens}
              onSelectToken={(token) => onSelectToken(token, 0)}
            />
          </div>

          {isWhitelisted && (
            <>
              {/* Use CPMM offset */}
              <Parameter label="Use CPMM offset" isHorizontal>
                <button
                  className={cn(
                    "group flex h-5 w-5 flex-row items-center justify-center rounded-sm border transition-colors",
                    useCpmmOffset
                      ? "border-button-1 bg-button-1/25"
                      : "hover:bg-border/50",
                  )}
                  onClick={onUseCpmmOffsetChange}
                >
                  {useCpmmOffset && (
                    <Check className="h-4 w-4 text-foreground" />
                  )}
                </button>
              </Parameter>

              {useCpmmOffset && (
                <>
                  {/* Quote asset */}
                  <div className="flex flex-row justify-between">
                    <p className="text-p2 text-secondary-foreground">
                      Quote asset
                    </p>

                    <TokenSelectionDialog
                      triggerClassName="h-6"
                      triggerIconSize={16}
                      triggerLabelSelectedClassName="!text-p2"
                      triggerLabelUnselectedClassName="!text-p2"
                      triggerChevronClassName="!h-4 !w-4 !ml-0 !mr-0"
                      token={
                        coinTypes[1] !== ""
                          ? getToken(
                              coinTypes[1],
                              balancesCoinMetadataMap![coinTypes[1]],
                            )
                          : undefined
                      }
                      tokens={quoteTokens}
                      onSelectToken={(token) => onSelectToken(token, 1)}
                    />
                  </div>

                  {/* Initial market cap */}
                  <div className="flex w-full flex-col gap-2">
                    <p className="text-p2 text-secondary-foreground">
                      Initial market cap ($)
                    </p>
                    <TextInput
                      placeholder={initialMarketCapUsd.toString()}
                      value={initialMarketCapUsd}
                      onChange={onInitialMarketCapUsdChange}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Quote */}
          {!useCpmmOffset && (
            <div className="flex w-full flex-col gap-3">
              <div className="flex w-full flex-col gap-1">
                <p className="text-p2 text-secondary-foreground">Quote asset</p>
                <p className="text-p3 text-tertiary-foreground">
                  SUI or stablecoins (e.g. USDC, USDT) are usually used as the
                  quote asset.
                </p>
              </div>
              <CoinInput
                token={
                  coinTypes[1] !== ""
                    ? getToken(
                        coinTypes[1],
                        balancesCoinMetadataMap![coinTypes[1]],
                      )
                    : undefined
                }
                value={values[1]}
                usdValue={birdeyeUsdValues[1]}
                onChange={(value) => onValueChange(value, 1)}
                onMaxAmountClick={
                  coinTypes[1] !== "" ? () => onBalanceClick(1) : undefined
                }
                tokens={quoteTokens}
                onSelectToken={(token) => onSelectToken(token, 1)}
              />
            </div>
          )}

          <div className="flex w-full flex-col gap-2">
            {/* Initial price */}
            <Parameter label="Initial price" isHorizontal>
              <div className="flex flex-row items-center gap-2">
                <p className="text-p2 text-foreground">
                  {!useCpmmOffset
                    ? coinTypes.every((coinType) => coinType !== "") &&
                      values.every((value) => value !== "")
                      ? `1 ${balancesCoinMetadataMap![coinTypes[0]].symbol} = ${new BigNumber(
                          new BigNumber(values[1]).div(values[0]),
                        ).toFixed(
                          balancesCoinMetadataMap![coinTypes[1]].decimals,
                          BigNumber.ROUND_DOWN,
                        )} ${balancesCoinMetadataMap![coinTypes[1]].symbol}`
                      : "--"
                    : tokenInitialPriceQuote !== undefined
                      ? `1 ${balancesCoinMetadataMap![coinTypes[0]].symbol} = ${formatToken(tokenInitialPriceQuote, { dp: balancesCoinMetadataMap![coinTypes[1]].decimals })} ${balancesCoinMetadataMap![coinTypes[1]].symbol}`
                      : "--"}
                </p>

                {!useCpmmOffset
                  ? null
                  : tokenInitialPriceQuote !== undefined && (
                      <p className="text-p2 text-secondary-foreground">
                        {formatPrice(
                          tokenInitialPriceQuote.times(
                            getQuotePrice(coinTypes[1]),
                          ),
                        )}
                      </p>
                    )}
              </div>
            </Parameter>

            {!useCpmmOffset && (
              // Market price
              <Parameter label="Market price (Birdeye)" isHorizontal>
                <div className="flex flex-col items-end gap-1.5">
                  <p className="text-p2 text-foreground">
                    {coinTypes.every((coinType) => coinType !== "") ? (
                      birdeyeRatio === undefined ? (
                        <Skeleton className="h-[21px] w-24" />
                      ) : birdeyeRatio === null ? (
                        "--"
                      ) : (
                        `1 ${balancesCoinMetadataMap![coinTypes[0]].symbol} = ${birdeyeRatio.toFixed(
                          balancesCoinMetadataMap![coinTypes[1]].decimals,
                          BigNumber.ROUND_DOWN,
                        )} ${balancesCoinMetadataMap![coinTypes[1]].symbol}`
                      )
                    ) : (
                      "--"
                    )}
                  </p>

                  {coinTypes.every((coinType) => coinType !== "") &&
                    (birdeyeRatio === undefined ? (
                      <Skeleton className="h-[24px] w-16" />
                    ) : birdeyeRatio === null ? null : (
                      <button
                        className="group flex h-6 flex-row items-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80"
                        onClick={onUseBirdeyePriceClick}
                      >
                        <p className="text-p3 text-button-2-foreground">
                          Use market price
                        </p>
                      </button>
                    ))}
                </div>
              </Parameter>
            )}
          </div>

          {/* Quoter */}
          {!useCpmmOffset && (
            <div className="flex flex-row items-center justify-between">
              <p className="text-p2 text-secondary-foreground">Quoter</p>

              <div className="flex flex-row gap-1">
                {QUOTER_IDS.filter((_quoterId) =>
                  isWhitelisted ? true : PUBLIC_QUOTER_IDS.includes(_quoterId),
                ).map((_quoterId) => {
                  const hasExistingPool =
                    hasExistingPoolForQuoterFeeTierAndAmplifier(
                      _quoterId,
                      feeTierPercent,
                      amplifier,
                    );

                  return (
                    <div key={_quoterId} className="w-max">
                      <Tooltip
                        title={
                          hasExistingPool ? existingPoolTooltip : undefined
                        }
                      >
                        <div className="w-max">
                          <button
                            key={_quoterId}
                            className={cn(
                              "group flex h-10 flex-row items-center rounded-md border px-3 transition-colors disabled:pointer-events-none disabled:opacity-50",
                              _quoterId === quoterId
                                ? "cursor-default border-button-1 bg-button-1/25"
                                : "hover:bg-border/50",
                            )}
                            onClick={() => onSelectQuoter(_quoterId)}
                            disabled={hasExistingPool}
                          >
                            <p
                              className={cn(
                                "!text-p2 transition-colors",
                                _quoterId === quoterId
                                  ? "text-foreground"
                                  : "text-secondary-foreground group-hover:text-foreground",
                              )}
                            >
                              {QUOTER_ID_NAME_MAP[_quoterId]}
                            </p>
                          </button>
                        </div>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amplifier */}
          {quoterId === QuoterId.ORACLE_V2 && (
            <div className="flex flex-row items-center justify-between">
              <Tooltip title={AMPLIFIER_TOOLTIP}>
                <p
                  className={cn(
                    "text-p2 text-secondary-foreground decoration-secondary-foreground/50",
                    hoverUnderlineClassName,
                  )}
                >
                  Amplifier
                </p>
              </Tooltip>

              <div className="flex flex-row gap-1">
                {AMPLIFIERS.map((_amplifier) => {
                  const hasExistingPool =
                    hasExistingPoolForQuoterFeeTierAndAmplifier(
                      quoterId,
                      feeTierPercent,
                      _amplifier,
                    );

                  return (
                    <div key={_amplifier} className="w-max">
                      <Tooltip
                        title={
                          hasExistingPool ? existingPoolTooltip : undefined
                        }
                      >
                        <div className="w-max">
                          <button
                            className={cn(
                              "group flex h-10 flex-row items-center rounded-md border px-3 transition-colors disabled:pointer-events-none disabled:opacity-50",
                              amplifier === _amplifier
                                ? "cursor-default border-button-1 bg-button-1/25"
                                : "hover:bg-border/50",
                            )}
                            onClick={() => setAmplifier(_amplifier)}
                            disabled={hasExistingPool}
                          >
                            <p
                              className={cn(
                                "!text-p2 transition-colors",
                                amplifier === _amplifier
                                  ? "text-foreground"
                                  : "text-secondary-foreground group-hover:text-foreground",
                              )}
                            >
                              {formatAmplifier(new BigNumber(_amplifier))}
                            </p>
                          </button>
                        </div>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fee tier */}
          <div className="flex flex-row justify-between">
            <div className="flex h-10 flex-row items-center">
              <p className="shrink-0 text-p2 text-secondary-foreground">
                Fee tier
              </p>
            </div>

            <div className="flex flex-1 flex-row flex-wrap justify-end gap-1">
              {FEE_TIER_PERCENTS.filter((_feeTierPercent) =>
                isWhitelisted
                  ? true
                  : PUBLIC_FEE_TIER_PERCENTS.includes(_feeTierPercent),
              ).map((_feeTierPercent) => {
                const hasExistingPool =
                  hasExistingPoolForQuoterFeeTierAndAmplifier(
                    quoterId,
                    _feeTierPercent,
                    amplifier,
                  );

                return (
                  <div key={_feeTierPercent} className="w-max">
                    <Tooltip
                      title={hasExistingPool ? existingPoolTooltip : undefined}
                    >
                      <div className="w-max">
                        <button
                          className={cn(
                            "group flex h-10 flex-row items-center rounded-md border px-3 transition-colors disabled:pointer-events-none disabled:opacity-50",
                            feeTierPercent === _feeTierPercent
                              ? "cursor-default border-button-1 bg-button-1/25"
                              : "hover:bg-border/50",
                          )}
                          onClick={() => setFeeTierPercent(_feeTierPercent)}
                          disabled={hasExistingPool}
                        >
                          <p
                            className={cn(
                              "!text-p2 transition-colors",
                              feeTierPercent === _feeTierPercent
                                ? "text-foreground"
                                : "text-secondary-foreground group-hover:text-foreground",
                            )}
                          >
                            {formatFeeTier(new BigNumber(_feeTierPercent))}
                          </p>
                        </button>
                      </div>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-1">
          <SubmitButton
            submitButtonState={submitButtonState}
            onClick={onSubmitClick}
          />

          {hasFailed && !hasClearedCache && (
            <button
              className="group flex h-10 w-full flex-row items-center justify-center rounded-md border px-3 transition-colors hover:bg-border/50"
              onClick={reset}
            >
              <p className="text-p2 text-secondary-foreground transition-colors group-hover:text-foreground">
                Start over
              </p>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
