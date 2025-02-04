import { SteammSDK } from "../src/sdk";
import { STEAMM_TESTNET_PKG_ID, SUILEND_TESTNET_PKG_ID } from "../src/testnet/testnet";

async function quoteRedeem() {
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

  const pools = await sdk.getPools();

  const quote = await sdk.Pool.quoteRedeem({
      pool: pools[0].poolId,
      lpTokens: BigInt("1000000000000000000"),
    },
  );

  console.log(quote);
}

quoteRedeem();
