import { ParsedKeypair, decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import dotenv from "dotenv";

import { BETA_CONFIG, SteammSDK } from "../../src";

import { createBankAndBTokenHelper, createPoolHelper } from "./utils";

dotenv.config();

const suiPrivateKey = process.env.MY_PRIVATE_KEY;

if (!suiPrivateKey) {
  throw new Error("MY_PRIVATE_KEY is missing in the .env file");
}

async function createPool(suiPrivateKey: string) {
  // Create the keypair from the decoded private key
  const decodedKey: ParsedKeypair = decodeSuiPrivateKey(suiPrivateKey);
  const keypair = Ed25519Keypair.fromSecretKey(decodedKey.secretKey);

  const sdk = new SteammSDK(BETA_CONFIG);

  sdk.signer = keypair;
  const bSuiData = await createBankAndBTokenHelper(
    sdk,
    "coin symbol", // TODO
    "coin type", // TODO
    "coin meta", // TODO
  );
  console.log("bSuiData:", bSuiData);

  const bUsdcData = await createBankAndBTokenHelper(
    sdk,
    "coin symbol", // TODO
    "coin type", // TODO
    "coin meta", // TODO
  );
  console.log("bUsdcData:", bUsdcData);

  const lpData = await createPoolHelper(sdk, bSuiData, bUsdcData);
  console.log("lpData:", bUsdcData);
}

createPool(suiPrivateKey);
