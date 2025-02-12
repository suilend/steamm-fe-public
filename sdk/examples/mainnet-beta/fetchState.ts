import dotenv from "dotenv";

import { BETA_CONFIG, SteammSDK } from "../../src";

dotenv.config();

async function fetchPool() {
  const sdk = new SteammSDK(BETA_CONFIG);

  const pools = await sdk.getPools();
  const banks = await sdk.getBanks();

  const poolState = await sdk.fullClient.fetchPool(pools[0].poolId);
  console.log(poolState);

  const bankState = await sdk.fullClient.fetchBank(
    Object.values(banks)[0].bankId,
  );
  console.log(bankState);
}

fetchPool();
