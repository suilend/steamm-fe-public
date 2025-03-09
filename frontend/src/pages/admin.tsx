import Head from "next/head";
import { useMemo, useState } from "react";

import init, {
  update_constants,
  update_identifiers,
} from "@mysten/move-bytecode-template";
import { bcs } from "@mysten/sui/bcs";
import { SuiObjectChange } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";

import {
  NORMALIZED_STABLECOIN_COINTYPES,
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_sSUI_COINTYPE,
  SUI_GAS_MIN,
  Token,
  getCoinMetadataMap,
  getToken,
  isSui,
} from "@suilend/frontend-sui";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";

import Divider from "@/components/Divider";
import Parameter from "@/components/Parameter";
import CoinInput, { getCoinInputId } from "@/components/pool/CoinInput";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedUserContext } from "@/contexts/UserContext";
import useTokenUsdPrices from "@/hooks/useTokenUsdPrices";
import { formatFeeTier, formatPair, formatTextInputValue } from "@/lib/format";
import { getBirdeyeRatio } from "@/lib/swap";
import { showSuccessTxnToast } from "@/lib/toasts";
import { QUOTERS, QuoterId } from "@/lib/types";
import { cn } from "@/lib/utils";

const FEE_TIER_PERCENTS: number[] = [0.3, 1, 2];

const generate_bytecode = (
  module: string,
  type: string,
  name: string,
  symbol: string,
  description: string,
  imageUrl: string,
) => {
  const bytecode = Buffer.from(
    "oRzrCwYAAAAKAQAMAgweAyonBFEIBVlMB6UBywEI8AJgBtADXQqtBAUMsgQoABABCwIGAhECEgITAAICAAEBBwEAAAIADAEAAQIDDAEAAQQEAgAFBQcAAAkAAQABDwUGAQACBwgJAQIDDAUBAQwDDQ0BAQwEDgoLAAUKAwQAAQQCBwQMAwICCAAHCAQAAQsCAQgAAQoCAQgFAQkAAQsBAQkAAQgABwkAAgoCCgIKAgsBAQgFBwgEAgsDAQkACwIBCQABBggEAQUBCwMBCAACCQAFDENvaW5NZXRhZGF0YQZPcHRpb24IVEVNUExBVEULVHJlYXN1cnlDYXAJVHhDb250ZXh0A1VybARjb2luD2NyZWF0ZV9jdXJyZW5jeQtkdW1teV9maWVsZARpbml0FW5ld191bnNhZmVfZnJvbV9ieXRlcwZvcHRpb24TcHVibGljX3NoYXJlX29iamVjdA9wdWJsaWNfdHJhbnNmZXIGc2VuZGVyBHNvbWUIdGVtcGxhdGUIdHJhbnNmZXIKdHhfY29udGV4dAN1cmwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICAQkKAgUEVE1QTAoCDg1UZW1wbGF0ZSBDb2luCgIaGVRlbXBsYXRlIENvaW4gRGVzY3JpcHRpb24KAiEgaHR0cHM6Ly9leGFtcGxlLmNvbS90ZW1wbGF0ZS5wbmcAAgEIAQAAAAACEgsABwAHAQcCBwMHBBEGOAAKATgBDAILAS4RBTgCCwI4AwIA=",
    "base64",
  );

  let updated = update_identifiers(bytecode, {
    TEMPLATE: type,
    template: module,
  });

  updated = update_constants(
    updated,
    bcs.string().serialize(symbol).toBytes(),
    bcs.string().serialize("TMPL").toBytes(),
    "Vector(U8)", // type of the constant
  );

  updated = update_constants(
    updated,
    bcs.string().serialize(name).toBytes(), // new value
    bcs.string().serialize("Template Coin").toBytes(), // current value
    "Vector(U8)", // type of the constant
  );

  updated = update_constants(
    updated,
    bcs.string().serialize(description).toBytes(), // new value
    bcs.string().serialize("Template Coin Description").toBytes(), // current value
    "Vector(U8)", // type of the constant
  );

  updated = update_constants(
    updated,
    bcs.string().serialize(imageUrl).toBytes(), // new value
    bcs.string().serialize("https://example.com/template.png").toBytes(), // current value
    "Vector(U8)", // type of the constant
  );

  return updated;
};

