import {
  SuiClient,
  SuiEvent,
  SuiObjectChange,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID, normalizeStructTag } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";

import { Token, getToken, isSui } from "@suilend/frontend-sui";
import { WalletContext } from "@suilend/frontend-sui-next";
import { Codegen, SteammSDK } from "@suilend/steamm-sdk";

import { AppData } from "@/contexts/AppContext";
import {
  CreateCoinResult,
  createCoin,
  generate_bytecode,
} from "@/lib/createCoin";
import { BURN_ADDRESS } from "@/lib/launchToken";
import { QUOTER_ID_NAME_MAP, QuoterId } from "@/lib/types";

export const AMPLIFIERS: number[] = [1, 5, 10, 20, 30, 50, 100];
export const FEE_TIER_PERCENTS: number[] = [
  1, 5, 10, 20, 25, 30, 50, 100, 200, 1000, 5000,
].map((bps) => bps / 100);
export const PUBLIC_FEE_TIER_PERCENTS: number[] = [1, 30, 100, 200].map(
  (bps) => bps / 100,
);

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

// bTokens and banks
export const hasBTokenAndBankForToken = (
  token: Token,
  appData: AppData,
): boolean => !!appData.bankMap[token.coinType];

export type GetBTokenAndBankForTokenResult = {
  bToken: Token;
  bankId: string;
};
export const getBTokenAndBankForToken = async (
  token: Token,
  suiClient: SuiClient,
  appData: AppData,
): Promise<GetBTokenAndBankForTokenResult> => {
  const existingBank = appData.bankMap[token.coinType];
  if (!existingBank) throw new Error("Bank not found");

  const coinMetadata = await suiClient.getCoinMetadata({
    coinType: existingBank.bTokenType,
  });
  if (!coinMetadata) throw new Error("Coin metadata not found");

  return {
    bToken: getToken(existingBank.bTokenType, coinMetadata),
    bankId: existingBank.id,
  };
};

export type CreateBTokenAndBankForTokenResult = {
  createBTokenResult: CreateCoinResult;
  bToken: Token;
  createBankRes: SuiTransactionBlockResponse;
  bankId: string;
};
export const createBTokenAndBankForToken = async (
  token: Token,
  steammClient: SteammSDK,
  appData: AppData,
  address: string,
  signExecuteAndWaitForTransaction: WalletContext["signExecuteAndWaitForTransaction"],
): Promise<CreateBTokenAndBankForTokenResult> => {
  if (hasBTokenAndBankForToken(token, appData))
    throw new Error("BToken and bank already exist for token");

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
  // Note: If bank creation fails, a new bToken will be created next time
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

  return {
    createBTokenResult,
    bToken: createdBToken,
    createBankRes,
    bankId: createdBankId,
  };
};

// LP token
export const createLpToken = async (
  bTokens: [Token, Token],
  address: string,
  signExecuteAndWaitForTransaction: WalletContext["signExecuteAndWaitForTransaction"],
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
export type CreatePoolAndDepositInitialLiquidityResult = {
  res: SuiTransactionBlockResponse;
  poolId: string;
};
export const createPoolAndDepositInitialLiquidity = async (
  tokens: [Token, Token],
  values: [string, string],
  quoterId: QuoterId,
  cpmmOffset: bigint | undefined,
  oracleV2Amplifier: number | undefined,
  feeTierPercent: number,
  bTokens: [Token, Token],
  bankIds: [string, string],
  createLpTokenResult: CreateCoinResult,
  burnLpTokens: boolean,
  steammClient: SteammSDK,
  appData: AppData,
  address: string,
  signExecuteAndWaitForTransaction: WalletContext["signExecuteAndWaitForTransaction"],
): Promise<CreatePoolAndDepositInitialLiquidityResult> => {
  console.log(
    "[createPoolAndDepositInitialLiquidity] Creating pool and depositing initial liquidity",
    {
      tokens,
      values,
      quoterId,
      cpmmOffset,
      oracleV2Amplifier,
      feeTierPercent,
      bTokens,
      bankIds,
      createLpTokenResult,
      burnLpTokens,
    },
  );

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
    if (!oracleV2Amplifier)
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
      offset: BigInt(cpmmOffset ?? 0),
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
      amplifier: BigInt(oracleV2Amplifier!), // Checked above
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
    steammClient.sdkOptions.packages.suilend.config!;

  const [lpCoin] = Codegen.PoolScriptV2.depositLiquidity(
    transaction,
    [
      lendingMarketType,
      tokens[0].coinType,
      tokens[1].coinType,
      bTokens[0].coinType,
      bTokens[1].coinType,
      {
        [QuoterId.CPMM]: `${steammClient.sdkOptions.packages.steamm.config!.quoterIds.cpmm}::cpmm::CpQuoter`,
        [QuoterId.ORACLE]: `${
          steammClient.sdkOptions.packages.steamm.config!.quoterIds.omm
        }::omm::OracleQuoter`,
        [QuoterId.ORACLE_V2]: `${
          steammClient.sdkOptions.packages.steamm.config!.quoterIds.ommV2
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
    steammClient.scriptInfo.publishedAt,
  );
  transaction.transferObjects([coinA, coinB], address);
  transaction.transferObjects([lpCoin], !burnLpTokens ? address : BURN_ADDRESS); // Burn LP tokens if `burnLpTokens` is true

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
