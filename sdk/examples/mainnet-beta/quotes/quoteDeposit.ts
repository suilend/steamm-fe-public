import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import { BETA_CONFIG, SteammSDK } from "../../../src";

const SUI_COIN_TYPE =
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI";

const USDC_COIN_TYPE =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";

async function quoteDeposit(keypair: Ed25519Keypair) {
  const sdk = new SteammSDK(BETA_CONFIG);

  const pool = (await sdk.getPoolData([SUI_COIN_TYPE, USDC_COIN_TYPE]))[0];
  sdk.senderAddress = keypair.getPublicKey().toSuiAddress();

  const quote = await sdk.PoolManager.quoteDeposit({
    pool: pool.poolId,
    maxA: BigInt("100000"),
    maxB: BigInt("100"),
  });

  console.log(quote);
}

quoteDeposit(new Ed25519Keypair());
