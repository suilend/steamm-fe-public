import { ParsedKeypair, decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import dotenv from "dotenv";

import { MAINNET_CONFIG, STEAMM_BETA_PKG_ID, SteammSDK } from "../../src";

dotenv.config();

const suiPrivateKey = process.env.MY_PRIVATE_KEY;

if (!suiPrivateKey) {
  throw new Error("MY_PRIVATE_KEY is missing in the .env file");
}

const SUI_COIN_TYPE =
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI";

const USDC_COIN_TYPE =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";

async function swap(suiPrivateKey: string) {
  // Create the keypair from the decoded private key
  const decodedKey: ParsedKeypair = decodeSuiPrivateKey(suiPrivateKey);
  const keypair = Ed25519Keypair.fromSecretKey(decodedKey.secretKey);

  const sdk = new SteammSDK(MAINNET_CONFIG);

  const pool = (await sdk.getPools([SUI_COIN_TYPE, USDC_COIN_TYPE]))[0];
  sdk.signer = keypair;
  const tx = new Transaction();

  const suiCoin = tx.object("<ADD_SUI_COIN_HERE>");
  const usdcCoin = tx.object("<ADD_USDC_COIN_HERE>");

  await sdk.Pool.swap(tx, {
    pool: pool.poolId,
    coinTypeA: `${STEAMM_BETA_PKG_ID}::usdc::USDC`,
    coinTypeB: `${STEAMM_BETA_PKG_ID}::sui::SUI`,
    coinA: usdcCoin,
    coinB: suiCoin,
    a2b: false,
    amountIn: BigInt("10000000"),
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
