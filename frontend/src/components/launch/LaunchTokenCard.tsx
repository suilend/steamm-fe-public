import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import BigNumber from "bignumber.js";
import { Check, ChevronDown, ChevronUp, Plus } from "lucide-react";

import {
  NORMALIZED_SUI_COINTYPE,
  SUI_GAS_MIN,
  formatNumber,
  formatToken,
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

import Divider from "@/components/Divider";
import IconUpload from "@/components/launch/IconUpload";
import Parameter from "@/components/Parameter";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import TokenSelectionDialog from "@/components/swap/TokenSelectionDialog";
import TextInput from "@/components/TextInput";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { initializeCoinCreation } from "@/lib/createCoin";
import { formatTextInputValue } from "@/lib/format";
import {
  DEFAULT_TOKEN_DECIMALS,
  DEFAULT_TOKEN_SUPPLY,
  DEPOSITED_QUOTE_ASSET,
  DEPOSITED_TOKEN_PERCENT,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/launchToken";
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export default function LaunchTokenCard() {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { balancesCoinMetadataMap, getBalance, refresh } = useUserContext();

  // State - token
  const [name, setName] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [iconUrl, setIconUrl] = useState<string>("");
  const [iconFilename, setIconFilename] = useState<string>("");
  const [iconFileSize, setIconFileSize] = useState<string>("");

  const [showOptional, setShowOptional] = useState<boolean>(false);

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

  // State - pool
  const [createdPoolId, setCreatedPoolId] = useState<string | undefined>(
    undefined,
  );

  // State - pool - quote asset
  const quoteTokens = useMemo(
    () =>
      Object.entries(balancesCoinMetadataMap ?? {})
        .sort(
          ([, a], [, b]) =>
            a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1, // Sort by symbol (ascending)
        )
        .filter(([coinType]) => getBalance(coinType).gt(0))
        .map(([coinType, coinMetadata]) => getToken(coinType, coinMetadata))
        .filter(
          (token) =>
            isSend(token.coinType) ||
            isSui(token.coinType) ||
            isStablecoin(token.coinType) ||
            Object.keys(appData.lstAprPercentMap).includes(token.coinType),
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
    // Token
    setName("");
    setSymbol("");
    setDescription("");
    setIconUrl("");
    setIconFilename("");
    setIconFileSize("");
    (document.getElementById("icon-upload") as HTMLInputElement).value = "";

    setShowOptional(false);
    setDecimalsRaw(DEFAULT_TOKEN_DECIMALS.toString());
    setDecimals(DEFAULT_TOKEN_DECIMALS);
    setSupplyRaw(DEFAULT_TOKEN_SUPPLY.toString());
    setSupply(DEFAULT_TOKEN_SUPPLY);

    // Pool
    setCreatedPoolId(undefined);
    setQuoteAssetCoinType(undefined);
    setBurnLpTokens(false);
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) return { isDisabled: true, isLoading: true };

    // Name
    if (name === "") return { isDisabled: true, title: "Enter a name" };
    if (name.length < 3 || name.length > 32)
      return {
        isDisabled: true,
        title: "Name must be between 3 and 32 characters",
      };

    // Symbol
    if (symbol === "") return { isDisabled: true, title: "Enter a symbol" };
    if (symbol.length < 1 || symbol.length > 8)
      return {
        isDisabled: true,
        title: "Symbol must be between 1 and 8 characters",
      };
    if (symbol === name)
      return {
        isDisabled: true,
        title: "Symbol can't be the same as the name",
      };

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
      new BigNumber(
        getBalance(quoteAssetCoinType).minus(
          isSui(quoteAssetCoinType) ? SUI_GAS_MIN : 0,
        ),
      ).lt(DEPOSITED_QUOTE_ASSET)
    )
      return {
        isDisabled: true,
        title: `Insufficient ${quoteToken!.symbol}`,
      };

    return {
      isDisabled: false,
      title: "Launch token",
    };
  })();

  const onSubmitClick = async () => {
    if (submitButtonState.isDisabled) return;

    try {
      if (!address) throw new Error("Wallet not connected");

      setIsSubmitting(true);

      // 0) Prepare
      if (!quoteToken!.id) throw new Error("Token coinMetadata id not found");

      await initializeCoinCreation();

      // 1) Create token

      // 2) Mint token

      // 3) Get/create bTokens and banks (2 transactions for each bToken+bank pair = 0, 2, or 4 transactions in total)

      // 4) Create LP token (1 transaction)

      // 5) Create pool and deposit initial liquidity (1 transaction)
    } catch (err) {
      showErrorToast("Failed to launch token", err as Error, undefined, true);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      refresh();
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div
        className={cn(
          "flex w-full flex-col gap-4",
          createdPoolId && "pointer-events-none",
        )}
      >
        <div className="flex w-full flex-row gap-4">
          {/* Name */}
          <div className="flex flex-[2] flex-col gap-2">
            <p className="text-p2 text-secondary-foreground">Name</p>
            <TextInput value={name} onChange={setName} />
          </div>

          {/* Symbol */}
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-p2 text-secondary-foreground">Symbol</p>
            <TextInput value={symbol} onChange={setSymbol} />
          </div>
        </div>

        {/* Icon */}
        <div className="flex w-full flex-col gap-3">
          <div className="flex w-full flex-col gap-1">
            <p className="text-p2 text-secondary-foreground">Icon</p>
            <p className="text-p3 text-tertiary-foreground">
              {[
                "PNG, JPEG, or SVG.",
                `Max ${formatNumber(new BigNumber(MAX_FILE_SIZE_BYTES / 1024), {
                  dp: 0,
                })} KB.`,
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
                {burnLpTokens && <Check className="h-4 w-4 text-foreground" />}
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
                    { dp: decimals },
                  )}{" "}
                  {symbol || "tokens"}
                </p>
                <Plus className="h-4 w-4 text-tertiary-foreground" />
                <p className="text-p2 text-foreground">
                  {formatToken(new BigNumber(DEPOSITED_QUOTE_ASSET), {
                    dp: quoteToken.decimals,
                  })}{" "}
                  {quoteToken!.symbol}
                </p>
              </div>
            ) : (
              <p className="text-p2 text-tertiary-foreground">N/A</p>
            )}
          </Parameter>
        </div>
      </div>

      {!createdPoolId ? (
        <SubmitButton
          submitButtonState={submitButtonState}
          onClick={onSubmitClick}
        />
      ) : (
        <div className="flex w-full flex-col gap-1">
          <Link
            className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80"
            href={`${POOL_URL_PREFIX}/${createdPoolId}`}
            target="_blank"
          >
            <p className="text-p1 text-button-1-foreground">Go to pool</p>
          </Link>

          <button
            className="group flex h-10 w-full flex-row items-center justify-center rounded-md border px-3 transition-colors hover:bg-border/50"
            onClick={reset}
          >
            <p className="text-p2 text-secondary-foreground transition-colors group-hover:text-foreground">
              Start over
            </p>
          </button>
        </div>
      )}
    </div>
  );
}
