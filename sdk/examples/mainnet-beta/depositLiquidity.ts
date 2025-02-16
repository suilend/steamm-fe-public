import { ParsedKeypair, decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import dotenv from "dotenv";

import { BETA_CONFIG, SteammSDK } from "../../src";

dotenv.config();

const SEND_COIN_TYPE =
  "0xb45fcfcc2cc07ce0702cc2d229621e046c906ef14d9b25e8e4d25f6e8763fef7::send::SEND";

const USDC_COIN_TYPE =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";

async function depositLiquidity(suiPrivateKey: string) {
  // Create the keypair from the decoded private key
  const decodedKey: ParsedKeypair = decodeSuiPrivateKey(suiPrivateKey);
  const keypair = Ed25519Keypair.fromSecretKey(decodedKey.secretKey);

  const sdk = new SteammSDK(BETA_CONFIG);

  const pool = (await sdk.getPools([SEND_COIN_TYPE, USDC_COIN_TYPE]))[0];

  sdk.signer = keypair;
  const tx = new Transaction();

  const maxSend = BigInt("1000000");
  const maxUsdc = BigInt("100");

  const sendCoin = coinWithBalance({
    balance: maxSend,
    type: SEND_COIN_TYPE,
    useGasCoin: false,
  })(tx);

  const usdcCoin = coinWithBalance({
    balance: maxUsdc,
    type: USDC_COIN_TYPE,
    useGasCoin: false,
  })(tx);

  await sdk.Pool.depositLiquidityEntry(tx, {
    pool: pool.poolId,
    coinTypeA: `${SEND_COIN_TYPE}`,
    coinTypeB: `${USDC_COIN_TYPE}`,
    coinA: sendCoin,
    coinB: usdcCoin,
    maxA: maxSend,
    maxB: maxUsdc,
  });

  tx.transferObjects([sendCoin, usdcCoin], sdk.senderAddress);

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

const suiPrivateKey = process.env.MY_PRIVATE_KEY;

if (!suiPrivateKey) {
  throw new Error("MY_PRIVATE_KEY is missing in the .env file");
}

depositLiquidity(suiPrivateKey);
