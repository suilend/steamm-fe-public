import { useCallback, useMemo, useRef, useState } from "react";

import BigNumber from "bignumber.js";
import { useFlags } from "launchdarkly-react-client-sdk";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import {
  API_URL,
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_USDC_COINTYPE,
  Token,
  formatInteger,
  formatNumber,
  formatPercent,
  formatToken,
  formatUsd,
  getToken,
  isSend,
  isStablecoin,
  isSui,
} from "@suilend/frontend-sui";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import { ADMIN_ADDRESS, computeOptimalOffset } from "@suilend/steamm-sdk";

import Divider from "@/components/Divider";
import IconUpload from "@/components/launch/IconUpload";
import LaunchTokenStepsDialog from "@/components/launch/LaunchTokenStepsDialog";
import Parameter from "@/components/Parameter";
import PercentInput from "@/components/PercentInput";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import TokenSelectionDialog from "@/components/swap/TokenSelectionDialog";
import TextInput from "@/components/TextInput";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { CreateCoinResult, initializeCoinCreation } from "@/lib/createCoin";
import {
  CreateBTokenAndBankForTokenResult,
  CreatePoolAndDepositInitialLiquidityResult,
  GetBTokenAndBankForTokenResult,
  createBTokenAndBankForToken,
  createLpToken,
  createPoolAndDepositInitialLiquidity,
  getBTokenAndBankForToken,
  hasBTokenAndBankForToken,
} from "@/lib/createPool";
import {
  formatPair,
  formatPercentInputValue,
  formatTextInputValue,
} from "@/lib/format";
import {
  BLACKLISTED_WORDS,
  BROWSE_MAX_FILE_SIZE_BYTES,
  DEFAULT_TOKEN_DECIMALS,
  DEFAULT_TOKEN_SUPPLY,
  DEPOSITED_TOKEN_PERCENT,
  FEE_TIER_PERCENT,
  INITIAL_TOKEN_MC_USD,
  MintTokenResult,
  QUOTER_ID,
  createToken,
  mintToken,
} from "@/lib/launchToken";
import { getAvgPoolPrice } from "@/lib/pools";
import { showSuccessTxnToast } from "@/lib/toasts";
import { cn } from "@/lib/utils";

