import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey, ParsedKeypair } from "@mysten/sui/cryptography";
import { SteammSDK } from "../src/sdk";
import { Transaction } from "@mysten/sui/transactions";
import dotenv from "dotenv";
import { STEAMM_PKG_ID, SUILEND_PKG_ID } from "../src/testnet/testnet";
import { getTestSui, getTestUsdc } from "../src/testnet/utils";

dotenv.config();

const suiPrivateKey = process.env.PRIVATE_KEY;

if (!suiPrivateKey) {
  throw new Error("PRIVATE_KEY is missing in the .env file");
}

async function swap(suiPrivateKey: string) {
  // Create the keypair from the decoded private key
  const decodedKey: ParsedKeypair = decodeSuiPrivateKey(suiPrivateKey);
  const keypair = Ed25519Keypair.fromSecretKey(decodedKey.secretKey);

  const sdk = new SteammSDK({
    fullRpcUrl: "https://fullnode.testnet.sui.io:443",
    steamm_config: {
      package_id: STEAMM_PKG_ID,
      published_at: STEAMM_PKG_ID,
    },
    suilend_config: {
      package_id: SUILEND_PKG_ID,
      published_at: SUILEND_PKG_ID,
    },
  });

  const pools = await sdk.getPools();
  sdk.signer = keypair;
  const tx = new Transaction();

  const suiCoinLiq = getTestSui(tx, 1000000000000000000);
  const usdcCoinLiq = getTestUsdc(tx, 1000000000000000000);

  await sdk.Pool.depositLiquidityEntry(
    {
      pool: pools[0].poolId,
      coinTypeA: `${STEAMM_PKG_ID}::usdc::USDC`,
      coinTypeB: `${STEAMM_PKG_ID}::sui::SUI`,
      coinObjA: getTestUsdc(tx, 1000000000000000000),
      coinObjB: getTestSui(tx, 1000000000000000000),
      maxA: BigInt("1000000000000000000"),
      maxB: BigInt("1000000000000000000"),
    },
    tx
  );

  tx.transferObjects([suiCoinLiq, usdcCoinLiq], sdk.senderAddress);

  const suiCoin = getTestSui(tx, 10000000000000);
  const usdcCoin = getTestUsdc(tx, 0);

  await sdk.Pool.swapEntry(
    {
      pool: pools[0].poolId,
      coinTypeA: `${STEAMM_PKG_ID}::usdc::USDC`,
      coinTypeB: `${STEAMM_PKG_ID}::sui::SUI`,
      coinAObj: usdcCoin,
      coinBObj: suiCoin,
      a2b: false,
      amountIn: BigInt("10000000000000"),
      minAmountOut: BigInt("0"),
    },
    tx
  );

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
}

swap(suiPrivateKey);
