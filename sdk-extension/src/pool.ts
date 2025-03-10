import { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import { SteammSDK, SuiAddressType } from "@suilend/steamm-sdk";

import { createCoinBytecode, getTreasuryAndCoinMeta } from "./coinGen";

import { CoinData, LP_TOKEN_URI, LpData } from ".";

export async function createPool(
  sdk: SteammSDK,
  args: {
    bATokenData: CoinData;
    bBTokenData: CoinData;
    swapFeeBps: bigint;
  },
): Promise<LpData> {
  console.log("Sender Address: ", sdk.senderAddress);

  const lpData = await createPoolHelper(
    sdk,
    args.bATokenData,
    args.bBTokenData,
    args.swapFeeBps,
  );
  console.log("lpData:", lpData);
  return lpData;
}

export async function createPoolHelper(
  sdk: SteammSDK,
  coinAData: CoinData,
  coinBData: CoinData,
  swapFeeBps: bigint = BigInt(100),
): Promise<LpData> {
  const coinGenTx = await createLpToken(
    coinAData.bTokenSymbol,
    coinBData.bTokenSymbol,
    sdk.senderAddress,
  );

  const inspectResults = await sdk.fullClient.devInspectTransactionBlock({
    transactionBlock: coinGenTx,
    sender: sdk.senderAddress,
    additionalArgs: { showRawTxnDataAndEffects: true },
  });

  if (inspectResults.error) {
    console.log(inspectResults);
    throw new Error(
      `DevInspect Failed - while creating LP token for ${coinAData.bTokenSymbol}-${coinBData.bTokenSymbol}`,
    );
  }

  const coinTxResponse = await sdk.fullClient.signAndExecuteTransaction({
    transaction: coinGenTx,
    signer: sdk.signer!,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  if (coinTxResponse.errors) {
    console.log(coinTxResponse);
    throw new Error(
      `Transaction Failed - while creating LP token for ${coinAData.bTokenSymbol}-${coinBData.bTokenSymbol}`,
    );
  }

  console.log(`CoinGen Transaction successful`);

  await new Promise((resolve) => setTimeout(resolve, 500));

  const [lpTreasuryId, lpMetadataId, lpTokenType] =
    getTreasuryAndCoinMeta(coinTxResponse);

  const newPoolTx = new Transaction();

  await sdk.Pool.createPool(newPoolTx, {
    lpTreasuryId,
    lpMetadataId,
    lpTokenType,
    btokenTypeA: coinAData.btokenType,
    btokenTypeB: coinBData.btokenType,
    swapFeeBps,
    offset: BigInt(0),
    coinMetaA: coinAData.bTokenmeta,
    coinMetaB: coinBData.bTokenmeta,
  });

  const inspectResults2 = await sdk.fullClient.devInspectTransactionBlock({
    transactionBlock: newPoolTx,
    sender: sdk.senderAddress,
    additionalArgs: { showRawTxnDataAndEffects: true },
  });

  if (inspectResults2.error) {
    console.log(inspectResults2);
    throw new Error(
      `DevInspect Failed - while creating Pool for ${coinAData.bTokenSymbol}-${coinBData.bTokenSymbol}`,
    );
  }

  const newPoolTxResponse = await sdk.fullClient.signAndExecuteTransaction({
    transaction: newPoolTx,
    signer: sdk.signer!,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  if (newPoolTxResponse.errors) {
    console.log(newPoolTxResponse);
    throw new Error(
      `Transaction Failed - while creating Pool for ${coinAData.bTokenSymbol}-${coinBData.bTokenSymbol}`,
    );
  }

  console.log(`Pool Transaction successful: ${newPoolTxResponse.digest}`);

  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    lpTreasuryId,
    lpMetadataId,
    lpTokenType,
  };
}

export async function createLpToken(
  coinASymbol: string,
  coinBSymbol: string,
  sender: SuiAddressType,
): Promise<Transaction> {
  // Construct LP token name
  const lpName = `STEAMM_LP ${coinASymbol}-${coinBSymbol}`;

  // Construct LP token symbol
  const lpSymbol = `STEAMM LP ${coinASymbol}-${coinBSymbol}`;

  // LP token description
  const lpDescription = "STEAMM LP Token";

  const structName = `STEAMM_LP_${coinASymbol}_${coinBSymbol}`;
  const moduleName = `steamm_lp_${coinASymbol}_${coinBSymbol}`;

  const bytecode = await createCoinBytecode(
    structName.toUpperCase().replace(/\s+/g, "_"),
    moduleName.toLowerCase().replace(/\s+/g, "_"),
    lpSymbol,
    lpName,
    lpDescription,
    LP_TOKEN_URI,
  );

  // Step 1: Create the coin
  const tx = new Transaction();
  const [upgradeCap] = tx.publish({
    modules: [[...bytecode]],
    dependencies: [normalizeSuiAddress("0x1"), normalizeSuiAddress("0x2")],
  });

  tx.transferObjects([upgradeCap], tx.pure.address(sender));

  return tx;
}
