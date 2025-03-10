import { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import { SteammSDK, SuiAddressType } from "@suilend/steamm-sdk";

import { createCoinBytecode, getTreasuryAndCoinMeta } from "./coinGen";

import { BTOKEN_URI, CoinData } from ".";

export async function createBank(
  sdk: SteammSDK,
  args: {
    coinType: string;
    coinMeta: string;
  },
): Promise<CoinData> {
  console.log("Sender Address: ", sdk.senderAddress);

  const meta = await sdk.fullClient.getCoinMetadata(args);

  if (!meta) {
    throw new Error("Coin metadata not found");
  }

  const bTokenData = await createBankAndBTokenHelper(
    sdk,
    meta.symbol,
    args.coinType,
    args.coinMeta,
  );
  console.log(`b${meta.symbol}: ${bTokenData}`);

  return bTokenData;
}

export async function createBankAndBTokenHelper(
  sdk: SteammSDK,
  coinSymbol: string,
  coinType: string,
  coinMeta: string,
): Promise<CoinData> {
  const [btreasury, bTokenmeta, btokenType] = await createBTokenHelper(
    sdk,
    coinSymbol,
    coinType,
    coinMeta,
  );

  const bTokenSymbol = `b${coinSymbol}`;

  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    coinMeta,
    coinType,
    btreasury,
    bTokenmeta,
    btokenType,
    bTokenSymbol,
  };
}

async function createBTokenHelper(
  sdk: SteammSDK,
  coinSymbol: string,
  coinType: string,
  coinMeta: string,
): Promise<[string, string, string]> {
  const coinGenTx = await createBToken(coinType, coinSymbol, sdk.senderAddress);

  const inspectResults = await sdk.fullClient.devInspectTransactionBlock({
    transactionBlock: coinGenTx,
    sender: sdk.senderAddress,
    additionalArgs: { showRawTxnDataAndEffects: true },
  });

  if (inspectResults.error) {
    console.log(inspectResults);
    throw new Error(
      `DevInspect Failed - while creating bToken for ${coinSymbol}`,
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
      `Transaction Failed - while creating bToken for ${coinSymbol}`,
    );
  }

  console.log(`CoinGen Transaction successful`);

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

  const inspectResults2 = await sdk.fullClient.devInspectTransactionBlock({
    transactionBlock: newBankTx,
    sender: sdk.senderAddress,
    additionalArgs: { showRawTxnDataAndEffects: true },
  });

  if (inspectResults2.error) {
    console.log(inspectResults2);
    throw new Error(
      `DevInspect Failed - while creating Bank for ${coinSymbol}`,
    );
  }

  const newBankTxResponse = await sdk.fullClient.signAndExecuteTransaction({
    transaction: newBankTx,
    signer: sdk.signer!,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  if (newBankTxResponse.errors) {
    console.log(newBankTxResponse);
    throw new Error(
      `Transaction Failed - while creating Bank for ${coinSymbol}`,
    );
  }

  console.log(`Bank Transaction successful: ${newBankTxResponse.digest}`);

  return [bTokenTreasuryId, bTokenMetadataId, bTokenTokenType];
}

export async function createBToken(
  coinType: string,
  coinSymbol: string,
  sender: SuiAddressType,
): Promise<Transaction> {
  // Construct Btoken name
  const moduleName = coinType.split("::")[1];
  const structType = coinType.split("::")[2];

  const bModuleName = `b_${moduleName}`;
  const bstructType = `B_${structType}`;

  const bTokenName = `bToken ${coinSymbol}`;

  // Construct bToken symbol
  const bTokenSymbol = `b${coinSymbol}`;

  // bToken description
  const lpDescription = "STEAMM bToken";

  const bytecode = await createCoinBytecode(
    bstructType,
    bModuleName,
    bTokenSymbol,
    bTokenName,
    lpDescription,
    BTOKEN_URI,
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
