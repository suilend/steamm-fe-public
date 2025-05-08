import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";

import { WalletContext } from "@suilend/frontend-sui-next";

import {
  CreateCoinResult,
  createCoin,
  generate_bytecode,
} from "@/lib/createCoin";
import { QuoterId } from "@/lib/types";

// Token
export const BLACKLISTED_WORDS = [
  // Sui
  "sui",
  "suilend",
  "springsui",
  "steamm",
  "root",
  "rootlet",
  "rootlets",
  "send",

  // Test
  "test",
  "temp",
  "dummy",

  // Brands
  "bnb",
  "bn",
  "okx",
  "x",
  "coin",
  "coinbase",

  // Inappropriate
  "anal",
  "anus",
  "ass",
  "asshole",
  "bitch",
  "bitching",
  "boob",
  "boobs",
  "butt",
  "butthole",
  "butts",
  "cheat",
  "cheater",
  "cock",
  "cockhead",
  "cocaine",
  "crack",
  "cracker",
  "cunt",
  "cunty",
  "cum",
  "cumshot",
  "death",
  "dead",
  "die",
  "dick",
  "dickhead",
  "drug",
  "drugs",
  "fake",
  "fraud",
  "fuck",
  "fucker",
  "fucking",
  "hack",
  "hacker",
  "hate",
  "heroin",
  "hitler",
  "hax",
  "haxor",
  "jizz",
  "kill",
  "meth",
  "naked",
  "nazi",
  "nude",
  "nudes",
  "pedo",
  "pedophile",
  "penis",
  "pirate",
  "piracy",
  "porn",
  "porno",
  "pussy",
  "pussycat",
  "racism",
  "racist",
  "scam",
  "scammer",
  "sex",
  "sexism",
  "sexist",
  "shit",
  "shitter",
  "shitting",
  "slut",
  "slutty",
  "sperm",
  "steal",
  "terror",
  "terrorist",
  "thief",
  "thieves",
  "tit",
  "tits",
  "vagina",
  "weed",
  "whore",
  "whoring",
  "xxx",
];

export const DEFAULT_TOKEN_DECIMALS = 6;
export const DEFAULT_TOKEN_SUPPLY = 10 ** 9; // 1B

export const MAX_BASE64_LENGTH = 2 ** 16; // 65,536 characters
export const MAX_FILE_SIZE_BYTES = Math.floor((MAX_BASE64_LENGTH * 3) / 4); // ~49KB to ensure base64 stays under 2^16

export const BURN_ADDRESS =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const getTokenModule = (symbol: string) =>
  symbol.toLowerCase().replace(/\s+/g, "_"); // E.g. pump
const getTokenType = (symbol: string) =>
  symbol.toUpperCase().replace(/\s+/g, "_"); // E.g. PUMP

export const createToken = async (
  name: string,
  symbol: string,
  description: string,
  iconUrl: string,
  decimals: number,
  address: string,
  signExecuteAndWaitForTransaction: WalletContext["signExecuteAndWaitForTransaction"],
): Promise<CreateCoinResult> => {
  console.log("[createToken] Creating token");

  const createTokenResult = await createCoin(
    generate_bytecode(
      getTokenModule(symbol),
      getTokenType(symbol),
      name,
      symbol,
      description,
      iconUrl,
      decimals,
    ),
    address,
    signExecuteAndWaitForTransaction,
  );

  return createTokenResult;
};

export const mintToken = async (
  createTokenResult: CreateCoinResult,
  supply: number,
  decimals: number,
  address: string,
  signExecuteAndWaitForTransaction: WalletContext["signExecuteAndWaitForTransaction"],
): Promise<{ res: SuiTransactionBlockResponse }> => {
  console.log("[mintToken] Minting");

  const supplyAmount = BigInt(
    new BigNumber(supply)
      .times(10 ** decimals)
      .integerValue(BigNumber.ROUND_DOWN)
      .toString(),
  );

  const transaction = new Transaction();

  const mintedCoin = transaction.moveCall({
    target: "0x2::coin::mint",
    arguments: [
      transaction.object(createTokenResult.treasuryCapId),
      transaction.pure.u64(supplyAmount),
    ],
    typeArguments: [createTokenResult.coinType],
  });

  // Transfer the minted coins to the creator's address
  transaction.transferObjects([mintedCoin], address);

  // Make the token non-mintable
  transaction.transferObjects(
    [
      transaction.object(createTokenResult.treasuryCapId),
      transaction.object(createTokenResult.upgradeCapId),
    ],
    BURN_ADDRESS,
  );

  const res = await signExecuteAndWaitForTransaction(transaction);

  return { res };
};

// Pool
export const DEPOSITED_TOKEN_PERCENT = 20;
export const DEPOSITED_QUOTE_ASSET = 1;

export const FEE_TIER_PERCENT = 0.3;
export const QUOTER_ID = QuoterId.CPMM;
