import { ParsedKeypair, decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import dotenv from "dotenv";

import { BETA_CONFIG, STEAMM_BETA_PKG_ID, SteammSDK } from "../../src";

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

  const sdk = new SteammSDK(BETA_CONFIG);

  sdk.signer = keypair;

  const { route, quote } = await sdk.Router.getBestSwapRoute(
    {
      coinIn: USDC_COIN_TYPE,
      coinOut: SUI_COIN_TYPE,
    },
    BigInt("500"),
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const swapTx = new Transaction();
  const coinIn = swapTx.object(
    "0xb69fa0d44997ee38bd3191dec50f5104638b1ca6bd9244adcace472b543a1e39",
  );

  await sdk.Router.swapWithRoute(swapTx, {
    coinIn: coinIn,
    route,
    quote,
  });

  const callData = swapTx.getData();
  console.log(JSON.stringify(callData));

  const devResult = await sdk.fullClient.devInspectTransactionBlock({
    transactionBlock: swapTx,
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
