import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";

import { Token, isSui } from "@suilend/sui-fe";
import { WalletContext } from "@suilend/sui-fe-next";

import { getAllOwnedObjects } from "@/lib/transactions";

export const createKeypair = () => {
  const keypair = new Ed25519Keypair();
  const address = keypair.toSuiAddress();
  const privateKey = keypair.getSecretKey();

  return { keypair, address, privateKey };
};

export const keypairSignExecuteAndWaitForTransaction = async (
  transaction: Transaction,
  keypair: Ed25519Keypair,
  suiClient: SuiClient,
): Promise<SuiTransactionBlockResponse> => {
  // 1) Sign
  const builtTransaction = await transaction.build({
    client: suiClient,
  });
  const signedTransaction = await keypair.signTransaction(builtTransaction);

  // 2) Execute
  const res1 = await suiClient.executeTransactionBlock({
    transactionBlock: signedTransaction.bytes,
    signature: signedTransaction.signature,
  });

  // 3) Wait
  const res2 = await suiClient.waitForTransaction({
    digest: res1.digest,
    options: {
      showBalanceChanges: true,
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
    },
  });
  if (
    res2.effects?.status !== undefined &&
    res2.effects.status.status === "failure"
  )
    throw new Error(res2.effects.status.error ?? "Transaction failed");

  return res2;
};

export type FundKeypairResult = {
  res: SuiTransactionBlockResponse;
};
export const fundKeypair = async (
  tokens: (Token & { amount: BigNumber })[],
  keypair: Ed25519Keypair,
  signExecuteAndWaitForTransaction: WalletContext["signExecuteAndWaitForTransaction"],
) => {
  console.log(
    `[fundKeypair] tokens: ${tokens.map((t) => ({
      coinType: t.coinType,
      amount: t.amount.toString(),
    }))}`,
  );

  const fundKeypairTransaction = new Transaction();

  const coinsWithBalance = tokens.map((token) =>
    coinWithBalance({
      balance: BigInt(
        token
          .amount!.times(10 ** token.decimals)
          .integerValue(BigNumber.ROUND_DOWN)
          .toString(),
      ),
      type: token.coinType,
      useGasCoin: isSui(token.coinType),
    })(fundKeypairTransaction),
  );

  fundKeypairTransaction.transferObjects(
    coinsWithBalance,
    keypair.toSuiAddress(),
  );

  const res = await signExecuteAndWaitForTransaction(fundKeypairTransaction);

  return { res };
};

export type ReturnAllOwnedObjectsAndSuiToUserResult = {
  res: SuiTransactionBlockResponse;
};
export const returnAllOwnedObjectsAndSuiToUser = async (
  address: string,
  keypair: Ed25519Keypair,
  suiClient: SuiClient,
): Promise<ReturnAllOwnedObjectsAndSuiToUserResult> => {
  console.log(`[returnAllOwnedObjectsAndSuiToUser] address: ${address}`);

  const transaction = new Transaction();
  transaction.setSender(keypair.toSuiAddress());

  transaction.transferObjects([transaction.gas], address);

  const ownedObjectIds = (
    await getAllOwnedObjects(suiClient, keypair.toSuiAddress())
  )
    .filter(
      (obj) =>
        (obj.data?.content as any).type !== "0x2::coin::Coin<0x2::sui::SUI>",
    )
    .map((obj) => obj.data?.objectId as string); // Assumed to be <512 objects

  transaction.transferObjects(ownedObjectIds, address);

  const res = await keypairSignExecuteAndWaitForTransaction(
    transaction,
    keypair,
    suiClient,
  );

  return { res };
};
