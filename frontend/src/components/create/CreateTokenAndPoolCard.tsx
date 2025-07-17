import { useCallback, useMemo, useRef, useState } from "react";

import { useSignPersonalMessage } from "@mysten/dapp-kit";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import BigNumber from "bignumber.js";
import { useFlags } from "launchdarkly-react-client-sdk";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { ADMIN_ADDRESS, computeOptimalOffset } from "@suilend/steamm-sdk";
import {
  BLACKLISTED_WORDS,
  FundKeypairResult,
  NORMALIZED_SUI_COINTYPE,
  ReturnAllOwnedObjectsAndSuiToUserResult,
  Token,
  checkIfKeypairCanBeUsed,
  createKeypair,
  formatInteger,
  formatNumber,
  formatPercent,
  formatPrice,
  formatToken,
  formatUsd,
  fundKeypair,
  getToken,
  returnAllOwnedObjectsAndSuiToUser,
} from "@suilend/sui-fe";
import {
  showErrorToast,
  showSuccessToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";
import useIsTouchscreen from "@suilend/sui-fe-next/hooks/useIsTouchscreen";

import CreateTokenAndPoolStepsDialog from "@/components/create/CreateTokenAndPoolStepsDialog";
import IconUpload from "@/components/create/IconUpload";
import Divider from "@/components/Divider";
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
  BROWSE_MAX_FILE_SIZE_BYTES,
  DEFAULT_TOKEN_DECIMALS,
  DEFAULT_TOKEN_SUPPLY,
  DEPOSITED_TOKEN_PERCENT,
  FEE_TIER_PERCENT,
  INITIAL_TOKEN_FDV_USD,
  MintTokenResult,
  QUOTER_ID,
  createToken,
  mintToken,
} from "@/lib/createToken";
import {
  formatPair,
  formatPercentInputValue,
  formatTextInputValue,
} from "@/lib/format";
import { getAvgPoolPrice } from "@/lib/pools";
import { cn } from "@/lib/utils";

const REQUIRED_SUI_AMOUNT = new BigNumber(0.2);

interface CreateTokenAndPoolCardProps {
  isTokenOnly: boolean;
}

