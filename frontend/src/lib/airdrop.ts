import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";

import { Token, isSui } from "@suilend/sui-fe";

import { keypairSignExecuteAndWaitForTransaction } from "@/lib/keypair";

export type AirdropRow = { number: number; address: string; amount: string };
export type Batch = AirdropRow[];

// Make batch transfer
export type MakeBatchTransferResult = {
  batch: Batch;
  res: SuiTransactionBlockResponse;
};
export const makeBatchTransfer = async (
  token: Token,
  batch: Batch,
  keypair: Ed25519Keypair,
  suiClient: SuiClient,
): Promise<MakeBatchTransferResult> => {
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

  const res = await keypairSignExecuteAndWaitForTransaction(
    transaction,
    keypair,
    suiClient,
  );

  return { batch, res };
};
