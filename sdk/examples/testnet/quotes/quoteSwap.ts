import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SteammSDK } from "../../../src";
import { STEAMM_TESTNET_PKG_ID, SUILEND_TESTNET_PKG_ID } from "../../../src/test-config/testnet";

async function quoteSwap(keypair: Ed25519Keypair) {
  const sdk = new SteammSDK({
    fullRpcUrl: "https://fullnode.testnet.sui.io:443",
    steamm_config: {
      package_id: STEAMM_TESTNET_PKG_ID,
      published_at: STEAMM_TESTNET_PKG_ID,
    },
    suilend_config: {
      package_id: SUILEND_TESTNET_PKG_ID,
      published_at: SUILEND_TESTNET_PKG_ID,
    },
  });

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
