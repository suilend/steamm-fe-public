import { ObjectOwner } from "@mysten/sui/client";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { normalizeSuiAddress, toHex } from "@mysten/sui/utils";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

import {
  SdkOptions,
  SteammSDK,
  SuiAddressType,
  parseErrorCode,
} from "../../src";
import {
  GLOBAL_ADMIN_ID,
  LENDING_MARKET_ID,
  LENDING_MARKET_TYPE,
  ORACLES_PKG_ID,
  ORACLE_ADMIN_CAP_ID,
  ORACLE_REGISTRY_ID,
  PYTH_PKG_ID,
  REGISTRY_ID,
  STEAMM_PKG_ID,
  STEAMM_SCRIPT_PKG_ID,
  SUILEND_PKG_ID,
} from "../packages";

import { createCoinBytecode, getTreasuryAndCoinMeta } from "./coinGen";
import { createBToken2, createLpToken2 } from "./createHelper";

let feedIdCounter = 0;

export function testConfig(): SdkOptions {
  return {
    fullRpcUrl: "http://127.0.0.1:9000",
    enableTestMode: true,
    steammConfig: {
      packageId: STEAMM_PKG_ID,
      publishedAt: STEAMM_PKG_ID,
      config: {
        registryId: REGISTRY_ID,
        globalAdmin: GLOBAL_ADMIN_ID,
        quoterSourcePkgs: {
          cpmm: STEAMM_PKG_ID,
          omm: STEAMM_PKG_ID,
        },
      },
    },
    suilendConfig: {
      packageId: SUILEND_PKG_ID,
      publishedAt: SUILEND_PKG_ID,
      config: {
        lendingMarketId: LENDING_MARKET_ID,
        lendingMarketType: LENDING_MARKET_TYPE,
      },
    },
    steammScriptConfig: {
      packageId: STEAMM_SCRIPT_PKG_ID,
      publishedAt: STEAMM_SCRIPT_PKG_ID,
    },
    oracleConfig: {
      packageId: ORACLES_PKG_ID,
      publishedAt: ORACLES_PKG_ID,
      config: {
        oracleRegistryId: ORACLE_REGISTRY_ID,
      },
    },
  };
}

export interface CoinData {
  treasury: string;
  coinMeta: string;
  coinType: string;
  btreasury: string;
  bTokenmeta: string;
  btokenType: string;
  bTokenSymbol: string;
}

export interface LpData {
  lpTreasuryId: string;
  lpTokenType: string;
  lpMetadataId: string;
}

export async function createCoinTx(
  tx: Transaction,
  coinSymbol: string,
  sender: SuiAddressType,
): Promise<Transaction> {
  const bytecode = await createCoinBytecode(
    coinSymbol.toUpperCase().replace(/\s+/g, "_"),
    coinSymbol.toLowerCase().replace(/\s+/g, "_"),
    coinSymbol,
    `Coin${coinSymbol}`,
    `Coin ${coinSymbol}`,
    "",
  );

  // Step 1: Create the coin
  const [upgradeCap] = tx.publish({
    modules: [[...bytecode]],
    dependencies: [normalizeSuiAddress("0x1"), normalizeSuiAddress("0x2")],
  });

  tx.transferObjects([upgradeCap], tx.pure.address(sender));

  return tx;
}

export async function createCoinHelper(
  sdk: SteammSDK,
  coinSymbol: string,
  tx: Transaction = new Transaction(),
): Promise<[string, string, string]> {
  await createCoinTx(tx, coinSymbol, sdk.senderAddress);

  const txResponse = await sdk.fullClient.signAndExecuteTransaction({
    transaction: tx,
    signer: sdk.signer!,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 500));

  return getTreasuryAndCoinMeta(txResponse);
}

export async function createCoinAndBankHelper(
  sdk: SteammSDK,
  coinSymbol: string,
): Promise<CoinData> {
  const [treasury, coinMeta, coinType] = await createCoinHelper(
    sdk,
    coinSymbol,
  );

  const [btreasury, bTokenmeta, btokenType] = await createBTokenHelper(
    sdk,
    coinSymbol,
    coinType,
    coinMeta,
  );

  const bTokenSymbol = `b${coinSymbol}`;

  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    treasury,
    coinMeta,
    coinType,
    btreasury,
    bTokenmeta,
    btokenType,
    bTokenSymbol,
  };
}

