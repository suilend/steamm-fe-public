import Link from "next/link";
import { useMemo, useState } from "react";

import init, {
  update_constants,
  update_identifiers,
} from "@mysten/move-bytecode-template";
import { bcs } from "@mysten/sui/bcs";
import { CoinMetadata, SuiEvent, SuiObjectChange } from "@mysten/sui/client";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import {
  SUI_CLOCK_OBJECT_ID,
  normalizeStructTag,
  normalizeSuiAddress,
} from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import { useFlags } from "launchdarkly-react-client-sdk";

import {
  NORMALIZED_SUI_COINTYPE,
  SUI_GAS_MIN,
  Token,
  getCoinMetadataMap,
  getToken,
  isStablecoin,
  isSui,
} from "@suilend/frontend-sui";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import { ADMIN_ADDRESS, PoolScriptFunctions } from "@suilend/steamm-sdk";
import { OracleQuoterV2 } from "@suilend/steamm-sdk/_codegen/_generated/steamm/omm_v2/structs";
import { Pool } from "@suilend/steamm-sdk/_codegen/_generated/steamm/pool/structs";

import CoinInput, { getCoinInputId } from "@/components/CoinInput";
import Divider from "@/components/Divider";
import Parameter from "@/components/Parameter";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import useBirdeyeUsdPrices from "@/hooks/useBirdeyeUsdPrices";
import {
  formatAmplifier,
  formatFeeTier,
  formatPair,
  formatTextInputValue,
} from "@/lib/format";
import { API_URL, POOL_URL_PREFIX } from "@/lib/navigation";
import { getBirdeyeRatio } from "@/lib/swap";
import { showSuccessTxnToast } from "@/lib/toasts";
import { ParsedPool, QUOTER_ID_NAME_MAP, QuoterId } from "@/lib/types";
import { cn, hoverUnderlineClassName } from "@/lib/utils";

const AMPLIFIERS: number[] = [1, 5, 10, 20, 50, 100];
const FEE_TIER_PERCENTS: number[] = [1, 5, 10, 20, 25, 30, 50, 100, 200].map(
  (bps) => bps / 100,
);

const generate_bytecode = (
  module: string,
  type: string,
  name: string,
  symbol: string,
  description: string,
  iconUrl: string,
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
    bcs.string().serialize(iconUrl).toBytes(), // new value
    bcs.string().serialize("https://example.com/template.png").toBytes(), // current value
    "Vector(U8)", // type of the constant
  );

  return updated;
};

const getBTokenModule = (token: Token) =>
  `b_${token.coinType.split("::")[1]}`.toLowerCase(); // E.g. b_<module>
const getBTokenType = (token: Token) =>
  `B_${token.coinType.split("::")[2]}`.toUpperCase(); // E.g. B_<TYPE>
const getBTokenName = (token: Token) => `bToken ${token.symbol}`; // E.g. bToken SUI
const getBTokenSymbol = (token: Token) => `b${token.symbol}`; // E.g. bSUI // Cannot be same as name
const B_TOKEN_DESCRIPTION = "STEAMM bToken";
const B_TOKEN_IMAGE_URL =
  "https://suilend-assets.s3.us-east-2.amazonaws.com/steamm/STEAMM+bToken.svg";

const getLpTokenModule = (bTokenA: Token, bTokenB: Token) =>
  `steamm_lp_${bTokenA.symbol}_${bTokenB.symbol}`
    .toLowerCase()
    .replace(/\s+/g, "_"); // E.g. steamm_lp_bsui_busdc
const getLpTokenType = (bTokenA: Token, bTokenB: Token) =>
  `STEAMM_LP_${bTokenA.symbol}_${bTokenB.symbol}`
    .toUpperCase()
    .replace(/\s+/g, "_"); // E.g. STEAMM_LP_BSUI_BUSDC
const getLpTokenName = (bTokenA: Token, bTokenB: Token) =>
  `STEAMM LP Token ${bTokenA.symbol}-${bTokenB.symbol}`; // E.g. STEAMM LP Token bSUI-bUSDC
const getLpTokenSymbol = (bTokenA: Token, bTokenB: Token) =>
  `STEAMM LP ${bTokenA.symbol}-${bTokenB.symbol}`; // E.g. STEAMM LP bSUI-bUSDC // Cannot be same as name
const LP_TOKEN_DESCRIPTION = "STEAMM LP Token";
const LP_TOKEN_IMAGE_URL =
  "https://suilend-assets.s3.us-east-2.amazonaws.com/steamm/STEAMM+LP+Token.svg";

