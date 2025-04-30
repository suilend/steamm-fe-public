import init, {
  update_constants,
  update_identifiers,
} from "@mysten/move-bytecode-template";
import { bcs } from "@mysten/sui/bcs";
import {
  CoinMetadata,
  SuiClient,
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
  Explorer,
  Token,
  getCoinMetadataMap,
  getToken,
  isSui,
} from "@suilend/frontend-sui";
import { PoolScriptFunctions, SteammSDK } from "@suilend/steamm-sdk";

import { BanksData } from "@/contexts/AppContext";
import { LaunchConfig, TokenCreationStatus } from "@/contexts/LaunchContext";
import { formatFeeTier, formatPair } from "@/lib/format";
import { API_URL } from "@/lib/navigation";
import { showSuccessTxnToast } from "@/lib/toasts";
import { QUOTER_ID_NAME_MAP, QuoterId } from "@/lib/types";

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

const createCoin = async (
  bytecode: Uint8Array<ArrayBufferLike>,
  address: string,
  signExecuteAndWaitForTransaction: (
    transaction: Transaction,
    options?: {
      auction?: boolean;
    },
  ) => Promise<SuiTransactionBlockResponse>,
) => {
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

  return { treasuryCapId, coinType, coinMetadataId, digest: res.digest };
};
type CreateCoinReturnType = Awaited<ReturnType<typeof createCoin>>;

