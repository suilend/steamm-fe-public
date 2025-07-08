import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";

import { QuoterId } from "@suilend/steamm-sdk";
import {
  formatNumber,
  keypairSignExecuteAndWaitForTransaction,
} from "@suilend/sui-fe";

import {
  CreateCoinResult,
  createCoin,
  generate_bytecode,
} from "@/lib/createCoin";

// Token
export const CREATE_TOKEN_PACKAGE_ID =
  "0xf4054b4c967ea64173453f593a0ec98cb6aa351635cbc412f4fdf5f804bb98db";

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
  keypair: Ed25519Keypair,
  suiClient: SuiClient,
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
      { isCreateToken: true },
    ),
    keypair,
    suiClient,
    { isCreateToken: true },
  );

  return createTokenResult;
};

export type MintTokenResult = { res: SuiTransactionBlockResponse };
export const mintToken = async (
  createTokenResult: CreateCoinResult,
  supply: number,
  decimals: number,
  nonMintable: boolean,
  keypair: Ed25519Keypair,
  suiClient: SuiClient,
): Promise<MintTokenResult> => {
  console.log("[mintToken] Minting");

  const supplyAmount = BigInt(
    new BigNumber(supply)
      .times(10 ** decimals)
      .integerValue(BigNumber.ROUND_DOWN)
      .toString(),
  );

  const transaction = new Transaction();
  transaction.setSender(keypair.toSuiAddress());

  // Mint
  const mintedCoin = transaction.moveCall({
    target: `${CREATE_TOKEN_PACKAGE_ID}::token_emitter::mint`,
    arguments: [
      transaction.object(createTokenResult.treasuryCapId),
      transaction.pure.u64(supplyAmount),
    ],
    typeArguments: [createTokenResult.coinType],
  });

  // Transfer the minted coins to the creator's address
  transaction.transferObjects([mintedCoin], keypair.toSuiAddress());

  // Make the token non-mintable
  transaction.transferObjects(
    [
      transaction.object(createTokenResult.treasuryCapId),
      transaction.object(createTokenResult.upgradeCapId),
    ],
    nonMintable ? BURN_ADDRESS : keypair.toSuiAddress(),
  );

  const res = await keypairSignExecuteAndWaitForTransaction(
    transaction,
    keypair,
    suiClient,
  );

  return { res };
};

// Pool
export const DEPOSITED_TOKEN_PERCENT = 100;
export const INITIAL_TOKEN_FDV_USD = 1000;

export const FEE_TIER_PERCENT = 0.3;
export const QUOTER_ID = QuoterId.CPMM;