export default function LaunchTokenCard() {
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

  // LST
  const isLst = useCallback(
    (coinType: string) =>
      Object.keys(appData.lstAprPercentMap).includes(coinType),
    [appData.lstAprPercentMap],
  );

  // State - progress
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  const [createTokenResult, setCreateTokenResult] = useState<
    CreateCoinResult | undefined
  >(undefined);
  const [mintTokenResult, setMintTokenResult] = useState<
    MintTokenResult | undefined
  >(undefined);

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

  // State - token
  const [showOptional, setShowOptional] = useState<boolean>(false);

  const [name, setName] = useState<string>("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [symbol, setSymbol] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [iconUrl, setIconUrl] = useState<string>("");
  const [iconFilename, setIconFilename] = useState<string>("");
  const [iconFileSize, setIconFileSize] = useState<string>("");

  // State - token - decimals
  const [decimalsRaw, setDecimalsRaw] = useState<string>(
    DEFAULT_TOKEN_DECIMALS.toString(),
  );
  const [decimals, setDecimals] = useState<number>(DEFAULT_TOKEN_DECIMALS);

  const onDecimalsChange = useCallback((value: string) => {
    const formattedValue = formatTextInputValue(value, 0);
    setDecimalsRaw(formattedValue);

    try {
      if (formattedValue === "") return;
      if (isNaN(+formattedValue)) throw new Error("Decimals must be a number");
      if (+formattedValue < 1 || +formattedValue > 9)
        throw new Error("Decimals must be between 1 and 9");

      setDecimals(+formattedValue);
    } catch (err) {
      console.error(err);
      showErrorToast("Invalid decimals", err as Error);
    }
  }, []);

  // State - token - supply
  const [supplyRaw, setSupplyRaw] = useState<string>(
    DEFAULT_TOKEN_SUPPLY.toString(),
  );
  const [supply, setSupply] = useState<number>(DEFAULT_TOKEN_SUPPLY);

  const onSupplyChange = useCallback(
    (value: string) => {
      const formattedValue = formatTextInputValue(value, decimals);
      setSupplyRaw(formattedValue);

      try {
        if (formattedValue === "") return;
        if (isNaN(+formattedValue)) throw new Error("Supply must be a number");
        if (new BigNumber(formattedValue).lt(10 ** 3))
          throw new Error(`Supply must be at least ${formatInteger(10 ** 3)}`);
        if (new BigNumber(formattedValue).gt(10 ** 12))
          throw new Error(`Supply must be at most ${formatInteger(10 ** 12)}`);

        setSupply(+formattedValue);
      } catch (err) {
        console.error(err);
        showErrorToast("Invalid supply", err as Error);
      }
    },
    [decimals],
  );

  // State - token - deposited supply %
  const [depositedSupplyPercentRaw, setDepositedSupplyPercentRaw] =
    useState<string>(DEPOSITED_TOKEN_PERCENT.toString());
  const [depositedSupplyPercent, setDepositedSupplyPercent] = useState<number>(
    DEPOSITED_TOKEN_PERCENT,
  );

  const onDepositedSupplyPercentChange = useCallback((value: string) => {
    const formattedValue = formatPercentInputValue(value, 2);
    setDepositedSupplyPercentRaw(formattedValue);

    try {
      if (formattedValue === "") return;
      if (isNaN(+formattedValue))
        throw new Error("Deposited supply % must be a number");
      if (new BigNumber(formattedValue).lt(1))
        throw new Error(
          `Deposited supply % must be at least ${formatPercent(
            new BigNumber(1),
            { dp: 0 },
          )}`,
        );
      if (new BigNumber(formattedValue).gt(100))
        throw new Error(
          `Deposited supply % must be at most ${formatPercent(
            new BigNumber(100),
            { dp: 0 },
          )}`,
        );

      setDepositedSupplyPercent(+formattedValue);
    } catch (err) {
      console.error(err);
      showErrorToast("Invalid deposited supply %", err as Error);
    }
  }, []);

  // State - token - initial MC
  const [initialMarketCapRaw, setInitialMarketCapRaw] = useState<string>(
    INITIAL_TOKEN_MC_USD.toString(),
  );
  const [initialMarketCap, setInitialMarketCap] =
    useState<number>(INITIAL_TOKEN_MC_USD);

  const onInitialMarketCapChange = useCallback((value: string) => {
    const formattedValue = formatTextInputValue(value, 2);
    setInitialMarketCapRaw(formattedValue);

    try {
      if (formattedValue === "") return;
      if (isNaN(+formattedValue))
        throw new Error("Initial market cap must be a number");
      if (new BigNumber(formattedValue).lt(1))
        throw new Error(
          `Initial market cap must be at least ${formatUsd(new BigNumber(1), {
            dp: 0,
          })}`,
        );
      if (new BigNumber(formattedValue).gt(10 ** 9))
        throw new Error(
          `Initial market cap must be at most ${formatUsd(
            new BigNumber(10 ** 9),
            { dp: 0 },
          )}`,
        );

      setInitialMarketCap(+formattedValue);
    } catch (err) {
      console.error(err);
      showErrorToast("Invalid initial market cap", err as Error);
    }
  }, []);

  // State - token - non-mintable
  const [nonMintable, setNonMintable] = useState<boolean>(true);

  // State - pool - quote asset
  const getQuotePrice = useCallback(
    (coinType: string) =>
      isSui(coinType) || isLst(coinType)
        ? appData.coinTypeOracleInfoPriceMap[NORMALIZED_SUI_COINTYPE]?.price
        : isStablecoin(coinType)
          ? appData.coinTypeOracleInfoPriceMap[NORMALIZED_USDC_COINTYPE]?.price
          : (appData.coinTypeOracleInfoPriceMap[coinType]?.price ??
            getAvgPoolPrice(appData.pools, coinType)),
    [isLst, appData.coinTypeOracleInfoPriceMap, appData.pools],
  );

  const quoteTokens = useMemo(
    () =>
      Object.entries(balancesCoinMetadataMap ?? {})
        .filter(
          ([coinType]) =>
            (isSend(coinType) ||
              isSui(coinType) ||
              isStablecoin(coinType) ||
              Object.keys(appData.lstAprPercentMap).includes(coinType) ||
              appData.coinTypeOracleInfoPriceMap[coinType] !== undefined) &&
            getQuotePrice(coinType) !== undefined,
        )
        .filter(([coinType]) => getBalance(coinType).gt(0))
        .map(([coinType, coinMetadata]) => getToken(coinType, coinMetadata))
        .sort(
          (a, b) => (a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1), // Sort by symbol (ascending)
        ),
    [
      balancesCoinMetadataMap,
      appData.lstAprPercentMap,
      appData.coinTypeOracleInfoPriceMap,
      getQuotePrice,
      getBalance,
    ],
  );

  const [quoteAssetCoinType, setQuoteAssetCoinType] = useState<
    string | undefined
  >(undefined);
  const quoteToken =
    quoteAssetCoinType !== undefined
      ? getToken(
          quoteAssetCoinType,
          balancesCoinMetadataMap![quoteAssetCoinType],
        )
      : undefined;

  // State - pool - burn LP tokens
  const [burnLpTokens, setBurnLpTokens] = useState<boolean>(false);

  // Offset
  const offset: bigint | undefined = useMemo(() => {
    if (quoteToken === undefined) return undefined;

    const depositedSupply = new BigNumber(supply)
      .times(depositedSupplyPercent)
      .div(100);

    const quotePrice = getQuotePrice(quoteToken.coinType)!;

    const tokenInitialPriceUsd = new BigNumber(initialMarketCap).div(
      depositedSupply,
    );
    const tokenInitialPriceQuote = tokenInitialPriceUsd.div(quotePrice);

    return computeOptimalOffset(
      tokenInitialPriceQuote.toFixed(20, BigNumber.ROUND_DOWN),
      BigInt(
        depositedSupply
          .times(10 ** decimals)
          .integerValue(BigNumber.ROUND_DOWN)
          .toString(),
      ),
      decimals,
      quoteToken.decimals,
    );
  }, [
    quoteToken,
    supply,
    depositedSupplyPercent,
    getQuotePrice,
    initialMarketCap,
    decimals,
  ]);

  // Submit
  const reset = () => {
    // Progress
    setHasFailed(false);

    setCreateTokenResult(undefined);
    setMintTokenResult(undefined);
    setBTokensAndBankIds([undefined, undefined]);
    setCreateLpTokenResult(undefined);
    setCreatePoolResult(undefined);
    setHasClearedCache(false);

    // Token
    setShowOptional(false);

    setName("");
    setTimeout(() => nameInputRef.current?.focus(), 100); // After dialog is closed

    setSymbol("");
    setDescription("");

    setIconUrl("");
    setIconFilename("");
    setIconFileSize("");
    (document.getElementById("icon-upload") as HTMLInputElement).value = "";

    setDecimalsRaw(DEFAULT_TOKEN_DECIMALS.toString());
    setDecimals(DEFAULT_TOKEN_DECIMALS);
    setSupplyRaw(DEFAULT_TOKEN_SUPPLY.toString());
    setSupply(DEFAULT_TOKEN_SUPPLY);
    setDepositedSupplyPercentRaw(DEPOSITED_TOKEN_PERCENT.toString());
    setDepositedSupplyPercent(DEPOSITED_TOKEN_PERCENT);
    setInitialMarketCapRaw(INITIAL_TOKEN_MC_USD.toString());
    setInitialMarketCap(INITIAL_TOKEN_MC_USD);
    setNonMintable(true);

    // Pool
    setQuoteAssetCoinType(undefined);
    setBurnLpTokens(false);
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) {
      return {
        isDisabled: true,
        title: hasFailed ? "Retry" : "Launch token & create pool",
      };
    }
    if (hasClearedCache) return { isDisabled: true, isSuccess: true };

    // Name
    if (name === "") return { isDisabled: true, title: "Enter a name" };
    if (name.length < 3 || name.length > 32)
      return {
        isDisabled: true,
        title: "Name must be between 3 and 32 characters",
      };

    // Symbol
    if (symbol === "") return { isDisabled: true, title: "Enter a symbol" };
    if (symbol !== symbol.toUpperCase())
      return { isDisabled: true, title: "Symbol must be uppercase" };
    if (/\s/.test(symbol))
      return { isDisabled: true, title: "Symbol cannot contain spaces" };
    if (/^\d/.test(symbol))
      return { isDisabled: true, title: "Symbol cannot start with a number" };
    if (/[^A-Z0-9]/.test(symbol))
      return {
        isDisabled: true,
        title: "Symbol cannot contain special characters",
      };
    if (symbol.length < 1 || symbol.length > 8)
      return {
        isDisabled: true,
        title: "Symbol must be between 1 and 8 characters",
      };
    if (
      address !== ADMIN_ADDRESS &&
      BLACKLISTED_WORDS.includes(symbol.toLowerCase())
    )
      return {
        isDisabled: true,
        title: "Symbol cannot be a reserved or blacklisted word",
      };
    if (symbol === name)
      return {
        isDisabled: true,
        title: "Symbol can't be the same as the name",
      };
    // Don't enforce symbol uniqueness

    // Description
    if (description.length > 256)
      return {
        isDisabled: true,
        title: "Description must be 256 characters or less",
      };

    // Icon
    if (iconUrl === "") return { isDisabled: true, title: "Upload an icon" };

    // Decimals
    if (decimalsRaw === "")
      return { isDisabled: true, title: "Enter number of decimals" };

    // Supply
    if (supplyRaw === "") return { isDisabled: true, title: "Enter a supply" };

    // Deposited supply %
    if (depositedSupplyPercentRaw === "")
      return { isDisabled: true, title: "Enter deposited supply %" };

    //

    if (quoteAssetCoinType === undefined)
      return { isDisabled: true, title: "Select a quote asset" };

    // Failed
    if (hasFailed) return { isDisabled: false, title: "Retry" };

    return {
      isDisabled: false,
      title: "Launch token & create pool",
    };
  })();

  const onSubmitClick = async () => {
    if (submitButtonState.isDisabled) return;
    if (!quoteToken) return; // Should not happen

    try {
      if (!address) throw new Error("Wallet not connected");

      setIsSubmitting(true);

      // 0) Prepare
      if (!quoteToken.id) throw new Error("Token coinMetadata id not found");

      await initializeCoinCreation();

      // 1) Create token
      let _createTokenResult = createTokenResult;
      if (_createTokenResult === undefined) {
        _createTokenResult = await createToken(
          name,
          symbol,
          description,
          iconUrl,
          decimals,
          address,
          signExecuteAndWaitForTransaction,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setCreateTokenResult(_createTokenResult);
      }

      const createdToken = getToken(_createTokenResult.coinType, {
        decimals,
        description,
        iconUrl,
        id: _createTokenResult.coinMetadataId,
        name,
        symbol,
      });
      const tokens = [createdToken, quoteToken] as [Token, Token];

      // 2) Mint token
      let _mintTokenResult = mintTokenResult;
      if (_mintTokenResult === undefined) {
        _mintTokenResult = await mintToken(
          _createTokenResult,
          supply,
          decimals,
          nonMintable,
          address,
          signExecuteAndWaitForTransaction,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setMintTokenResult(_mintTokenResult);
      }

      // 3) Get/create bTokens and banks (2 transactions for each missing bToken+bank pair = 0, 2, or 4 transactions in total)
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

      // 4) Create LP token (1 transaction)
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

      // 5) Create pool and deposit initial liquidity (1 transaction)
      const values = [
        new BigNumber(supply)
          .times(depositedSupplyPercent)
          .div(100)
          .toFixed(decimals, BigNumber.ROUND_DOWN),
        "0",
      ] as [string, string];

      let _createPoolResult = createPoolResult;
      if (_createPoolResult === undefined) {
        _createPoolResult = await createPoolAndDepositInitialLiquidity(
          tokens,
          values,
          QUOTER_ID,
          offset,
          undefined,
          FEE_TIER_PERCENT,
          bTokens,
          bankIds,
          _createLpTokenResult,
          burnLpTokens,
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
      showSuccessTxnToast(`Launched ${symbol}`, txUrl, {
        description: `Created ${formatPair(tokens.map((token) => token.symbol))} pool and deposited initial liquidity`,
      });
    } catch (err) {
      showErrorToast("Failed to launch token", err as Error, undefined, true);
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
      <LaunchTokenStepsDialog
        isOpen={isStepsDialogOpen}
        createTokenResult={createTokenResult}
        mintTokenResult={mintTokenResult}
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
          <div className="flex w-full flex-row gap-4">
            {/* Name */}
            <div className="flex flex-[2] flex-col gap-2">
              <p className="text-p2 text-secondary-foreground">Name</p>
              <TextInput
                ref={nameInputRef}
                autoFocus
                value={name}
                onChange={setName}
              />
            </div>

            {/* Symbol */}
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-p2 text-secondary-foreground">Symbol</p>
              <TextInput
                value={symbol}
                onChange={(value) => setSymbol(value.toUpperCase())}
              />
            </div>
          </div>

          {/* Icon */}
          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full flex-col gap-1">
              <p className="text-p2 text-secondary-foreground">Icon</p>
              <p className="text-p3 text-tertiary-foreground">
                {[
                  "PNG, JPEG, WebP, or SVG.",
                  `Max ${formatNumber(
                    new BigNumber(BROWSE_MAX_FILE_SIZE_BYTES / 1024 / 1024),
                    { dp: 0 },
                  )} MB.`,
                  `128x128 or larger recommended`,
                ].join(" ")}
              </p>
            </div>
            <IconUpload
              isDragAndDropDisabled={hasFailed || isStepsDialogOpen}
              iconUrl={iconUrl}
              setIconUrl={setIconUrl}
              iconFilename={iconFilename}
              setIconFilename={setIconFilename}
              iconFileSize={iconFileSize}
              setIconFileSize={setIconFileSize}
            />
          </div>

          {/* Quote asset */}
          <div className="flex flex-row justify-between">
            <p className="text-p2 text-secondary-foreground">Quote asset</p>

            <TokenSelectionDialog
              triggerClassName="h-6"
              triggerIconSize={16}
              triggerLabelSelectedClassName="!text-p2"
              triggerLabelUnselectedClassName="!text-p2"
              triggerChevronClassName="!h-4 !w-4 !ml-0 !mr-0"
              token={quoteToken}
              tokens={quoteTokens}
              onSelectToken={(token) => setQuoteAssetCoinType(token.coinType)}
            />
          </div>

          {/* Optional */}
          <button
            className="group flex w-max flex-row items-center gap-2"
            onClick={() => setShowOptional(!showOptional)}
          >
            <p
              className={cn(
                "!text-p2 transition-colors",
                showOptional
                  ? "text-foreground"
                  : "text-secondary-foreground group-hover:text-foreground",
              )}
            >
              Optional
            </p>
            {showOptional ? (
              <ChevronUp className="h-4 w-4 text-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-secondary-foreground group-hover:text-foreground" />
            )}
          </button>

          {showOptional && (
            <>
              {/* Optional - Description */}
              <div className="flex w-full flex-col gap-2">
                <p className="text-p2 text-secondary-foreground">Description</p>
                <TextInput
                  value={description}
                  onChange={setDescription}
                  isTextarea
                  minRows={1}
                />
              </div>

              {/* Optional - Decimals */}
              <div className="flex w-full flex-col gap-2">
                <p className="text-p2 text-secondary-foreground">Decimals</p>
                <TextInput
                  placeholder={decimals.toString()}
                  value={decimalsRaw}
                  onChange={onDecimalsChange}
                />
              </div>

              {/* Optional - Supply */}
              <div className="flex w-full flex-col gap-2">
                <p className="text-p2 text-secondary-foreground">Supply</p>
                <TextInput
                  placeholder={supply.toString()}
                  value={supplyRaw}
                  onChange={onSupplyChange}
                />
              </div>

              {isWhitelisted && (
                <>
                  {/* Optional - Deposited supply % */}
                  <div className="flex w-full flex-col gap-2">
                    <p className="text-p2 text-secondary-foreground">
                      Deposited supply (%)
                    </p>
                    <PercentInput
                      placeholder={depositedSupplyPercent.toString()}
                      value={depositedSupplyPercentRaw}
                      onChange={onDepositedSupplyPercentChange}
                    />
                  </div>

                  {/* Optional - Initial market cap */}
                  <div className="flex w-full flex-col gap-2">
                    <p className="text-p2 text-secondary-foreground">
                      Initial market cap ($)
                    </p>
                    <TextInput
                      placeholder={initialMarketCap.toString()}
                      value={initialMarketCapRaw}
                      onChange={onInitialMarketCapChange}
                    />
                  </div>

                  {/* Optional - Non-mintable */}
                  <Parameter
                    label="Non-mintable"
                    labelTooltip="Make the token non-mintable after minting the initial supply."
                    isHorizontal
                  >
                    <button
                      className={cn(
                        "group flex h-5 w-5 flex-row items-center justify-center rounded-sm border transition-colors",
                        nonMintable
                          ? "border-button-1 bg-button-1/25"
                          : "hover:bg-border/50",
                      )}
                      onClick={() => setNonMintable(!nonMintable)}
                    >
                      {nonMintable && (
                        <Check className="h-4 w-4 text-foreground" />
                      )}
                    </button>
                  </Parameter>
                </>
              )}

              {/* Optional - Burn LP tokens */}
              <Parameter
                label="Burn LP tokens"
                labelTooltip="Burning your LP tokens prevents you from withdrawing the pool's initial liquidity. You also won't receive any LP fees from depositing the pool's initial liquidity."
                isHorizontal
              >
                <button
                  className={cn(
                    "group flex h-5 w-5 flex-row items-center justify-center rounded-sm border transition-colors",
                    burnLpTokens
                      ? "border-button-1 bg-button-1/25"
                      : "hover:bg-border/50",
                  )}
                  onClick={() => setBurnLpTokens(!burnLpTokens)}
                >
                  {burnLpTokens && (
                    <Check className="h-4 w-4 text-foreground" />
                  )}
                </button>
              </Parameter>
            </>
          )}

          <Divider />

          <div className="flex w-full flex-col gap-2">
            {/* Deposited */}
            <Parameter label="Initial liquidity" isHorizontal>
              {symbol === "" ? (
                <p className="text-p2 text-foreground">--</p>
              ) : (
                <div className="flex flex-row items-center gap-2">
                  <p className="text-p2 text-foreground">
                    {formatToken(
                      new BigNumber(supply)
                        .times(depositedSupplyPercent)
                        .div(100),
                      { dp: decimals, trimTrailingZeros: true },
                    )}{" "}
                    {symbol}
                  </p>

                  <p className="text-p2 text-secondary-foreground">
                    {formatPercent(new BigNumber(depositedSupplyPercent), {
                      dp: 0,
                    })}{" "}
                    of supply
                  </p>
                </div>
              )}
            </Parameter>

            {/* Initial MC */}
            <Parameter label="Initial market cap (MC)" isHorizontal>
              <p className="text-p2 text-foreground">
                {formatUsd(new BigNumber(initialMarketCap))}
              </p>
            </Parameter>
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
