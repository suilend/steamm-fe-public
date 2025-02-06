import { decodeSuiPrivateKey, ParsedKeypair } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SteammSDK } from "../../../src";
import { TESTNET_CONFIG } from "../../../src/test-config/testnet";

async function quoteDeposit(keypair: Ed25519Keypair) {
  const sdk = new SteammSDK(TESTNET_CONFIG);

  const pools = await sdk.getPools();
  sdk.senderAddress = keypair.getPublicKey().toSuiAddress();

  const quote = await sdk.Pool.quoteDeposit({
      pool: pools[0].poolId,
      maxA: BigInt("1000000000000000000"),
      maxB: BigInt("1000000000000000000"),
    },
  );

  console.log(quote);
}

quoteDeposit(new Ed25519Keypair());