export async function createBTokenHelper(
  sdk: SteammSDK,
  coinSymbol: string,
  coinType: string,
  coinMeta: string,
): Promise<[string, string, string]> {
  const tx = await createBToken2(coinType, coinSymbol, sdk.senderAddress);

  const coinTxResponse = await sdk.fullClient.signAndExecuteTransaction({
    transaction: tx,
    signer: sdk.signer!,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  const [bTokenTreasuryId, bTokenMetadataId, bTokenTokenType] =
    getTreasuryAndCoinMeta(coinTxResponse);

  const newBankTx = new Transaction();

  await sdk.Bank.createBank(newBankTx, {
    coinType: coinType,
    coinMetaT: coinMeta,
    bTokenTreasuryId,
    bTokenMetadataId,
    bTokenTokenType,
  });

  const newBankTxResponse = await sdk.fullClient.signAndExecuteTransaction({
    transaction: newBankTx,
    signer: sdk.signer!,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  return [bTokenTreasuryId, bTokenMetadataId, bTokenTokenType];
}

export async function createPoolHelper(
  sdk: SteammSDK,
  coinAData: CoinData,
  coinBData: CoinData,
): Promise<LpData> {
  const tx = await createLpToken2(
    coinAData.bTokenSymbol,
    coinBData.bTokenSymbol,
    sdk.senderAddress,
  );

  const coinTxResponse = await sdk.fullClient.signAndExecuteTransaction({
    transaction: tx,
    signer: sdk.signer!,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 500));

  const [lpTreasuryId, lpMetadataId, lpTokenType] =
    getTreasuryAndCoinMeta(coinTxResponse);

  const newPoolTx = new Transaction();

  await sdk.Pool.createPoolAndShare(newPoolTx, {
    type: "ConstantProduct",
    lpTreasuryId,
    lpMetadataId,
    lpTokenType,
    bTokenTypeA: coinAData.btokenType,
    bTokenTypeB: coinBData.btokenType,
    swapFeeBps: BigInt(100),
    offset: BigInt(0),
    bTokenMetaA: coinAData.bTokenmeta,
    bTokenMetaB: coinBData.bTokenmeta,
  });

  const newPoolTxResponse = await sdk.fullClient.signAndExecuteTransaction({
    transaction: newPoolTx,
    signer: sdk.signer!,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    lpTreasuryId,
    lpTokenType,
    lpMetadataId,
  };
}

export function createPythPrice(
  sdk: SteammSDK,
  tx: Transaction,
  args: {
    price: bigint;
    expo: number;
    idx: number;
  },
) {
  return tx.moveCall({
    target: `${sdk.sdkOptions.suilendConfig.publishedAt}::setup::new_price_info_obj`,
    arguments: [
      tx.pure.u64(args.price),
      tx.pure.u8(args.expo),
      tx.pure.u8(args.idx),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
}

export async function createOraclePoolHelper(
  sdk: SteammSDK,
  coinAData: CoinData,
  coinBData: CoinData,
): Promise<LpData> {
  const tx = await createLpToken2(
    coinAData.bTokenSymbol,
    coinBData.bTokenSymbol,
    sdk.senderAddress,
  );

  const coinTxResponse = await sdk.fullClient.signAndExecuteTransaction({
    transaction: tx,
    signer: sdk.signer!,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 500));

  const [lpTreasuryId, lpMetadataId, lpTokenType] =
    getTreasuryAndCoinMeta(coinTxResponse);

  const newPoolTx = new Transaction();

  const oracleIndexA = feedIdCounter++;
  const oracleIndexB = feedIdCounter++;
  const priceObjA = createPythPrice(sdk, newPoolTx, {
    price: BigInt("1"),
    expo: 1,
    idx: oracleIndexA,
  });

  // Note: its u8 so only works until 255
  const oracleIndexAByteArray = [oracleIndexA, ...Array(31).fill(0)];
  const oracleIndexBByteArray = [oracleIndexB, ...Array(31).fill(0)];

  const priceObjB = createPythPrice(sdk, newPoolTx, {
    price: BigInt("1"),
    expo: 1,
    idx: oracleIndexB,
  });

  newPoolTx.moveCall({
    target: `${sdk.sdkOptions.oracleConfig.publishedAt}::oracles::add_pyth_oracle`,
    arguments: [
      newPoolTx.object(ORACLE_REGISTRY_ID),
      newPoolTx.object(ORACLE_ADMIN_CAP_ID),
      priceObjA,
    ],
  });

  newPoolTx.moveCall({
    target: `${sdk.sdkOptions.oracleConfig.publishedAt}::oracles::add_pyth_oracle`,
    arguments: [
      newPoolTx.object(ORACLE_REGISTRY_ID),
      newPoolTx.object(ORACLE_ADMIN_CAP_ID),
      priceObjB,
    ],
  });

  newPoolTx.moveCall({
    target: `0x2::transfer::public_share_object`,
    typeArguments: [`${PYTH_PKG_ID}::price_info::PriceInfoObject`],
    arguments: [priceObjA],
  });
  newPoolTx.moveCall({
    target: `0x2::transfer::public_share_object`,
    typeArguments: [`${PYTH_PKG_ID}::price_info::PriceInfoObject`],
    arguments: [priceObjB],
  });

  await sdk.Pool.createPoolAndShare(newPoolTx, {
    type: "Oracle",
    oracleIndexA: BigInt(oracleIndexA),
    oracleIndexB: BigInt(oracleIndexB),
    bTokenMetaA: coinAData.bTokenmeta,
    bTokenMetaB: coinBData.bTokenmeta,
    bTokenTypeA: coinAData.btokenType,
    bTokenTypeB: coinBData.btokenType,
    lpTreasuryId,
    lpMetadataId,
    lpTokenType,
    coinTypeA: coinAData.coinType,
    coinTypeB: coinBData.coinType,
    swapFeeBps: BigInt("100"),
    coinMetaA: coinAData.coinMeta,
    coinMetaB: coinBData.coinMeta,
  });

  const newPoolTxResponse = await sdk.fullClient.signAndExecuteTransaction({
    transaction: newPoolTx,
    signer: sdk.signer!,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  const priceInfoObjects = newPoolTxResponse.objectChanges!.filter((change) => {
    if (change.type === "created") {
      return change.objectType.includes("price_info::PriceInfoObject");
    }
    return false;
  }) as {
    digest: string;
    objectId: string;
    objectType: string;
    owner: ObjectOwner;
    sender: string;
    type: "created";
    version: string;
  }[];

  if (priceInfoObjects.length !== 2) {
    throw new Error(
      `Expected 2 price info objects, got ${priceInfoObjects.length}`,
    );
  }

  sdk.mockOracleObjectForTesting(
    toHex(new Uint8Array(oracleIndexAByteArray as number[])),
    priceInfoObjects[0].objectId,
  );
  sdk.mockOracleObjectForTesting(
    toHex(new Uint8Array(oracleIndexBByteArray as number[])),
    priceInfoObjects[1].objectId,
  );

  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    lpTreasuryId,
    lpMetadataId,
    lpTokenType,
  };
}

export function mintCoin(
  tx: Transaction,
  coinType: string,
  treasuryCap: string,
  amount: string = "10000000000000000",
): TransactionResult {
  return tx.moveCall({
    target: "0x2::coin::mint",
    typeArguments: [coinType],
    arguments: [
      tx.object(treasuryCap),
      tx.pure.u64(BigInt("10000000000000000")),
    ],
  });
}

export async function initLendingNoOp(sdk: SteammSDK, coinType: string) {
  const banks = await sdk.getBanks();
  const bankId = banks[coinType].bankId;
  const bankState = await sdk.fullClient.getObject({
    id: bankId,
    options: {
      showContent: true,
      showType: true,
      showOwner: true,
      showPreviousTransaction: true,
      showStorageRebate: true,
    },
  });

  if ((bankState.data?.content as any).fields.lending === null) {
    const initLendTx = new Transaction();
    await sdk.Bank.initLending(initLendTx, {
      bankId,
      targetUtilisationBps: 8000,
      utilisationBufferBps: 1000,
    });

    const devResult = await sdk.fullClient.devInspectTransactionBlock({
      transactionBlock: initLendTx,
      sender: sdk.senderAddress,
    });

    if (devResult.error) {
      console.log("bankID: ", bankId);
      const errCode = parseErrorCode(devResult);
      console.log(errCode);
      console.log("DevResult failed.");
      throw new Error(devResult.error);
    }

    const txResult = await sdk.fullClient.signAndExecuteTransaction({
      transaction: initLendTx,
      signer: sdk.signer!,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    if (txResult.effects?.status?.status !== "success") {
      console.log("Transaction failed");
      throw new Error(
        `Transaction failed: ${JSON.stringify(txResult.effects)}`,
      );
    }

    console.log("Init lending succeeded for", coinType);
    return txResult;
  }

  console.log("Lending already initialized for", coinType);
  return null;
}