const getBTokenModule = (token: Token) =>
  `steamm_b_${token.coinType.replaceAll("::", "__")}`.toLowerCase(); // E.g. steamm_b_PACKAGE__MODULE__TYPE
const getBTokenType = (token: Token) =>
  `STEAMM_B_${token.coinType.replaceAll("::", "__")}`.toUpperCase(); // E.g. STEAMM_B_PACKAGE__MODULE__TYPE
const getBTokenName = (token: Token) =>
  `STEAMM b${token.symbol}`.replace(/\s+/g, "_"); // E.g. STEAMM bSUI
const getBTokenSymbol = (token: Token) =>
  `STEAMM b${token.symbol}`.replace(/\s+/g, "_"); // E.g. STEAMM bSUI (same as name)
const B_TOKEN_DESCRIPTION = "STEAMM bToken";
const B_TOKEN_IMAGE_URL =
  "https://suilend-assets.s3.us-east-2.amazonaws.com/steamm/STEAMM+bToken.svg";

const getLpTokenModule = (
  bTokenA: Pick<Token, "coinType">,
  bTokenB: Pick<Token, "coinType">,
) =>
  `steamm_lp_${bTokenA.coinType.replaceAll("::", "__")},${bTokenB.coinType.replaceAll("::", "__")}`.toLowerCase(); // E.g. steamm_lp_PACKAGE__MODULE__TYPE,PACKAGE__MODULE__TYPE>
const getLpTokenType = (
  bTokenA: Pick<Token, "coinType">,
  bTokenB: Pick<Token, "coinType">,
) =>
  `STEAMM_LP_${bTokenA.coinType.replaceAll("::", "__")},${bTokenB.coinType.replaceAll("::", "__")}`.toUpperCase(); // E.g. steamm_lp_PACKAGE__MODULE__TYPE,PACKAGE__MODULE__TYPE>
const getLpTokenName = (tokenA: Token, tokenB: Token) =>
  `STEAMM LP b${tokenA.symbol}-b${tokenB.symbol}`.replace(/\s+/g, "_"); // E.g. STEAMM LP bSUI-bUSDC
const getLpTokenSymbol = (tokenA: Token, tokenB: Token) =>
  `STEAMM LP b${tokenA.symbol}-b${tokenB.symbol}`.replace(/\s+/g, "_"); // E.g. STEAMM LP bSUI-bUSDC (same as name)
const LP_TOKEN_DESCRIPTION = "STEAMM LP Token";
const LP_TOKEN_IMAGE_URL =
  "https://suilend-assets.s3.us-east-2.amazonaws.com/steamm/STEAMM+LP+Token.svg";

