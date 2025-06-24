import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { SignatureWithBytes } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";

import { Token, isSui } from "@suilend/sui-fe";

export type AirdropRow = { number: number; address: string; amount: string };
export type Batch = AirdropRow[];

// Make batch transfer
export type MakeBatchTransferResult = {
  batch: Batch;
  res: SuiTransactionBlockResponse;
};
export type CreateBatchTransferResult = {
  batch: Batch;
  signedTransaction: SignatureWithBytes;
};
export const createBatchTransfer = async (
  token: Token,
  batch: Batch,
  keypair: Ed25519Keypair,
  suiClient: SuiClient,
): Promise<CreateBatchTransferResult> => {
  console.log("[makeBatchTransfer]", { token, batch });

  const transaction = new Transaction();
  transaction.setSender(keypair.toSuiAddress());

  for (const row of batch) {
    const tokenCoin = coinWithBalance({
      balance: BigInt(
        BigNumber(row.amount)
          .times(10 ** token.decimals)
          .integerValue(BigNumber.ROUND_DOWN)
          .toString(),
      ),
      type: token.coinType,
      useGasCoin: isSui(token.coinType),
    })(transaction);

    transaction.transferObjects([tokenCoin], row.address);
  }

  const builtTransaction = await transaction.build({
    client: suiClient,
  });
  const signedTransaction = await keypair.signTransaction(builtTransaction);

  return { batch, signedTransaction };
};
