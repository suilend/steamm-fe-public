import { ParsedKeypair, decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import dotenv from "dotenv";

import {
  BETA_CONFIG,
  STEAMM_BETA_PKG_ID,
  SteammSDK,
  TEST_SUI_BETA_TYPE,
  TEST_USDC_BETA_TYPE,
  getTestSui,
  getTestUsdc,
} from "../../src";

dotenv.config();

const suiPrivateKey = process.env.MY_PRIVATE_KEY;

if (!suiPrivateKey) {
  throw new Error("MY_PRIVATE_KEY is missing in the .env file");
}

async function swap(suiPrivateKey: string) {
  // Create the keypair from the decoded private key
  const decodedKey: ParsedKeypair = decodeSuiPrivateKey(suiPrivateKey);
  const keypair = Ed25519Keypair.fromSecretKey(decodedKey.secretKey);

  const sdk = new SteammSDK(BETA_CONFIG);

  const pools = await sdk.getPools([TEST_SUI_BETA_TYPE, TEST_USDC_BETA_TYPE]);
  sdk.signer = keypair;
  const tx = new Transaction();

  const suiCoin = getTestSui(tx, 10000000000000, "mainnet");
  const usdcCoin = getTestUsdc(tx, 0, "mainnet");

  await sdk.Pool.swap(tx, {
    pool: pools[0].poolId,
    coinTypeA: `${STEAMM_BETA_PKG_ID}::usdc::USDC`,
    coinTypeB: `${STEAMM_BETA_PKG_ID}::sui::SUI`,
    coinA: usdcCoin,
    coinB: suiCoin,
    a2b: false,
    amountIn: BigInt("10000000000000"),
    minAmountOut: BigInt("0"),
  });

  tx.transferObjects([suiCoin, usdcCoin], sdk.senderAddress);

  const devResult = await sdk.fullClient.devInspectTransactionBlock({
    transactionBlock: tx,
    sender: sdk.senderAddress,
  });

  if (devResult.error) {
    console.log("DevResult failed.");
    throw new Error(devResult.error);
  } else {
    console.log(devResult);
    console.log("DevResult success.");
  }

  // Proceed to submit the transaction
  // const txResult = await sdk.fullClient.signAndExecuteTransaction({
  //   transaction: tx,
  //   signer: keypair,
  // });

  // if (txResult.errors) {
  //   console.log(txResult.errors);
  //   throw new Error("Tx Execution failed!");
  // } else {
  //   console.log("Transaction executed successfully:", txResult);
  // }
}

swap(suiPrivateKey);