interface CreatePoolCardProps {
  noWhitelist?: boolean;
  quoterId?: QuoterId;
}

export default function CreatePoolCard({
  noWhitelist,
  quoterId: hardcodedQuoterId,
}: CreatePoolCardProps) {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData, oraclesData, banksData, poolsData } =
    useLoadedAppContext();
  const { balancesCoinMetadataMap, getBalance, refresh } = useUserContext();

  const flags = useFlags();
  const isWhitelisted = useMemo(
    () =>
      !!address &&
      (noWhitelist ||
        address === ADMIN_ADDRESS ||
        (flags?.steammCreatePoolWhitelist ?? []).includes(address)),
    [address, noWhitelist, flags?.steammCreatePoolWhitelist],
  );

  // State
  const [createdPoolId, setCreatedPoolId] = useState<string | undefined>(
    undefined,
  );

  // CoinTypes
  const [coinTypes, setCoinTypes] = useState<[string, string]>(["", ""]);

  // Quoter
  const [quoterId, setQuoterId] = useState<QuoterId | undefined>(
    hardcodedQuoterId,
  );

  const onSelectQuoter = (newQuoterId: QuoterId) => {
    if (oraclesData === undefined) return;
    setQuoterId(newQuoterId);

    if ([QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(newQuoterId)) {
      setCoinTypes(
        (prev) =>
          prev.map((coinType) =>
            oraclesData.COINTYPE_ORACLE_INDEX_MAP[coinType] === undefined
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
        ? BigNumber.max(0, getBalance(coinType).minus(1))
        : getBalance(coinType)
      : new BigNumber(0),
  ) as [BigNumber, BigNumber];

  const [values, setValues] = useState<[string, string]>(["", ""]);
  const [lastActiveInputIndex, setLastActiveInputIndex] = useState<
    number | undefined
  >(undefined);

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
  console.log("AdminPage - birdeyeRatio:", birdeyeRatio);

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
      oraclesData === undefined
        ? []
        : Object.entries(balancesCoinMetadataMap ?? {})
            .sort(
              ([, a], [, b]) =>
                a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1, // Sort by symbol (ascending)
            )
            .filter(([coinType]) => getBalance(coinType).gt(0))
            .map(([coinType, coinMetadata]) => getToken(coinType, coinMetadata))
            .filter(
              (token) =>
                quoterId === undefined ||
                !(
                  [QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(quoterId) &&
                  oraclesData.COINTYPE_ORACLE_INDEX_MAP[token.coinType] ===
                    undefined
                ),
            ),
    [oraclesData, balancesCoinMetadataMap, quoterId, getBalance],
  );

  const quoteTokens = useMemo(
    () =>
      baseTokens.filter(
        (token) =>
          isSui(token.coinType) ||
          isStablecoin(token.coinType) ||
          Object.keys(appData.lstAprPercentMap).includes(token.coinType),
      ),
    [baseTokens, appData.lstAprPercentMap],
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

    setTimeout(
      () =>
        document.getElementById(getCoinInputId(newCoinTypes[index]))?.focus(),
      250,
    );
  };

  // Amplifier
  const [amplifier, setAmplifier] = useState<number | undefined>(undefined);

  // Fee tier
  const [feeTierPercent, setFeeTierPercent] = useState<number | undefined>(
    undefined,
  );

  // Existing pools
  const existingPools: ParsedPool[] | undefined = useMemo(() => {
    if (poolsData === undefined) return undefined;

    return poolsData.pools.filter(
      (pool) =>
        pool.coinTypes[0] === coinTypes[0] &&
        pool.coinTypes[1] === coinTypes[1],
    );
  }, [poolsData, coinTypes]);

  const hasExistingPoolForQuoterFeeTierAndAmplifier = (
    _quoterId?: QuoterId,
    _feeTierPercent?: number,
    _amplifier?: number,
  ) =>
    !!(existingPools ?? []).find(
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
    ? `${formatPair(coinTypes.map((coinType) => balancesCoinMetadataMap![coinType].symbol))} pool with this quoter${quoterId === QuoterId.ORACLE_V2 ? ", fee tier, and amplifier" : " and fee tier"} already exists`
    : undefined;

  // Submit
  const reset = () => {
    setCreatedPoolId(undefined);

    setCoinTypes(["", ""]);
    setValues(["", ""]);
    if (!hardcodedQuoterId) setQuoterId(undefined);
    setFeeTierPercent(undefined);
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (!isWhitelisted)
      return { isDisabled: true, title: "Create pool and deposit" };
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
  type CreateCoinReturnType = Awaited<ReturnType<typeof createCoin>>;

  const onSubmitClick = async () => {
    if (oraclesData === undefined || banksData === undefined) return;

    if (submitButtonState.isDisabled) return;
    if (!quoterId || !feeTierPercent) return;

    try {
      if (!address) throw new Error("Wallet not connected");

      const oracleIndexA = oraclesData.COINTYPE_ORACLE_INDEX_MAP[coinTypes[0]];
      const oracleIndexB = oraclesData.COINTYPE_ORACLE_INDEX_MAP[coinTypes[1]];

      if ([QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(quoterId)) {
        // Won't happen in practice, as we don't allow the user to select tokens that
        // don't have an oracle index if the oracle/oracle V2 quoter is selected
        if (oracleIndexA === undefined)
          throw new Error(
            "Base asset coinType not found in COINTYPE_ORACLE_INDEX_MAP",
          );
        if (oracleIndexB === undefined)
          throw new Error(
            "Quote asset coinType not found in COINTYPE_ORACLE_INDEX_MAP",
          );
      }

      setIsSubmitting(true);

      const tokens = coinTypes.map((coinType) =>
        getToken(coinType, balancesCoinMetadataMap![coinType]),
      );
      if (!tokens.every((token) => !!token.id))
        throw new Error("Token coinMetadata id not found");

      // Step 1: Create bTokens (if needed) - one transaction per bToken
      await init();

      const existingBTokenTypeCoinMetadataMap = await getCoinMetadataMap(
        Object.keys(banksData.bTokenTypeCoinTypeMap),
      );
      console.log(
        "XXX existingBTokenTypeCoinMetadataMap:",
        existingBTokenTypeCoinMetadataMap,
      );

      const getExistingBTokenForToken = (token: Token) => {
        const bank = banksData.bankMap[token.coinType];
        return bank
          ? getToken(
              bank.bTokenType,
              existingBTokenTypeCoinMetadataMap[bank.bTokenType],
            )
          : undefined;
      };

      const createBTokenResults: [
        CreateCoinReturnType | undefined,
        CreateCoinReturnType | undefined,
      ] = [undefined, undefined];
      if (tokens.some((token) => !getExistingBTokenForToken(token))) {
        for (const index of [0, 1]) {
          if (!!getExistingBTokenForToken(tokens[index])) continue;

          console.log(
            "xxx step 1: create bToken coin - index:",
            index,
            "symbol:",
            tokens[index].symbol,
          );
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
          createBTokenResults[index] = createBTokenResult;
        }
      }

      const bTokens = createBTokenResults.map((result, index) =>
        result === undefined
          ? getExistingBTokenForToken(tokens[index])!
          : getToken(result.coinType, {
              decimals: 9,
              description: B_TOKEN_DESCRIPTION,
              iconUrl: B_TOKEN_IMAGE_URL,
              id: result.coinMetadataId,
              name: getBTokenName(tokens[index]),
              symbol: getBTokenSymbol(tokens[index]),
            } as CoinMetadata),
      ) as [Token, Token];

      // Step 2: Create banks (if needed) - one transaction
      const createBankEvents: SuiEvent[] = [];
      if (createBTokenResults.some((result) => result !== undefined)) {
        const createBanksTransaction = new Transaction();

        for (const index of [0, 1]) {
          if (createBTokenResults[index] === undefined) continue; // bToken and bank already exist

          console.log(
            "xxx step 2: create bank - index:",
            index,
            "symbol:",
            tokens[index].symbol,
          );
          await steammClient.Bank.createBank(createBanksTransaction, {
            coinType: tokens[index].coinType,
            coinMetaT: tokens[index].id!, // Checked above
            bTokenTreasuryId: createBTokenResults[index].treasuryCapId,
            bTokenTokenType: createBTokenResults[index].coinType,
            bTokenMetadataId: createBTokenResults[index].coinMetadataId,
          });
        }

        const banksRes = await signExecuteAndWaitForTransaction(
          createBanksTransaction,
        );

        createBankEvents.push(
          ...(banksRes.events ?? []).filter((event) =>
            event.type.includes("::bank::NewBankEvent"),
          ),
        );
        console.log("xxx step 2: create bank events:", createBankEvents);
      }

      const bankIds = createBTokenResults.map((result, index) => {
        if (result === undefined)
          return banksData.bankMap[tokens[index].coinType].id;
        else {
          const event = createBankEvents.find(
            (event) =>
              normalizeStructTag(
                (event.parsedJson as any).event.coin_type.name,
              ) === tokens[index].coinType,
          );
          if (!event) throw new Error("Create bank event not found"); // Should not happen

          const id = (event.parsedJson as any).event.bank_id as string;
          return id;
        }
      }) as [string, string];
      console.log("xxx step 2: bankIds:", bankIds);

      // Step 3: Create LP token - one transaction
      console.log("xxx step 3: create lpToken coin - bTokens:", bTokens);
      const createLpTokenResult = await createCoin(
        generate_bytecode(
          getLpTokenModule(bTokens[0], bTokens[1]),
          getLpTokenType(bTokens[0], bTokens[1]),
          getLpTokenName(bTokens[0], bTokens[1]),
          getLpTokenSymbol(bTokens[0], bTokens[1]),
          LP_TOKEN_DESCRIPTION,
          LP_TOKEN_IMAGE_URL,
        ),
      );

      // Step 4: Create pool and deposit - one transaction
      const transaction = new Transaction();

      // Step 4.1: Create pool
      console.log(
        "xxx step 4.1: create pool - bTokens:",
        bTokens,
        "lp token:",
        createLpTokenResult,
      );

      const createPoolBaseArgs = {
        bTokenTypeA: bTokens[0].coinType,
        bTokenMetaA: bTokens[0].id!, // Checked above
        bTokenTypeB: bTokens[1].coinType,
        bTokenMetaB: bTokens[1].id!, // Checked above
        lpTreasuryId: createLpTokenResult.treasuryCapId,
        lpTokenType: createLpTokenResult.coinType,
        lpMetadataId: createLpTokenResult.coinMetadataId,
        swapFeeBps: BigInt(feeTierPercent * 100),
      };

      let poolArgs;
      if (quoterId === QuoterId.CPMM) {
        poolArgs = {
          ...createPoolBaseArgs,
          type: "ConstantProduct" as const,
          offset: BigInt(0), // TODO
        };
      } else if (quoterId === QuoterId.ORACLE) {
        poolArgs = {
          ...createPoolBaseArgs,
          type: "Oracle" as const,
          oracleIndexA: BigInt(oracleIndexA!), // Checked above
          oracleIndexB: BigInt(oracleIndexB!), // Checked above
          coinTypeA: tokens[0].coinType,
          coinMetaA: tokens[0].id!, // Checked above
          coinTypeB: tokens[1].coinType,
          coinMetaB: tokens[1].id!, // Checked above
        };
      } else if (quoterId === QuoterId.ORACLE_V2) {
        poolArgs = {
          ...createPoolBaseArgs,
          type: "OracleV2" as const,
          oracleIndexA: BigInt(oracleIndexA!), // Checked above
          oracleIndexB: BigInt(oracleIndexB!), // Checked above
          coinTypeA: tokens[0].coinType,
          coinMetaA: tokens[0].id!, // Checked above
          coinTypeB: tokens[1].coinType,
          coinMetaB: tokens[1].id!, // Checked above
          amplifier: BigInt(amplifier!), // Checked above
        };
      } else {
        throw new Error("Invalid quoterId");
      }

      const pool = await steammClient.Pool.createPool(transaction, poolArgs);

      // Step 4.2: Deposit
      console.log("xxx step 4.2: deposit - pool:", pool);

      const submitAmountA = new BigNumber(values[0])
        .times(10 ** tokens[0].decimals)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();
      const submitAmountB = new BigNumber(values[1])
        .times(10 ** tokens[1].decimals)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const coinA = coinWithBalance({
        balance: BigInt(submitAmountA),
        type: tokens[0].coinType,
        useGasCoin: isSui(tokens[0].coinType),
      })(transaction);
      const coinB = coinWithBalance({
        balance: BigInt(submitAmountB),
        type: tokens[1].coinType,
        useGasCoin: isSui(tokens[1].coinType),
      })(transaction);

      const { lendingMarketId, lendingMarketType } =
        steammClient.sdkOptions.suilend_config.config!;

      const [lpCoin] = PoolScriptFunctions.depositLiquidity(
        transaction,
        [
          lendingMarketType,
          tokens[0].coinType,
          tokens[1].coinType,
          bTokens[0].coinType,
          bTokens[1].coinType,
          {
            [QuoterId.CPMM]: `${steammClient.sdkOptions.steamm_config.config!.quoterSourcePkgs.cpmm}::cpmm::CpQuoter`,
            [QuoterId.ORACLE]: `${
              steammClient.sdkOptions.steamm_config.config!.quoterSourcePkgs.omm
            }::omm::OracleQuoter`,
            [QuoterId.ORACLE_V2]: `${
              steammClient.sdkOptions.steamm_config.config!.quoterSourcePkgs
                .omm_v2
            }::omm_v2::OracleQuoterV2`,
          }[quoterId],
          createLpTokenResult.coinType,
        ],
        {
          pool,
          bankA: transaction.object(bankIds[0]),
          bankB: transaction.object(bankIds[1]),
          lendingMarket: transaction.object(lendingMarketId),
          coinA: transaction.object(coinA),
          coinB: transaction.object(coinB),
          maxA: BigInt(submitAmountA),
          maxB: BigInt(submitAmountB),
          clock: transaction.object(SUI_CLOCK_OBJECT_ID),
        },
        steammClient.scriptPackageInfo().publishedAt,
      );
      transaction.transferObjects([coinA, coinB], address);
      transaction.transferObjects([lpCoin], address);

      // Step 4.3: Share pool
      const sharePoolBaseArgs = {
        pool,
        lpTokenType: createLpTokenResult.coinType,
        bTokenTypeA: bTokens[0].coinType,
        bTokenTypeB: bTokens[1].coinType,
      };

      steammClient.Pool.sharePool(
        {
          [QuoterId.CPMM]: {
            ...sharePoolBaseArgs,
            type: "ConstantProduct" as const,
          },
          [QuoterId.ORACLE]: {
            ...sharePoolBaseArgs,
            type: "Oracle" as const,
          },
          [QuoterId.ORACLE_V2]: {
            ...sharePoolBaseArgs,
            type: "OracleV2" as const,
          },
        }[quoterId],
        transaction,
      );

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast(
        `Created ${formatPair(tokens.map((token) => token.symbol))} pool`,
        txUrl,
        {
          description: `Quoter: ${QUOTER_ID_NAME_MAP[quoterId]}, fee tier: ${formatFeeTier(new BigNumber(feeTierPercent))}`,
        },
      );

      // Get created pool id
      const poolObjectChange: SuiObjectChange | undefined =
        res.objectChanges?.find(
          (change) =>
            change.type === "created" &&
            change.objectType.includes("::pool::Pool<"),
        );
      if (!poolObjectChange) throw new Error("Pool object change not found");
      if (poolObjectChange.type !== "created")
        throw new Error("Pool object change is not of type 'created'");

      setCreatedPoolId(poolObjectChange.objectId);
      await fetch(`${API_URL}/steamm/clear-cache`); // Clear cache

      await new Promise((resolve) => {
        setTimeout(() => resolve(true), 1000);
      }); // Wait 1 second before refreshing data
    } catch (err) {
      showErrorToast("Failed to create pool", err as Error, undefined, true);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      refresh();
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Base asset */}
      <div className="flex w-full flex-col gap-3">
        <p className="text-p2 text-secondary-foreground">Base asset</p>
        <CoinInput
          token={
            coinTypes[0] !== ""
              ? getToken(coinTypes[0], balancesCoinMetadataMap![coinTypes[0]])
              : undefined
          }
          value={values[0]}
          usdValue={birdeyeUsdValues[0]}
          onChange={
            coinTypes[0] !== "" ? (value) => onValueChange(value, 0) : undefined
          }
          onMaxAmountClick={
            coinTypes[0] !== "" ? () => onBalanceClick(0) : undefined
          }
          tokens={baseTokens}
          onSelectToken={(token) => onSelectToken(token, 0)}
        />
      </div>

      {/* Quote */}
      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full flex-col gap-1">
          <p className="text-p2 text-secondary-foreground">Quote asset</p>
          <p className="text-p3 text-tertiary-foreground">
            SUI or stablecoins (e.g. USDC, USDT) are usually used as the quote
            asset.
          </p>
        </div>
        <CoinInput
          token={
            coinTypes[1] !== ""
              ? getToken(coinTypes[1], balancesCoinMetadataMap![coinTypes[1]])
              : undefined
          }
          value={values[1]}
          usdValue={birdeyeUsdValues[1]}
          onChange={
            coinTypes[1] !== "" ? (value) => onValueChange(value, 1) : undefined
          }
          onMaxAmountClick={
            coinTypes[1] !== "" ? () => onBalanceClick(1) : undefined
          }
          tokens={quoteTokens}
          onSelectToken={(token) => onSelectToken(token, 1)}
        />
      </div>

      <div className="flex w-full flex-col gap-2">
        {/* Initial price */}
        <Parameter label="Initial price" isHorizontal>
          <p className="text-p2 text-foreground">
            {coinTypes.every((coinType) => coinType !== "") &&
            values.every((value) => value !== "")
              ? `1 ${balancesCoinMetadataMap![coinTypes[0]].symbol} = ${new BigNumber(
                  new BigNumber(values[1]).div(values[0]),
                ).toFixed(
                  balancesCoinMetadataMap![coinTypes[1]].decimals,
                  BigNumber.ROUND_DOWN,
                )} ${balancesCoinMetadataMap![coinTypes[1]].symbol}`
              : "--"}
          </p>
        </Parameter>

        {/* Market price */}
        <Parameter label="Market price (Birdeye)" isHorizontal>
          <div className="flex flex-col items-end gap-1.5">
            <p className="text-p2 text-foreground">
              {coinTypes.every((coinType) => coinType !== "") ? (
                birdeyeRatio === undefined ? (
                  <Skeleton className="h-[21px] w-24" />
                ) : birdeyeRatio === null ? null : (
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
      </div>

      <Divider />

      {/* Quoter */}
      {!hardcodedQuoterId && (
        <div className="flex flex-row items-center justify-between">
          <p className="text-p2 text-secondary-foreground">Quoter</p>

          <div className="flex flex-row gap-1">
            {Object.values(QuoterId)
              .filter((_quoterId) => _quoterId !== QuoterId.ORACLE)
              .map((_quoterId) => {
                const hasExistingPool =
                  hasExistingPoolForQuoterFeeTierAndAmplifier(
                    _quoterId,
                    feeTierPercent,
                    amplifier,
                  );

                return (
                  <div key={_quoterId} className="w-max">
                    <Tooltip
                      title={hasExistingPool ? existingPoolTooltip : undefined}
                    >
                      <div className="w-max">
                        <button
                          key={_quoterId}
                          className={cn(
                            "group flex h-10 flex-row items-center rounded-md border px-3 transition-colors disabled:pointer-events-none disabled:opacity-50",
                            _quoterId === quoterId
                              ? "cursor-default bg-button-1"
                              : "hover:bg-border/50",
                          )}
                          onClick={() => onSelectQuoter(_quoterId)}
                          disabled={hasExistingPool}
                        >
                          <p
                            className={cn(
                              "!text-p2 transition-colors",
                              _quoterId === quoterId
                                ? "text-button-1-foreground"
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
          <Tooltip title="The amplifier determines how concentrated the pool will be. Higher values are more suitable for volatile assets, while lower values are more suitable for stable assets.">
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
                    title={hasExistingPool ? existingPoolTooltip : undefined}
                  >
                    <div className="w-max">
                      <button
                        className={cn(
                          "group flex h-10 flex-row items-center rounded-md border px-3 transition-colors disabled:pointer-events-none disabled:opacity-50",
                          amplifier === _amplifier
                            ? "cursor-default bg-button-1"
                            : "hover:bg-border/50",
                        )}
                        onClick={() => setAmplifier(_amplifier)}
                        disabled={hasExistingPool}
                      >
                        <p
                          className={cn(
                            "!text-p2 transition-colors",
                            amplifier === _amplifier
                              ? "text-button-1-foreground"
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
      <div className="flex flex-row items-center justify-between">
        <p className="shrink-0 text-p2 text-secondary-foreground">Fee tier</p>

        <div className="flex flex-1 flex-row flex-wrap justify-end gap-1">
          {FEE_TIER_PERCENTS.map((_feeTierPercent) => {
            const hasExistingPool = hasExistingPoolForQuoterFeeTierAndAmplifier(
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

      {!createdPoolId ? (
        <SubmitButton
          submitButtonState={submitButtonState}
          onClick={onSubmitClick}
        />
      ) : (
        <Link
          className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80"
          href={`${POOL_URL_PREFIX}/${createdPoolId}`}
          target="_blank"
        >
          <p className="text-p1 text-button-1-foreground">Go to pool</p>
        </Link>
      )}

      {/* Reset */}
      <button
        className="group flex h-10 w-full flex-row items-center justify-center rounded-md border px-3 transition-colors hover:bg-border/50"
        onClick={reset}
      >
        <p className="text-p2 text-secondary-foreground transition-colors group-hover:text-foreground">
          Start over
        </p>
      </button>
    </div>
  );
}
