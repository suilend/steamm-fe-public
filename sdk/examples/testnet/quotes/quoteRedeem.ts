import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import { SteammSDK, TESTNET_CONFIG } from "../../../src";

async function quoteRedeem(keypair: Ed25519Keypair) {
  const sdk = new SteammSDK(TESTNET_CONFIG);

  sdk.senderAddress = keypair.getPublicKey().toSuiAddress();
  const pools = await sdk.getPools();

  const quote = await sdk.Pool.quoteRedeem({
    pool: pools[0].poolId,
    lpTokens: BigInt("1000000000000000000"),
  });

  console.log(quote);
}

quoteRedeem(new Ed25519Keypair());
