import {
  update_constants,
  update_identifiers,
} from "@mysten/move-bytecode-template";
import { bcs } from "@mysten/sui/bcs";
import {
  SuiEvent,
  SuiObjectChange,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import {
  SUI_CLOCK_OBJECT_ID,
  normalizeStructTag,
  normalizeSuiAddress,
} from "@mysten/sui/utils";
import BigNumber from "bignumber.js";

import {
  Token,
  getCoinMetadataMap,
  getToken,
  isSui,
} from "@suilend/frontend-sui";
import { PoolScriptFunctions, SteammSDK } from "@suilend/steamm-sdk";

import { AppData } from "@/contexts/AppContext";
import { QUOTER_ID_NAME_MAP, QuoterId } from "@/lib/types";

type SignExecuteAndWaitForTransaction = (
  transaction: Transaction,
  options?: {
    auction?: boolean;
  },
) => Promise<SuiTransactionBlockResponse>; // TODO: Use WalletContext type directly (currently not exported)

export const AMPLIFIERS: number[] = [1, 5, 10, 20, 50, 100];
export const FEE_TIER_PERCENTS: number[] = [
  1, 5, 10, 20, 25, 30, 50, 100, 200,
].map((bps) => bps / 100);

const getBTokenModule = (token: Token) =>
  `b_${token.coinType.split("::")[1]}`.toLowerCase(); // E.g. b_sui
const getBTokenType = (token: Token) =>
  `B_${token.coinType.split("::")[2]}`.toUpperCase(); // E.g. B_SUI
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

export const generate_bytecode = (
  module: string,
  type: string,
  name: string,
  symbol: string,
  description: string,
  iconUrl: string,
): Uint8Array<ArrayBufferLike> => {
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

type CreateCoinResult = {
  treasuryCapId: string;
  coinType: string;
  coinMetadataId: string;
};
const createCoin = async (
  bytecode: Uint8Array<ArrayBufferLike>,
  address: string,
  signExecuteAndWaitForTransaction: SignExecuteAndWaitForTransaction,
): Promise<CreateCoinResult> => {
  const transaction = new Transaction();

  const [upgradeCap] = transaction.publish({
    modules: [[...bytecode]],
    dependencies: [normalizeSuiAddress("0x1"), normalizeSuiAddress("0x2")],
  });
  transaction.transferObjects([upgradeCap], transaction.pure.address(address!));

  const res = await signExecuteAndWaitForTransaction(transaction);

  // Get TreasuryCap id from transaction
  const treasuryCapObjectChange: SuiObjectChange | undefined =
    res.objectChanges?.find(
      (change) =>
        change.type === "created" && change.objectType.includes("TreasuryCap"),
    );
  if (!treasuryCapObjectChange)
    throw new Error("TreasuryCap object change not found");
  if (treasuryCapObjectChange.type !== "created")
    throw new Error("TreasuryCap object change is not of type 'created'");

  // Get CoinMetadata id from transaction
  const coinMetaObjectChange: SuiObjectChange | undefined =
    res.objectChanges?.find(
      (change) =>
        change.type === "created" && change.objectType.includes("CoinMetadata"),
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

// bTokens and banks
export const getOrCreateBTokenAndBankForToken = async (
  token: Token,
  steammClient: SteammSDK,
  appData: AppData,
  address: string,
  signExecuteAndWaitForTransaction: SignExecuteAndWaitForTransaction,
): Promise<{ bToken: Token; bankId: string }> => {
  const existingBank = appData.bankMap[token.coinType];
  if (!!existingBank) {
    const coinMetadataMap = await getCoinMetadataMap([existingBank.bTokenType]);

    const bToken = getToken(
      existingBank.bTokenType,
      coinMetadataMap[existingBank.bTokenType],
    );
    return { bToken, bankId: existingBank.id };
  }

  // 1) Create bToken
  console.log(
    `[createBTokenAndBankForToken] bToken - Creating bToken for coinType ${token.coinType}`,
  );

  const createBTokenResult = await createCoin(
    generate_bytecode(
      getBTokenModule(token),
      getBTokenType(token),
      getBTokenName(token),
      getBTokenSymbol(token),
      B_TOKEN_DESCRIPTION,
      B_TOKEN_IMAGE_URL,
    ),
    address,
    signExecuteAndWaitForTransaction,
  );

  const createdBToken = getToken(createBTokenResult.coinType, {
    decimals: 9,
    description: B_TOKEN_DESCRIPTION,
    iconUrl: B_TOKEN_IMAGE_URL,
    id: createBTokenResult.coinMetadataId,
    name: getBTokenName(token),
    symbol: getBTokenSymbol(token),
  });
  console.log(
    `[createBTokenAndBankForToken] bToken - Created bToken:`,
    createdBToken,
  );

  // 2) Create bank
  console.log(
    `[createBTokenAndBankForToken] bank - Creating bank for coinType ${token.coinType}`,
  );

  const createBankTransaction = new Transaction();

  await steammClient.Bank.createBank(createBankTransaction, {
    coinType: token.coinType,
    coinMetaT: token.id!,
    bTokenTreasuryId: createBTokenResult.treasuryCapId,
    bTokenTokenType: createBTokenResult.coinType,
    bTokenMetadataId: createBTokenResult.coinMetadataId,
  });

  const createBankRes = await signExecuteAndWaitForTransaction(
    createBankTransaction,
  );

  const createBankEvents: SuiEvent[] = (createBankRes.events ?? []).filter(
    (event) => event.type.includes("::bank::NewBankEvent"),
  );

  const createBankEvent = createBankEvents.find(
    (event) =>
      normalizeStructTag((event.parsedJson as any).event.coin_type.name) ===
      token.coinType,
  );
  if (!createBankEvent) throw new Error("Create bank event not found"); // Should not happen

  const createdBankId = (createBankEvent.parsedJson as any).event
    .bank_id as string;
  console.log(
    `[createBTokenAndBankForToken] bank - Created bank: ${createdBankId}`,
  );

  return { bToken: createdBToken, bankId: createdBankId };
};

// LP token
export const createLpToken = async (
  bTokens: [Token, Token],
  address: string,
  signExecuteAndWaitForTransaction: SignExecuteAndWaitForTransaction,
): Promise<CreateCoinResult> => {
  console.log("[createLpToken] Creating LP token for bTokens", bTokens);

  const createLpTokenResult = await createCoin(
    generate_bytecode(
      getLpTokenModule(bTokens[0], bTokens[1]),
      getLpTokenType(bTokens[0], bTokens[1]),
      getLpTokenName(bTokens[0], bTokens[1]),
      getLpTokenSymbol(bTokens[0], bTokens[1]),
      LP_TOKEN_DESCRIPTION,
      LP_TOKEN_IMAGE_URL,
    ),
    address,
    signExecuteAndWaitForTransaction,
  );

  return createLpTokenResult;
};

// Pool
export const createPoolAndDepositInitialLiquidity = async (
  tokens: [Token, Token],
  values: [string, string],
  quoterId: QuoterId,
  amplifier: number | undefined,
  feeTierPercent: number,
  bTokens: [Token, Token],
  bankIds: [string, string],
  createLpTokenResult: CreateCoinResult,
  steammClient: SteammSDK,
  appData: AppData,
  address: string,
  signExecuteAndWaitForTransaction: SignExecuteAndWaitForTransaction,
): Promise<{ res: SuiTransactionBlockResponse; poolId: string }> => {
  const oracleIndexA = appData.COINTYPE_ORACLE_INDEX_MAP[tokens[0].coinType];
  const oracleIndexB = appData.COINTYPE_ORACLE_INDEX_MAP[tokens[1].coinType];

  if ([QuoterId.ORACLE, QuoterId.ORACLE_V2].includes(quoterId)) {
    // Won't happen in practice, as we don't allow the user to select tokens that
    // don't have an oracle index if the oracle/oracle V2 quoter is selected
    if (oracleIndexA === undefined)
      throw new Error(
        `Base asset coinType ${tokens[0].coinType} not found in COINTYPE_ORACLE_INDEX_MAP`,
      );
    if (oracleIndexB === undefined)
      throw new Error(
        `Quote asset coinType ${tokens[1].coinType} not found in COINTYPE_ORACLE_INDEX_MAP`,
      );
  }

  if (quoterId === QuoterId.ORACLE_V2) {
    // Won't happen in practice, as we don't allow the user to create a pool with
    // an Oracle V2 quoter if the amplifier is not set
    if (!amplifier)
      throw new Error(
        `Amplifier is required for ${QUOTER_ID_NAME_MAP[quoterId]} quoter`,
      );
  }

  // 1) Create pool
  console.log("[createPoolAndDepositInitialLiquidity] Creating pool");

  const transaction = new Transaction();

  const createPoolBaseArgs = {
    bTokenTypeA: bTokens[0].coinType,
    bTokenMetaA: bTokens[0].id!,
    bTokenTypeB: bTokens[1].coinType,
    bTokenMetaB: bTokens[1].id!,
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
      oracleIndexA: BigInt(oracleIndexA),
      oracleIndexB: BigInt(oracleIndexB),
      coinTypeA: tokens[0].coinType,
      coinMetaA: tokens[0].id!,
      coinTypeB: tokens[1].coinType,
      coinMetaB: tokens[1].id!,
    };
  } else if (quoterId === QuoterId.ORACLE_V2) {
    poolArgs = {
      ...createPoolBaseArgs,
      type: "OracleV2" as const,
      oracleIndexA: BigInt(oracleIndexA),
      oracleIndexB: BigInt(oracleIndexB),
      coinTypeA: tokens[0].coinType,
      coinMetaA: tokens[0].id!,
      coinTypeB: tokens[1].coinType,
      coinMetaB: tokens[1].id!,
      amplifier: BigInt(amplifier!), // Checked above
    };
  } else {
    throw new Error("Invalid quoterId");
  }

  const pool = await steammClient.Pool.createPool(transaction, poolArgs);

  // 2) Deposit initial liquidity
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
          steammClient.sdkOptions.steamm_config.config!.quoterSourcePkgs.omm_v2
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

  // 3) Share pool
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

  // Get created pool id from transaction
  const createdPoolObjectChange: SuiObjectChange | undefined =
    res.objectChanges?.find(
      (change) =>
        change.type === "created" &&
        change.objectType.includes("::pool::Pool<"),
    );
  if (!createdPoolObjectChange) throw new Error("Pool object change not found");
  if (createdPoolObjectChange.type !== "created")
    throw new Error("Pool object change is not of type 'created'");

  const createdPoolId = createdPoolObjectChange.objectId;
  console.log(
    "[createPoolAndDepositInitialLiquidity] Created pool:",
    createdPoolId,
  );

  return { res, poolId: createdPoolId };
};
