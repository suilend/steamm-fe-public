import { useCallback, useMemo, useRef, useState } from "react";

import BigNumber from "bignumber.js";
import { Check, ChevronDown, ChevronUp, Plus } from "lucide-react";

import {
  NORMALIZED_SUI_COINTYPE,
  SUI_GAS_MIN,
  Token,
  formatNumber,
  formatPercent,
  formatToken,
  getToken,
  isSend,
  isStablecoin,
  isSui,
} from "@suilend/frontend-sui";
import {
  API_URL,
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import { ADMIN_ADDRESS } from "@suilend/steamm-sdk";

import Divider from "@/components/Divider";
import IconUpload from "@/components/launch/IconUpload";
import LaunchTokenStepsDialog from "@/components/launch/LaunchTokenStepsDialog";
import Parameter from "@/components/Parameter";
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
import { formatPair, formatTextInputValue } from "@/lib/format";
import {
  BLACKLISTED_WORDS,
  DEFAULT_TOKEN_DECIMALS,
  DEFAULT_TOKEN_SUPPLY,
  DEPOSITED_QUOTE_ASSET,
  DEPOSITED_TOKEN_PERCENT,
  FEE_TIER_PERCENT,
  MAX_FILE_SIZE_BYTES,
  MintTokenResult,
  QUOTER_ID,
  createToken,
  mintToken,
} from "@/lib/launchToken";
import { showSuccessTxnToast } from "@/lib/toasts";
import { cn } from "@/lib/utils";

export default function LaunchTokenCard() {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { balancesCoinMetadataMap, getBalance, refresh } = useUserContext();

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
  const [hasClearedCache, setHasClearedCache] = useState<boolean>(
    process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true" ? true : false,
  );

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
        if (+formattedValue < 10 ** 3)
          throw new Error("Supply must be at least 1,000");

        setSupply(+formattedValue);
      } catch (err) {
        console.error(err);
        showErrorToast("Invalid supply", err as Error);
      }
    },
    [decimals],
  );

  // State - pool - quote asset
  const quoteTokens = useMemo(
    () =>
      Object.entries(balancesCoinMetadataMap ?? {})
        .filter(
          ([coinType]) =>
            isSend(coinType) ||
            isSui(coinType) ||
            isStablecoin(coinType) ||
            Object.keys(appData.lstAprPercentMap).includes(coinType),
        )
        .filter(([coinType]) => getBalance(coinType).gt(0))
        .map(([coinType, coinMetadata]) => getToken(coinType, coinMetadata))
        .sort(
          (a, b) => (a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1), // Sort by symbol (ascending)
        ),
    [balancesCoinMetadataMap, getBalance, appData.lstAprPercentMap],
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

  // Submit
  const reset = () => {
    // Progress
    setHasFailed(false);

    setCreateTokenResult(undefined);
    setMintTokenResult(undefined);
    setBTokensAndBankIds([undefined, undefined]);
    setCreateLpTokenResult(undefined);
    setCreatePoolResult(undefined);
    setHasClearedCache(
      process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true" ? true : false,
    );

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

    // Pool
    setQuoteAssetCoinType(undefined);
    setBurnLpTokens(false);
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) return { isDisabled: true, isLoading: true };
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

    //

    if (getBalance(NORMALIZED_SUI_COINTYPE).lt(SUI_GAS_MIN))
      return {
        isDisabled: true,
        title: `${SUI_GAS_MIN} SUI should be saved for gas`,
      };

    if (quoteAssetCoinType === undefined)
      return { isDisabled: true, title: "Select a quote asset" };
    if (
      isSui(quoteAssetCoinType) &&
      new BigNumber(getBalance(NORMALIZED_SUI_COINTYPE).minus(SUI_GAS_MIN)).lt(
        DEPOSITED_QUOTE_ASSET,
      )
    )
      return {
        isDisabled: true,
        title: `${SUI_GAS_MIN} SUI should be saved for gas`,
      };
    if (getBalance(quoteAssetCoinType).lt(DEPOSITED_QUOTE_ASSET))
      return { isDisabled: true, title: `Insufficient ${quoteToken!.symbol}` };

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
          .times(DEPOSITED_TOKEN_PERCENT)
          .div(100)
          .toFixed(decimals, BigNumber.ROUND_DOWN),
        DEPOSITED_QUOTE_ASSET.toString(),
      ] as [string, string];

      let _createPoolResult = createPoolResult;
      if (_createPoolResult === undefined) {
        _createPoolResult = await createPoolAndDepositInitialLiquidity(
          tokens,
          values,
          QUOTER_ID,
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

  return (
    <>
      <LaunchTokenStepsDialog
        isOpen={isSubmitting || hasClearedCache}
        createTokenResult={createTokenResult}
        mintTokenResult={mintTokenResult}
        bTokensAndBankIds={bTokensAndBankIds}
        createdLpToken={createLpTokenResult}
        createPoolResult={createPoolResult}
        hasClearedCache={hasClearedCache}
        reset={reset}
      />

      <div className="flex w-full flex-col gap-4">
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
                    new BigNumber(MAX_FILE_SIZE_BYTES / 1024),
                    { dp: 0 },
                  )} KB.`,
                  `256x256 or larger recommended`,
                ].join(" ")}
              </p>
            </div>
            <IconUpload
              iconUrl={iconUrl}
              setIconUrl={setIconUrl}
              iconFilename={iconFilename}
              setIconFilename={setIconFilename}
              iconFileSize={iconFileSize}
              setIconFileSize={setIconFileSize}
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

              {/* Optional - Burn LP tokens */}
              <Parameter
                label="Burn LP tokens"
                labelTooltip="Burning your LP tokens prevents you from withdrawing the pool's initial liquidity. You also won't receive any LP fees from depositing the pool's initial liquidity."
                isHorizontal
              >
                <button
                  className={cn(
                    "group flex h-6 w-6 flex-row items-center justify-center rounded-sm border transition-colors",
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

          <div className="flex w-full flex-col gap-2">
            {/* Deposited */}
            <Parameter label="Initial liquidity" isHorizontal>
              {quoteToken ? (
                <div className="flex flex-row flex-wrap items-center justify-end gap-x-2 gap-y-1">
                  <p className="text-p2 text-foreground">
                    {formatToken(
                      new BigNumber(supply)
                        .times(DEPOSITED_TOKEN_PERCENT)
                        .div(100),
                      { dp: decimals, trimTrailingZeros: true },
                    )}{" "}
                    {symbol || "tokens"} (
                    {formatPercent(new BigNumber(DEPOSITED_TOKEN_PERCENT), {
                      dp: 0,
                    })}
                    )
                  </p>
                  <Plus className="h-4 w-4 text-tertiary-foreground" />
                  <p className="text-p2 text-foreground">
                    {formatToken(new BigNumber(DEPOSITED_QUOTE_ASSET), {
                      dp: quoteToken.decimals,
                      trimTrailingZeros: true,
                    })}{" "}
                    {quoteToken!.symbol}
                  </p>
                </div>
              ) : (
                <p className="text-p2 text-foreground">--</p>
              )}
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