export default function CreateTokenAndPoolCard({
  isTokenOnly,
}: CreateTokenAndPoolCardProps) {
  const { suiClient } = useSettingsContext();
  const { account, address, signExecuteAndWaitForTransaction } =
    useWalletContext();
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

  const isTouchscreen = useIsTouchscreen();

  // Progress
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  const [keypair, setKeypair] = useState<Ed25519Keypair | undefined>(undefined);
  const [fundKeypairResult, setFundKeypairResult] = useState<
    FundKeypairResult | undefined
  >(undefined);
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
  const [
    returnAllOwnedObjectsAndSuiToUserResult,
    setReturnAllOwnedObjectsAndSuiToUserResult,
  ] = useState<ReturnAllOwnedObjectsAndSuiToUserResult | undefined>(undefined);

  const currentFlowDigests = useMemo(
    () =>
      [
        fundKeypairResult?.res.digest,
        createTokenResult?.res.digest,
        mintTokenResult?.res.digest,
        ...(bTokensAndBankIds ?? [])
          .filter((x) => !!x && "createBankRes" in x)
          .flatMap((x) => [
            x.createBTokenResult.res.digest,
            x.createBankRes.digest,
          ]),
        createLpTokenResult?.res.digest,
        createPoolResult?.res.digest,
      ].filter(Boolean) as string[],
    [
      fundKeypairResult,
      createTokenResult,
      mintTokenResult,
      bTokensAndBankIds,
      createLpTokenResult,
      createPoolResult,
    ],
  );

  // State
  const [name, setName] = useState<string>("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [symbol, setSymbol] = useState<string>("");

  const [iconUrl, setIconUrl] = useState<string>("");
  const [iconFilename, setIconFilename] = useState<string>("");
  const [iconFileSize, setIconFileSize] = useState<string>("");

  // State - quote asset
  const quoteTokens = useMemo(
    () =>
      Object.entries(balancesCoinMetadataMap ?? {})
        .filter(([coinType]) => getBalance(coinType).gt(0))
        .filter(
          ([coinType]) =>
            getAvgPoolPrice(appData.pools, coinType) !== undefined,
        )
        .map(([coinType, coinMetadata]) => getToken(coinType, coinMetadata))
        .sort(
          (a, b) => (a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1), // Sort by symbol (ascending)
        ),
    [balancesCoinMetadataMap, getBalance, appData.pools],
  );

  const [quoteAssetCoinType, setQuoteAssetCoinType] = useState<
    string | undefined
  >(undefined);
  const onSelectQuoteToken = (token: Token) => {
    setQuoteAssetCoinType(token.coinType);

    if (token.decimals < decimals) {
      setDecimalsRaw(token.decimals.toString());
      setDecimals(token.decimals);
    }
  };

  const quoteToken =
    quoteAssetCoinType !== undefined
      ? getToken(
          quoteAssetCoinType,
          balancesCoinMetadataMap![quoteAssetCoinType],
        )
      : undefined;

  // State - optional
  const [showOptional, setShowOptional] = useState<boolean>(false);

  // State - optional - description
  const [description, setDescription] = useState<string>("");

  // State - optional - decimals
  const [decimalsRaw, setDecimalsRaw] = useState<string>(
    DEFAULT_TOKEN_DECIMALS.toString(),
  );
  const [decimals, setDecimals] = useState<number>(DEFAULT_TOKEN_DECIMALS);

  const onDecimalsChange = useCallback(
    (value: string) => {
      const formattedValue = formatTextInputValue(value, 0);
      setDecimalsRaw(formattedValue);

      try {
        if (formattedValue === "") return;
        if (isNaN(+formattedValue))
          throw new Error("Decimals must be a number");
        if (+formattedValue < 0 || +formattedValue > 9)
          throw new Error("Decimals must be between 0 and 9");
        if (quoteToken && +formattedValue > quoteToken.decimals)
          throw new Error(
            quoteToken.decimals === 0
              ? `Decimals must be ${quoteToken.decimals}`
              : `Decimals must be ${quoteToken.decimals} or less`,
          );

        setDecimals(+formattedValue);
      } catch (err) {
        console.error(err);
        showErrorToast("Invalid decimals", err as Error);
      }
    },
    [quoteToken],
  );

  // State - optional - supply
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

  // State - optional - deposited supply %
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

  // State - optional - initial FDV
  const [initialFdvUsdRaw, setInitialFdvUsdRaw] = useState<string>(
    INITIAL_TOKEN_FDV_USD.toString(),
  );
  const [initialFdvUsd, setInitialFdvUsd] = useState<number>(
    INITIAL_TOKEN_FDV_USD,
  );

  const onInitialFdvUsdChange = useCallback((value: string) => {
    const formattedValue = formatTextInputValue(value, 2);
    setInitialFdvUsdRaw(formattedValue);

    try {
      if (formattedValue === "") return;
      if (isNaN(+formattedValue))
        throw new Error("Initial FDV must be a number");
      if (new BigNumber(formattedValue).lt(1000))
        throw new Error(
          `Initial FDV must be at least ${formatUsd(new BigNumber(10 ** 3), {
            dp: 0,
          })}`,
        );
      if (new BigNumber(formattedValue).gt(10 ** 9))
        throw new Error(
          `Initial FDV must be at most ${formatUsd(new BigNumber(10 ** 9), {
            dp: 0,
          })}`,
        );

      setInitialFdvUsd(+formattedValue);
    } catch (err) {
      console.error(err);
      showErrorToast("Invalid initial FDV", err as Error);
    }
  }, []);

  const depositedSupply = useMemo(
    () => new BigNumber(supply).times(depositedSupplyPercent / 100),
    [supply, depositedSupplyPercent],
  );
  const initialPoolTvlUsd = useMemo(
    () => new BigNumber(initialFdvUsd).times(depositedSupplyPercent / 100),
    [initialFdvUsd, depositedSupplyPercent],
  );

  const tokenInitialPriceUsd = useMemo(
    () => initialPoolTvlUsd.div(depositedSupply),
    [initialPoolTvlUsd, depositedSupply],
  );

  // State - optional - mintable
  const [isMintable, setIsMintable] = useState<boolean>(false);

  // State - optional - burn LP tokens
  const [burnLpTokens, setBurnLpTokens] = useState<boolean>(false);

  // CPMM offset
  const cpmmOffset: bigint | undefined = useMemo(() => {
    if (quoteToken === undefined) return undefined;

    const quotePrice = getAvgPoolPrice(appData.pools, quoteToken.coinType)!;
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
    appData.pools,
    tokenInitialPriceUsd,
    depositedSupply,
    decimals,
  ]);

  // Submit
  const reset = () => {
    // Progress
    setHasFailed(false);

    setKeypair(undefined);
    setFundKeypairResult(undefined);
    setCreateTokenResult(undefined);
    setMintTokenResult(undefined);
    setBTokensAndBankIds([undefined, undefined]);
    setCreateLpTokenResult(undefined);
    setCreatePoolResult(undefined);
    setReturnAllOwnedObjectsAndSuiToUserResult(undefined);

    // State
    setName("");
    setTimeout(() => nameInputRef.current?.focus(), 100); // After dialog is closed

    setSymbol("");

    setIconUrl("");
    setIconFilename("");
    setIconFileSize("");
    const iconUploadInput = document.getElementById(
      "icon-upload",
    ) as HTMLInputElement;
    if (iconUploadInput) iconUploadInput.value = "";

    setQuoteAssetCoinType(undefined);

    // State - optional
    setShowOptional(false);

    setDescription("");

    setDecimalsRaw(DEFAULT_TOKEN_DECIMALS.toString());
    setDecimals(DEFAULT_TOKEN_DECIMALS);

    setSupplyRaw(DEFAULT_TOKEN_SUPPLY.toString());
    setSupply(DEFAULT_TOKEN_SUPPLY);

    setDepositedSupplyPercentRaw(DEPOSITED_TOKEN_PERCENT.toString());
    setDepositedSupplyPercent(DEPOSITED_TOKEN_PERCENT);

    setInitialFdvUsdRaw(INITIAL_TOKEN_FDV_USD.toString());
    setInitialFdvUsd(INITIAL_TOKEN_FDV_USD);

    setIsMintable(false);

    setBurnLpTokens(false);
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) return { isLoading: true, isDisabled: true };

    if (hasFailed && !returnAllOwnedObjectsAndSuiToUserResult)
      return { isDisabled: false, title: "Retry" };
    if (!!returnAllOwnedObjectsAndSuiToUserResult)
      return { isSuccess: true, isDisabled: true };

    // Name
    if (name === "") return { isDisabled: true, title: "Enter a name" };
    if (name.length < 1 || name.length > 32)
      return {
        isDisabled: true,
        title: "Name must be between 1 and 32 characters",
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

    // Icon
    if (iconUrl === "") return { isDisabled: true, title: "Upload an icon" };

    // Quote asset
    if (!isTokenOnly && quoteAssetCoinType === undefined)
      return { isDisabled: true, title: "Select a quote asset" };

    // Description
    if (description.length > 256)
      return {
        isDisabled: true,
        title: "Description must be 256 characters or less",
      };

    // Decimals
    if (decimalsRaw === "")
      return { isDisabled: true, title: "Enter number of decimals" };

    // Supply
    if (supplyRaw === "") return { isDisabled: true, title: "Enter a supply" };

    // Deposited supply %
    if (!isTokenOnly && depositedSupplyPercentRaw === "")
      return { isDisabled: true, title: "Enter deposited supply %" };

    // Initial FDV
    if (!isTokenOnly && initialFdvUsdRaw === "")
      return { isDisabled: true, title: "Enter initial FDV" };

    //

    if (getBalance(NORMALIZED_SUI_COINTYPE).lt(REQUIRED_SUI_AMOUNT))
      return {
        isDisabled: true,
        title: `${formatToken(REQUIRED_SUI_AMOUNT, {
          dp: appData.coinMetadataMap[NORMALIZED_SUI_COINTYPE].decimals,
          trimTrailingZeros: true,
        })} SUI should be saved for gas`,
      };

    return {
      isDisabled: false,
      title: !isTokenOnly ? "Create token & pool" : "Create token",
    };
  })();

  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const onSubmitClick = async () => {
    if (submitButtonState.isDisabled) return;
    if (!isTokenOnly && !quoteToken) return; // Should not happen

    try {
      if (!account?.publicKey || !address)
        throw new Error("Wallet not connected");

      setIsSubmitting(true);

      // 0) Prepare
      if (!isTokenOnly && !quoteToken!.id)
        throw new Error("Token coinMetadata id not found");

      await initializeCoinCreation();

      // 1) Create, check, and fund keypair
      // 1.1) Create
      let _keypair = keypair;
      if (_keypair === undefined) {
        _keypair = (await createKeypair(account, signPersonalMessage)).keypair;
        setKeypair(_keypair);
      }

      // 1.2) Check
      await checkIfKeypairCanBeUsed(
        undefined,
        currentFlowDigests,
        _keypair,
        suiClient,
      );

      // 1.3) Fund
      let _fundKeypairResult = fundKeypairResult;
      if (_fundKeypairResult === undefined) {
        _fundKeypairResult = await fundKeypair(
          [
            {
              ...getToken(
                NORMALIZED_SUI_COINTYPE,
                appData.coinMetadataMap[NORMALIZED_SUI_COINTYPE],
              ),
              amount: REQUIRED_SUI_AMOUNT,
            },
          ],
          address,
          _keypair,
          suiClient,
          signExecuteAndWaitForTransaction,
        );
        setFundKeypairResult(_fundKeypairResult);
      }

      // 2) Create and send keypair transactions
      // 2.1) Create token
      let _createTokenResult = createTokenResult;
      if (_createTokenResult === undefined) {
        _createTokenResult = await createToken(
          name,
          symbol,
          description,
          iconUrl,
          decimals,
          _keypair,
          suiClient,
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

      // 2.2) Mint token
      let _mintTokenResult = mintTokenResult;
      if (_mintTokenResult === undefined) {
        _mintTokenResult = await mintToken(
          _createTokenResult,
          supply,
          decimals,
          !isMintable,
          _keypair,
          suiClient,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setMintTokenResult(_mintTokenResult);
      }

      if (!isTokenOnly) {
        // 2.3) Get/create bTokens and banks (2 transactions for each missing bToken+bank pair = 0, 2, or 4 transactions in total)
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
                      _keypair,
                      suiClient,
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

        // 2.4) Create LP token (1 transaction)
        let _createLpTokenResult = createLpTokenResult;
        if (_createLpTokenResult === undefined) {
          _createLpTokenResult = await createLpToken(
            bTokens,
            _keypair,
            suiClient,
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          setCreateLpTokenResult(_createLpTokenResult);
        }

        // 2.5) Create pool and deposit initial liquidity (1 transaction)
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
            cpmmOffset,
            undefined,
            FEE_TIER_PERCENT,
            bTokens,
            bankIds,
            _createLpTokenResult,
            burnLpTokens,
            steammClient,
            appData,
            _keypair,
            suiClient,
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          setCreatePoolResult(_createPoolResult);
        }
      }

      // 2.6) Return objects and unused SUI to user
      let _returnAllOwnedObjectsAndSuiToUserResult =
        returnAllOwnedObjectsAndSuiToUserResult;
      if (_returnAllOwnedObjectsAndSuiToUserResult === undefined) {
        _returnAllOwnedObjectsAndSuiToUserResult =
          await returnAllOwnedObjectsAndSuiToUser(address, _keypair, suiClient);
        setReturnAllOwnedObjectsAndSuiToUserResult(
          _returnAllOwnedObjectsAndSuiToUserResult,
        );
      }

      showSuccessToast(
        !isTokenOnly
          ? `Created ${symbol} and ${formatPair(tokens.map((token) => token.symbol))} pool`
          : `Created ${symbol}`,
        {
          description: !isTokenOnly ? "Deposited initial liquidity" : undefined,
        },
      );
    } catch (err) {
      showErrorToast(
        !isTokenOnly
          ? "Failed to create token & pool"
          : "Failed to create token",
        err as Error,
        undefined,
        true,
      );
      console.error(err);

      setHasFailed(true);
    } finally {
      setIsSubmitting(false);
      refresh();
    }
  };

  // Steps dialog
  const isStepsDialogOpen =
    isSubmitting || !!returnAllOwnedObjectsAndSuiToUserResult;

  return (
    <>
      <CreateTokenAndPoolStepsDialog
        isOpen={isStepsDialogOpen}
        isTokenOnly={isTokenOnly}
        symbol={symbol}
        quoteToken={quoteToken}
        fundKeypairResult={fundKeypairResult}
        createTokenResult={createTokenResult}
        mintTokenResult={mintTokenResult}
        bTokensAndBankIds={bTokensAndBankIds}
        createdLpToken={createLpTokenResult}
        createPoolResult={createPoolResult}
        returnAllOwnedObjectsAndSuiToUserResult={
          returnAllOwnedObjectsAndSuiToUserResult
        }
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
                autoFocus={!isTouchscreen}
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
          {!isTokenOnly && (
            <div className="flex w-full flex-col gap-3">
              <div className="flex w-full flex-col gap-1">
                <p className="text-p2 text-secondary-foreground">Quote asset</p>
                <p className="text-p3 text-tertiary-foreground">
                  SUI or stablecoins (e.g. USDC, USDT) are usually used as the
                  quote asset.
                </p>
              </div>

              <TokenSelectionDialog
                triggerClassName="w-max px-3 border rounded-md"
                triggerIconSize={16}
                triggerLabelSelectedClassName="!text-p2"
                triggerLabelUnselectedClassName="!text-p2"
                triggerChevronClassName="!h-4 !w-4 !ml-0 !mr-0"
                token={quoteToken}
                tokens={quoteTokens}
                onSelectToken={(token) => onSelectQuoteToken(token)}
              />
            </div>
          )}

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
              More options
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
                  {!isTokenOnly && (
                    <>
                      {/* Optional - Deposited supply */}
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

                      {/* Optional - Initial FDV */}
                      <div className="flex w-full flex-col gap-2">
                        <p className="text-p2 text-secondary-foreground">
                          Initial FDV ($)
                        </p>
                        <TextInput
                          placeholder={initialFdvUsd.toString()}
                          value={initialFdvUsdRaw}
                          onChange={onInitialFdvUsdChange}
                        />
                      </div>
                    </>
                  )}

                  {/* Optional - Mintable */}
                  <Parameter
                    label="Mintable"
                    labelTooltip="Whether the token is mintable after minting the initial supply."
                    isHorizontal
                  >
                    <button
                      className={cn(
                        "group flex h-5 w-5 flex-row items-center justify-center rounded-sm border transition-colors",
                        isMintable
                          ? "border-button-1 bg-button-1/25"
                          : "hover:bg-border/50",
                      )}
                      onClick={() => setIsMintable(!isMintable)}
                    >
                      {isMintable && (
                        <Check className="h-4 w-4 text-foreground" />
                      )}
                    </button>
                  </Parameter>
                </>
              )}

              {/* Optional - Burn LP tokens */}
              {!isTokenOnly && (
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
              )}
            </>
          )}

          <Divider />

          <div className="flex w-full flex-col gap-2">
            {!isTokenOnly ? (
              <>
                {/* Deposited */}
                <Parameter label="Initial liquidity" isHorizontal>
                  {symbol !== "" ? (
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
                  ) : (
                    <p className="text-p2 text-foreground">--</p>
                  )}
                </Parameter>

                {/* Initial price */}
                <Parameter label="Initial price" isHorizontal>
                  {symbol !== "" &&
                  tokenInitialPriceUsd !== undefined &&
                  quoteToken !== undefined ? (
                    <div className="flex flex-row items-center gap-2">
                      <p className="text-p2 text-foreground">
                        1 {symbol}
                        {" = "}
                        {formatToken(
                          tokenInitialPriceUsd.div(
                            getAvgPoolPrice(
                              appData.pools,
                              quoteToken.coinType,
                            )!,
                          ),
                          {
                            dp: balancesCoinMetadataMap![quoteToken.coinType]
                              .decimals,
                          },
                        )}{" "}
                        {balancesCoinMetadataMap![quoteToken.coinType].symbol}
                      </p>
                      <p className="text-p2 text-secondary-foreground">
                        {formatPrice(tokenInitialPriceUsd)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-p2 text-foreground">--</p>
                  )}
                </Parameter>

                {/* Initial FDV */}
                <Parameter label="Initial FDV" isHorizontal>
                  <p className="text-p2 text-foreground">
                    {formatUsd(new BigNumber(initialFdvUsd))}
                  </p>
                </Parameter>
              </>
            ) : (
              <>
                {/* Supply */}
                <Parameter label="Supply" isHorizontal>
                  {symbol !== "" ? (
                    <p className="text-p2 text-foreground">
                      {formatToken(new BigNumber(supply), {
                        dp: decimals,
                        trimTrailingZeros: true,
                      })}{" "}
                      {symbol}
                    </p>
                  ) : (
                    <p className="text-p2 text-foreground">--</p>
                  )}
                </Parameter>
              </>
            )}

            {/* Mintable */}
            <Parameter label="Mintable" isHorizontal>
              <p className="text-p2 text-foreground">
                {isMintable ? "Yes" : "No"}
              </p>
            </Parameter>

            {/* Burn LP tokens */}
            {!isTokenOnly && (
              <Parameter label="Burn LP tokens" isHorizontal>
                <p className="text-p2 text-foreground">
                  {burnLpTokens ? "Yes" : "No"}
                </p>
              </Parameter>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-1">
          <SubmitButton
            submitButtonState={submitButtonState}
            onClick={onSubmitClick}
          />

          {hasFailed && !returnAllOwnedObjectsAndSuiToUserResult && (
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
