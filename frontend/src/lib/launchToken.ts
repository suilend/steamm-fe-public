import { WalletContext } from "@suilend/frontend-sui-next";

import { QuoterId } from "@/lib/types";

import { CreateCoinResult, createCoin, generate_bytecode } from "./createCoin";

// Token
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
