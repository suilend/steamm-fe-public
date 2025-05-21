import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";

import { formatNumber } from "@suilend/frontend-sui";
import { WalletContext } from "@suilend/frontend-sui-next";
import { QuoterId } from "@suilend/steamm-sdk";

import {
  CreateCoinResult,
  createCoin,
  generate_bytecode,
} from "@/lib/createCoin";

// Token
export const LAUNCH_TOKEN_PACKAGE_ID =
  "0xf4054b4c967ea64173453f593a0ec98cb6aa351635cbc412f4fdf5f804bb98db";

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

export const BROWSE_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const BROWSE_FILE_SIZE_ERROR_MESSAGE = `Please upload an image smaller than ${formatNumber(new BigNumber(BROWSE_MAX_FILE_SIZE_BYTES / 1024 / 1024), { dp: 0 })} MB`;

export const BURN_ADDRESS =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const getTokenModule = (symbol: string) =>
  symbol.toLowerCase().replace(/\s+/g, "_"); // E.g. sui
const getTokenType = (symbol: string) =>
  symbol.toUpperCase().replace(/\s+/g, "_"); // E.g. SUI

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
      { isLaunchToken: true },
    ),
    address,
    signExecuteAndWaitForTransaction,
    { isLaunchToken: true },
  );

  return createTokenResult;
};

export type MintTokenResult = { res: SuiTransactionBlockResponse };
export const mintToken = async (
  createTokenResult: CreateCoinResult,
  supply: number,
  decimals: number,
  nonMintable: boolean,
  address: string,
  signExecuteAndWaitForTransaction: WalletContext["signExecuteAndWaitForTransaction"],
): Promise<MintTokenResult> => {
  console.log("[mintToken] Minting");

  const supplyAmount = BigInt(
    new BigNumber(supply)
      .times(10 ** decimals)
      .integerValue(BigNumber.ROUND_DOWN)
      .toString(),
  );

  const transaction = new Transaction();

  const mintedCoin = transaction.moveCall({
    target: `${LAUNCH_TOKEN_PACKAGE_ID}::token_emitter::mint`,
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
    nonMintable ? BURN_ADDRESS : address,
  );

  const res = await signExecuteAndWaitForTransaction(transaction);

  return { res };
};

// Pool
export const DEPOSITED_TOKEN_PERCENT = 100;
export const INITIAL_TOKEN_MC_USD = 1000; // TODO

export const FEE_TIER_PERCENT = 0.3;
export const QUOTER_ID = QuoterId.CPMM;
