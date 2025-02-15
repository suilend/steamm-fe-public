import {
  SuiObjectChange,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import { SteammSDK, SuiAddressType } from "../src";
import { createCoinBytecode, getTreasuryAndCoinMeta } from "../src/coinGen";

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
  lpMetadataId: string;
  lpTokenType: string;
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
  const tx = await sdk.Bank.createBToken(
    coinType,
    coinSymbol,
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

  const [bTokenTreasuryId, bTokenMetadataId, bTokenTokenType] =
    getTreasuryAndCoinMeta(coinTxResponse);

  const newBankTx = new Transaction();

  await sdk.Bank.createBank(newBankTx, coinTxResponse, {
    coinType: coinType,
    coinMetaT: coinMeta,
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
  const tx = await sdk.Pool.createLpToken(
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

  await sdk.Pool.createPool(newPoolTx, coinTxResponse, {
    btokenTypeA: coinAData.btokenType,
    btokenTypeB: coinBData.btokenType,
    swapFeeBps: BigInt(100),
    offset: BigInt(0),
    coinMetaA: coinAData.bTokenmeta,
    coinMetaB: coinBData.bTokenmeta,
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
    lpMetadataId,
    lpTokenType,
  };
}

export function mintCoin(
  tx: Transaction,
  coinType: string,
  treasuryCap: string,
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