export default function AdminPage() {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { balancesCoinMetadataMap, getBalance, refresh } =
    useLoadedUserContext();

  // CoinTypes
  const [coinTypes, setCoinTypes] = useState<[string, string]>(["", ""]);

  // Values
  const maxValues = coinTypes.map((coinType) =>
    coinType !== ""
      ? isSui(coinType)
        ? BigNumber.max(0, getBalance(coinType).minus(SUI_GAS_MIN))
        : getBalance(coinType)
      : new BigNumber(0),
  ) as [BigNumber, BigNumber];

  const [values, setValues] = useState<[string, string]>(["", ""]);

  const onValueChange = (_value: string, index: number) => {
    console.log("onValueChange - _value:", _value, "index:", index);

    const formattedValue = formatTextInputValue(
      _value,
      balancesCoinMetadataMap![coinTypes[index]].decimals,
    );

    const newValues: [string, string] = [
      index === 0 ? formattedValue : values[0],
      index === 0 ? values[1] : formattedValue,
    ];
    setValues(newValues);
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

  // USD prices - current
  const { tokenUsdPricesMap, fetchTokenUsdPrice } = useTokenUsdPrices([]);

  const usdPrices = useMemo(
    () => coinTypes.map((coinType) => tokenUsdPricesMap[coinType]),
    [coinTypes, tokenUsdPricesMap],
  );

  const usdValues = useMemo(
    () =>
      coinTypes.map((coinType, index) =>
        coinType !== ""
          ? usdPrices[index] === undefined
            ? undefined
            : new BigNumber(values[index] || 0).times(usdPrices[index])
          : "",
      ),
    [coinTypes, usdPrices, values],
  );

  // Ratios
  const birdeyeRatio = getBirdeyeRatio(usdPrices[0], usdPrices[1]);
  console.log("AdminPage - birdeyeRatio:", birdeyeRatio?.toString());

  // Select
  const basePopoverTokens = useMemo(
    () =>
      Object.entries(balancesCoinMetadataMap ?? {})
        .sort(
          ([, a], [, b]) =>
            a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1, // Sort by symbol (ascending)
        )
        .map(([coinType, coinMetadata]) => getToken(coinType, coinMetadata)),
    [balancesCoinMetadataMap],
  );

  const quotePopoverTokens = useMemo(
    () =>
      basePopoverTokens.filter((token) =>
        [
          NORMALIZED_SUI_COINTYPE,
          NORMALIZED_sSUI_COINTYPE,
          ...NORMALIZED_STABLECOIN_COINTYPES,
        ].includes(token.coinType),
      ),
    [basePopoverTokens],
  );

  const onPopoverTokenClick = (token: Token, index: number) => {
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
      if (tokenUsdPricesMap[coinType] === undefined)
        fetchTokenUsdPrice(coinType);
    }

    setCoinTypes(newCoinTypes);

    setTimeout(
      () =>
        document.getElementById(getCoinInputId(newCoinTypes[index]))?.focus(),
      50,
    );
  };

  // Quoter
  const [quoterId, setQuoterId] = useState<QuoterId | undefined>(undefined);

  // Fee tier
  const [feeTierPercent, setFeeTierPercent] = useState<number | undefined>(
    undefined,
  );

  // Existing pools
  const existingPools = appData.pools.filter(
    (pool) =>
      pool.coinTypes[0] === coinTypes[0] && pool.coinTypes[1] === coinTypes[1],
  );

  const hasExistingPoolForQuoterAndFeeTier = (
    _quoterId?: QuoterId,
    _feeTierPercent?: number,
  ) =>
    !!existingPools.find(
      (pool) =>
        pool.quoter.id === _quoterId &&
        +pool.feeTierPercent === _feeTierPercent,
    );

  const existingPoolTooltip = coinTypes.every((coinType) => coinType !== "")
    ? `A ${formatPair(coinTypes.map((coinType) => balancesCoinMetadataMap![coinType].symbol))} pool with this quoter and fee tier already exists`
    : undefined;

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) return { isDisabled: true, isLoading: true };

    if (coinTypes.some((coinType) => coinType === ""))
      return { isDisabled: true, title: "Select tokens" };
    if (values.some((value) => value === ""))
      return { isDisabled: true, title: "Enter amounts" };
    if (Object.values(values).some((value) => new BigNumber(value).lt(0)))
      return { isDisabled: true, title: "Enter a +ve amounts" };
    if (Object.values(values).some((value) => new BigNumber(value).eq(0)))
      return { isDisabled: true, title: "Enter a non-zero amounts" };
    if (quoterId === undefined)
      return { isDisabled: true, title: "Select a quoter" };
    if (feeTierPercent === undefined)
      return { isDisabled: true, title: "Select a fee tier" };

    if (hasExistingPoolForQuoterAndFeeTier(quoterId, feeTierPercent))
      return {
        isDisabled: true,
        title: "Pool already exists",
      };

    //

    if (getBalance(NORMALIZED_SUI_COINTYPE).lt(SUI_GAS_MIN))
      return {
        isDisabled: true,
        title: `${SUI_GAS_MIN} SUI should be saved for gas`,
      };

    for (let i = 0; i < coinTypes.length; i++) {
      const coinType = coinTypes[i];
      const coinMetadata = balancesCoinMetadataMap![coinType];

      if (
        isSui(coinType) &&
        new BigNumber(
          getBalance(NORMALIZED_SUI_COINTYPE).minus(SUI_GAS_MIN),
        ).lt(values[i])
      )
        return {
          isDisabled: true,
          title: `${SUI_GAS_MIN} SUI should be saved for gas`,
        };

      if (getBalance(coinType).lt(values[i]))
        return {
          isDisabled: true,
          title: `Insufficient ${coinMetadata.symbol}`,
        };
    }

    return {
      isDisabled: false,
      title: "Create pool and deposit",
    };
  })();

  const createCoin = async (bytecode: Uint8Array<ArrayBufferLike>) => {
    // Create coin
    const transaction = new Transaction();

    const [upgradeCap] = transaction.publish({
      modules: [[...bytecode]],
      dependencies: [normalizeSuiAddress("0x1"), normalizeSuiAddress("0x2")],
    });
    transaction.transferObjects(
      [upgradeCap],
      transaction.pure.address(address!),
    );

    const res = await signExecuteAndWaitForTransaction(transaction);

    // Get TreasuryCap id from transaction
    const treasuryCapObjectChange: SuiObjectChange | undefined =
      res.objectChanges?.find(
        (change) =>
          change.type === "created" &&
          change.objectType.includes("TreasuryCap"),
      );
    if (!treasuryCapObjectChange)
      throw new Error("TreasuryCap object change not found");
    if (treasuryCapObjectChange.type !== "created")
      throw new Error("TreasuryCap object change is not of type 'created'");

    // Get CoinMetadata id from transaction
    const coinMetaObjectChange: SuiObjectChange | undefined =
      res.objectChanges?.find(
        (change) =>
          change.type === "created" &&
          change.objectType.includes("CoinMetadata"),
      );
    if (!coinMetaObjectChange)
      throw new Error("CoinMetadata object change not found");
    if (coinMetaObjectChange.type !== "created")
      throw new Error("CoinMetadata object change is not of type 'created'");

    const treasuryCapId = treasuryCapObjectChange.objectId;
    const coinType = treasuryCapObjectChange.objectType
      .split("<")[1]
      .split(">")[0];
    const coinMetadataId = coinMetaObjectChange.objectId;

    console.log(
      "coinType:",
      coinType,
      "treasuryCapId:",
      treasuryCapId,
      "coinMetadataId:",
      coinMetadataId,
    );

    return { treasuryCapId, coinType, coinMetadataId };
  };

  const onSubmitClick = async () => {
    if (submitButtonState.isDisabled) return;
    if (!address || !quoterId || !feeTierPercent) return;

    try {
      setIsSubmitting(true);

      const tokens = coinTypes.map((coinType) =>
        getToken(coinType, balancesCoinMetadataMap![coinType]),
      );
      if (!tokens.every((token) => !!token.id))
        throw new Error("Token coinMetadata id not found");

      // Step 1: Create bTokens (if needed) - one transaction per bToken
      await init();

      const existingBTokenTypeCoinMetadataMap = await getCoinMetadataMap(
        suiClient,
        Object.keys(appData.bTokenTypeCoinTypeMap),
      );
      console.log(
        "XXX existingBTokenTypeCoinMetadataMap:",
        existingBTokenTypeCoinMetadataMap,
      );

      const createBTokenResults = [];
      for (const index of [0, 1]) {
        if (
          !!Object.keys(existingBTokenTypeCoinMetadataMap).find(
            (coinType) =>
              coinType.split("::")[2] === getBTokenType(tokens[index]),
          )
        ) {
          createBTokenResults.push(undefined);
          continue;
        }

        const createBTokenResult = await createCoin(
          generate_bytecode(
            getBTokenModule(tokens[index]),
            getBTokenType(tokens[index]),
            getBTokenName(tokens[index]),
            getBTokenSymbol(tokens[index]),
            B_TOKEN_DESCRIPTION,
            B_TOKEN_IMAGE_URL,
          ),
        );
        createBTokenResults.push(createBTokenResult);
      }

      const bTokens = createBTokenResults.map((result, index) => {
        if (result === undefined) {
          const coinType = Object.keys(existingBTokenTypeCoinMetadataMap).find(
            (_coinType) =>
              _coinType.split("::")[2] === getBTokenType(tokens[index]),
          )!; // Checked above
          const coinMetadata = existingBTokenTypeCoinMetadataMap[coinType];
          if (!coinMetadata.id)
            throw new Error("bToken coinMetadata id not found");

          return {
            coinType,
            id: coinMetadata.id,
          };
        }
        return {
          coinType: result.coinType,
          id: result.coinMetadataId,
        };
      });

      // Step 2: Create LP token - one transaction
      const createLpTokenResult = await createCoin(
        generate_bytecode(
          getLpTokenModule(bTokens[0], bTokens[1]),
          getLpTokenType(bTokens[0], bTokens[1]),
          getLpTokenName(tokens[0], tokens[1]),
          getLpTokenSymbol(tokens[0], tokens[1]),
          LP_TOKEN_DESCRIPTION,
          LP_TOKEN_IMAGE_URL,
        ),
      );

      // Step 3: Create banks (if needed) and pool - one transaction
      const transaction = new Transaction();

      for (const index of [0, 1]) {
        if (createBTokenResults[index] === undefined) continue; // bToken and bank already exist

        await steammClient.Bank.createBank(transaction, {
          coinType: tokens[index].coinType,
          coinMetaT: tokens[index].id!, // Checked above
          bTokenTreasuryId: createBTokenResults[index].treasuryCapId,
          bTokenTokenType: createBTokenResults[index].coinType,
          bTokenMetadataId: createBTokenResults[index].coinMetadataId,
        });
      }

      await steammClient.Pool.createPool(transaction, {
        lpTreasuryId: createLpTokenResult.treasuryCapId,
        lpTokenType: createLpTokenResult.coinType,
        lpMetadataId: createLpTokenResult.coinMetadataId,
        btokenTypeA: bTokens[0].coinType,
        coinMetaA: bTokens[0].id!, // Checked above
        btokenTypeB: bTokens[1].coinType,
        coinMetaB: bTokens[1].id!,
        swapFeeBps: BigInt(feeTierPercent * 100),
        offset: BigInt(0), // TODO: Set offset
        // TODO: Set quoter
      });

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast(
        `Created ${formatPair(tokens.map((token) => token.symbol))} pool`,
        txUrl,
        {
          description: `Quoter: ${QUOTERS.find((_quoter) => _quoter.id === quoterId)!.name}, fee tier: ${formatFeeTier(new BigNumber(feeTierPercent))}`,
        },
      );

      setCoinTypes(["", ""]);
      setValues(["", ""]);
      setQuoterId(undefined);
      setFeeTierPercent(undefined);
    } catch (err) {
      showErrorToast("Failed to create pool", err as Error, undefined, true);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      refresh();
    }
  };

  return (
    <>
      <Head>
        <title>STEAMM | Admin</title>
      </Head>

      <div className="flex w-full max-w-lg flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <h1 className="text-h1 text-foreground">Admin</h1>

          <p className="text-h3 text-foreground">Create pool</p>
          <div className="flex w-full flex-col gap-4 rounded-md border p-5">
            {/* Base asset */}
            <div className="flex w-full flex-col gap-3">
              <p className="text-p2 text-secondary-foreground">Base asset</p>
              <CoinInput
                token={
                  coinTypes[0] !== ""
                    ? getToken(
                        coinTypes[0],
                        balancesCoinMetadataMap![coinTypes[0]],
                      )
                    : undefined
                }
                value={values[0]}
                usdValue={usdValues[0]}
                onChange={
                  coinTypes[0] !== ""
                    ? (value) => onValueChange(value, 0)
                    : undefined
                }
                onBalanceClick={
                  coinTypes[0] !== "" ? () => onBalanceClick(0) : undefined
                }
                popoverTokens={basePopoverTokens}
                onPopoverTokenClick={(token) => onPopoverTokenClick(token, 0)}
              />
            </div>

            {/* Quote */}
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
                usdValue={usdValues[1]}
                onChange={
                  coinTypes[1] !== ""
                    ? (value) => onValueChange(value, 1)
                    : undefined
                }
                onBalanceClick={
                  coinTypes[1] !== "" ? () => onBalanceClick(1) : undefined
                }
                popoverTokens={quotePopoverTokens}
                onPopoverTokenClick={(token) => onPopoverTokenClick(token, 1)}
              />
            </div>

            <div className="flex w-full flex-col gap-2">
              {/* Initial price */}
              <Parameter label="Initial price" isHorizontal>
                {coinTypes.every((coinType) => coinType !== "") &&
                values.every((value) => value !== "")
                  ? `1 ${balancesCoinMetadataMap![coinTypes[0]].symbol} = ${new BigNumber(
                      new BigNumber(values[1]).div(values[0]),
                    ).toFixed(
                      balancesCoinMetadataMap![coinTypes[1]].decimals,
                      BigNumber.ROUND_DOWN,
                    )} ${balancesCoinMetadataMap![coinTypes[1]].symbol}`
                  : "--"}
              </Parameter>

              {/* Market price */}
              <Parameter label="Market price (Birdeye)" isHorizontal>
                {coinTypes.every((coinType) => coinType !== "") ? (
                  birdeyeRatio !== undefined ? (
                    `1 ${balancesCoinMetadataMap![coinTypes[0]].symbol} = ${new BigNumber(
                      birdeyeRatio,
                    ).toFixed(
                      balancesCoinMetadataMap![coinTypes[1]].decimals,
                      BigNumber.ROUND_DOWN,
                    )} ${balancesCoinMetadataMap![coinTypes[1]].symbol}`
                  ) : (
                    <Skeleton className="h-[21px] w-24" />
                  )
                ) : (
                  "--"
                )}
              </Parameter>
            </div>

            <Divider />

            {/* Quoter */}
            <div className="flex flex-row items-center justify-between">
              <p className="text-p2 text-secondary-foreground">Quoter</p>

              <div className="flex flex-row gap-1">
                {QUOTERS.map((_quoter) => {
                  const hasExistingPool = hasExistingPoolForQuoterAndFeeTier(
                    _quoter.id,
                    feeTierPercent,
                  );

                  return (
                    <div key={_quoter.id} className="w-max">
                      <Tooltip
                        title={
                          _quoter.id === QuoterId.ORACLE_AMM
                            ? "Coming soon"
                            : hasExistingPool
                              ? existingPoolTooltip
                              : undefined
                        }
                      >
                        <div className="w-max">
                          <button
                            key={_quoter.id}
                            className={cn(
                              "group flex h-10 flex-row items-center rounded-md border px-3 transition-colors disabled:pointer-events-none disabled:opacity-50",
                              quoterId === _quoter.id
                                ? "cursor-default bg-button-1"
                                : "hover:bg-border/50",
                            )}
                            onClick={() => setQuoterId(_quoter.id)}
                            disabled={
                              _quoter.id === QuoterId.ORACLE_AMM ||
                              hasExistingPool
                            }
                          >
                            <p
                              className={cn(
                                "!text-p2 transition-colors",
                                quoterId === _quoter.id
                                  ? "text-button-1-foreground"
                                  : "text-secondary-foreground group-hover:text-foreground",
                              )}
                            >
                              {_quoter.name}
                            </p>
                          </button>
                        </div>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fee tier */}
            <div className="flex flex-row items-center justify-between">
              <p className="text-p2 text-secondary-foreground">Fee tier</p>

              <div className="flex flex-row gap-1">
                {FEE_TIER_PERCENTS.map((_feeTierPercent) => {
                  const hasExistingPool = hasExistingPoolForQuoterAndFeeTier(
                    quoterId,
                    _feeTierPercent,
                  );

                  return (
                    <div key={_feeTierPercent} className="w-max">
                      <Tooltip
                        title={
                          hasExistingPool ? existingPoolTooltip : undefined
                        }
                      >
                        <div className="w-max">
                          <button
                            className={cn(
                              "group flex h-10 flex-row items-center rounded-md border px-3 transition-colors disabled:pointer-events-none disabled:opacity-50",
                              feeTierPercent === _feeTierPercent
                                ? "cursor-default bg-button-1"
                                : "hover:bg-border/50",
                            )}
                            onClick={() => setFeeTierPercent(_feeTierPercent)}
                            disabled={hasExistingPool}
                          >
                            <p
                              className={cn(
                                "!text-p2 transition-colors",
                                feeTierPercent === _feeTierPercent
                                  ? "text-button-1-foreground"
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

            <SubmitButton
              submitButtonState={submitButtonState}
              onClick={onSubmitClick}
            />
          </div>
        </div>
      </div>
    </>
  );
}
