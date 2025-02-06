import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SteammSDK } from "../../../src";
import { BETA_CONFIG } from "../../../src/test-config/mainnet";

async function quoteSwap(keypair: Ed25519Keypair) {
  const sdk = new SteammSDK(BETA_CONFIG);

  sdk.senderAddress = keypair.getPublicKey().toSuiAddress();

  const pools = await sdk.getPools();

  const quote = await sdk.Pool.quoteSwap({
      pool: pools[0].poolId,
      a2b: false,
      amountIn: BigInt("10000000000000"),
    },
  );

  console.log(quote);
}

quoteSwap(new Ed25519Keypair());
