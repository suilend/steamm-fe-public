import { WalletContext } from "@suilend/frontend-sui-next";

import { QuoterId } from "@/lib/types";

import { CreateCoinResult, createCoin, generate_bytecode } from "./createCoin";

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

// export const createToken = async (
//   address: string,
//   signExecuteAndWaitForTransaction: WalletContext["signExecuteAndWaitForTransaction"],
// ): Promise<CreateCoinResult> => {
//   console.log("[createToken] Creating token");

//   // const createLpTokenResult = await createCoin(
//   //   generate_bytecode(
//   //     getLpTokenModule(bTokens[0], bTokens[1]),
//   //     getLpTokenType(bTokens[0], bTokens[1]),
//   //     getLpTokenName(bTokens[0], bTokens[1]),
//   //     getLpTokenSymbol(bTokens[0], bTokens[1]),
//   //     LP_TOKEN_DESCRIPTION,
//   //     LP_TOKEN_IMAGE_URL,
//   //   ),
//   //   address,
//   //   signExecuteAndWaitForTransaction,
//   // );

//   // return createLpTokenResult;
// };

// Pool
export const DEPOSITED_TOKEN_PERCENT = 20;
export const DEPOSITED_QUOTE_ASSET = 1;

export const FEE_TIER_PERCENT = 0.3;
export const QUOTER_ID = QuoterId.CPMM;