export const createPool = async (
  banksData: BanksData,
  quoterId: QuoterId,
  feeTierPercent: number,
  coinTypes: string[],
  address: string,
  signExecuteAndWaitForTransaction: (
    transaction: Transaction,
    options?: {
      auction?: boolean;
    },
  ) => Promise<SuiTransactionBlockResponse>,
  explorer: Explorer,
  balancesCoinMetadataMap: Record<string, CoinMetadata>,
  suiClient: SuiClient,
  steammClient: SteammSDK,
  values: string[],
  setConfigWrap: (config: Partial<LaunchConfig>) => void,
  mergedConfig: LaunchConfig,
) => {
  if (!address) throw new Error("Wallet not connected");

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

  if (
    mergedConfig.status <= TokenCreationStatus.BTokenCreation ||
    mergedConfig.createBTokenResults === null
  ) {
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
          address,
          signExecuteAndWaitForTransaction,
        );
        createBTokenResults[index] = createBTokenResult;
        mergedConfig.status = TokenCreationStatus.BankCreation;
        mergedConfig.transactionDigests = {
          ...mergedConfig.transactionDigests,
          [TokenCreationStatus.BTokenCreation]: [createBTokenResult.digest],
        };
        mergedConfig.createBTokenResults = createBTokenResults!;
        setConfigWrap({
          status: TokenCreationStatus.BankCreation,
          transactionDigests: {
            ...mergedConfig.transactionDigests,
            [TokenCreationStatus.BTokenCreation]: [createBTokenResult.digest],
          },
        });
      }
    }
  }
  const bankDigests: string[] = [];

  if (
    mergedConfig.status <= TokenCreationStatus.BankCreation ||
    mergedConfig.createBankEvents === null
  ) {
    const bTokens = mergedConfig.createBTokenResults!.map((result, index) =>
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
    if (
      mergedConfig.createBTokenResults!.some((result) => result !== undefined)
    ) {
      const createBanksTransaction = new Transaction();

      for (const index of [0, 1]) {
        if (mergedConfig.createBTokenResults![index] === undefined) continue; // bToken and bank already exist

        console.log(
          "xxx step 2: create bank - index:",
          index,
          "symbol:",
          tokens[index].symbol,
          tokens,
        );
        await steammClient.Bank.createBank(createBanksTransaction, {
          coinType: tokens[index].coinType,
          coinMetaT: tokens[index].id!, // Checked above
          bTokenTreasuryId:
            mergedConfig.createBTokenResults![index].treasuryCapId,
          bTokenTokenType: mergedConfig.createBTokenResults![index].coinType,
          bTokenMetadataId:
            mergedConfig.createBTokenResults![index].coinMetadataId,
        });
      }

      const banksRes = await signExecuteAndWaitForTransaction(
        createBanksTransaction,
      );

      mergedConfig.status = TokenCreationStatus.LpTokenCreation;
      mergedConfig.transactionDigests = {
        ...mergedConfig.transactionDigests,
        [TokenCreationStatus.BankCreation]: [banksRes.digest],
      };
      mergedConfig.createBankEvents = createBankEvents;
      mergedConfig.bTokens = bTokens;
      setConfigWrap({
        status: TokenCreationStatus.LpTokenCreation,
        createBankEvents,
        bTokens,
        transactionDigests: {
          ...mergedConfig.transactionDigests,
          [TokenCreationStatus.BankCreation]: [banksRes.digest],
        },
      });
      createBankEvents.push(
        ...(banksRes.events ?? []).filter((event) =>
          event.type.includes("::bank::NewBankEvent"),
        ),
      );
      bankDigests.push(banksRes.digest);
      console.log("xxx step 2: create bank events:", createBankEvents);
    }
  }

  const bankIds = mergedConfig.createBTokenResults!.map((result, index) => {
    if (result === undefined)
      return banksData.bankMap[tokens[index].coinType].id;
    else {
      const event = mergedConfig.createBankEvents!.find(
        (event) =>
          normalizeStructTag((event.parsedJson as any).event.coin_type.name) ===
          tokens[index].coinType,
      );
      if (!event) throw new Error("Create bank event not found"); // Should not happen

      const id = (event.parsedJson as any).event.bank_id as string;
      return id;
    }
  }) as [string, string];
  console.log("xxx step 2: bankIds:", bankIds);

  if (
    mergedConfig.status <= TokenCreationStatus.LpTokenCreation ||
    mergedConfig.createLpTokenResult === null
  ) {
    // Step 3: Create LP token - one transaction
    console.log(
      "xxx step 3: create lpToken coin - bTokens:",
      mergedConfig.bTokens,
    );
    const createLpTokenResult = await createCoin(
      generate_bytecode(
        getLpTokenModule(mergedConfig.bTokens![0], mergedConfig.bTokens![1]),
        getLpTokenType(mergedConfig.bTokens![0], mergedConfig.bTokens![1]),
        getLpTokenName(mergedConfig.bTokens![0], mergedConfig.bTokens![1]),
        getLpTokenSymbol(mergedConfig.bTokens![0], mergedConfig.bTokens![1]),
        LP_TOKEN_DESCRIPTION,
        LP_TOKEN_IMAGE_URL,
      ),
      address,
      signExecuteAndWaitForTransaction,
    );

    mergedConfig.status = TokenCreationStatus.DepositLiquidity;
    mergedConfig.transactionDigests = {
      ...mergedConfig.transactionDigests,
      [TokenCreationStatus.LpTokenCreation]: [createLpTokenResult.digest],
    };
    mergedConfig.createLpTokenResult = createLpTokenResult;
    setConfigWrap({
      status: TokenCreationStatus.DepositLiquidity,
      createLpTokenResult,
      transactionDigests: {
        ...mergedConfig.transactionDigests,
        [TokenCreationStatus.LpTokenCreation]: [createLpTokenResult.digest],
      },
    });
  }
  // Step 4: Create pool and deposit - one transaction
  const transaction = new Transaction();

  // Step 4.1: Create pool
  console.log(
    "xxx step 4.1: create pool - bTokens:",
    mergedConfig.bTokens,
    "lp token:",
    mergedConfig.createLpTokenResult,
  );

  const createPoolBaseArgs = {
    bTokenTypeA: mergedConfig.bTokens![0].coinType,
    bTokenMetaA: mergedConfig.bTokens![0].id!, // Checked above
    bTokenTypeB: mergedConfig.bTokens![1].coinType,
    bTokenMetaB: mergedConfig.bTokens![1].id!, // Checked above
    lpTreasuryId: mergedConfig.createLpTokenResult!.treasuryCapId,
    lpTokenType: mergedConfig.createLpTokenResult!.coinType,
    lpMetadataId: mergedConfig.createLpTokenResult!.coinMetadataId,
    swapFeeBps: BigInt(feeTierPercent * 100),
  };

  let poolArgs;
  if (quoterId === QuoterId.CPMM) {
    poolArgs = {
      ...createPoolBaseArgs,
      type: "ConstantProduct" as const,
      offset: BigInt(0), // TODO
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
      mergedConfig.bTokens![0].coinType,
      mergedConfig.bTokens![1].coinType,
      {
        [QuoterId.CPMM]: `${steammClient.sdkOptions.steamm_config.config!.quoterSourcePkgs.cpmm}::cpmm::CpQuoter`,
        [QuoterId.ORACLE]: `${
          steammClient.sdkOptions.steamm_config.config!.quoterSourcePkgs.omm
        }::omm::OracleQuoter`,
        [QuoterId.ORACLE_V2]: `${
          steammClient.sdkOptions.steamm_config.config!.quoterSourcePkgs.omm_v2
        }::omm_v2::OracleQuoterV2`,
      }[quoterId],
      mergedConfig.createLpTokenResult!.coinType,
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
    lpTokenType: mergedConfig.createLpTokenResult!.coinType,
    bTokenTypeA: mergedConfig.bTokens![0].coinType,
    bTokenTypeB: mergedConfig.bTokens![1].coinType,
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

  // Get created pool id
  const poolObjectChange: SuiObjectChange | undefined = res.objectChanges?.find(
    (change) =>
      change.type === "created" && change.objectType.includes("::pool::Pool<"),
  );
  if (!poolObjectChange) throw new Error("Pool object change not found");
  if (poolObjectChange.type !== "created")
    throw new Error("Pool object change is not of type 'created'");

  const poolId = poolObjectChange.objectId;

  await fetch(`${API_URL}/steamm/clear-cache`); // Clear cache

  // Update config
  setConfigWrap({
    poolId,
    status: TokenCreationStatus.Success,
    transactionDigests: {
      ...mergedConfig.transactionDigests,
      [TokenCreationStatus.DepositLiquidity]: [res.digest],
    },
  });

  const txUrl = explorer.buildTxUrl(res.digest);

  showSuccessTxnToast(
    `Created ${formatPair(tokens.map((token) => token.symbol))} pool`,
    txUrl,
    {
      description: `Quoter: ${QUOTER_ID_NAME_MAP[quoterId]}, fee tier: ${formatFeeTier(new BigNumber(feeTierPercent))}`,
    },
  );
};
