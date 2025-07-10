import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { SignatureWithBytes } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";

import {
  Token,
  isSui,
  keypairSignExecuteAndWaitForTransaction,
} from "@suilend/sui-fe";

export type AirdropRow = { number: number; address: string; amount: string };

// Make batch transfer
const STEAMM_AIRDROPPER_PACKAGE_ID =
  "0x11461c4c04384d13b5ab787ebac3fb063f9d5df6ee63d133e96b79edaf24c744";

export type MakeBatchTransferResult = {
  batch: AirdropRow[];
  res: SuiTransactionBlockResponse;
};
export const makeBatchTransfer = async (
  token: Token,
  batch: AirdropRow[],
  keypair: Ed25519Keypair,
  suiClient: SuiClient,
  onSign: (signedTransaction: SignatureWithBytes) => void,
): Promise<MakeBatchTransferResult> => {
  console.log("[makeBatchTransfer]", { token, batch });

  const recipients = batch.map((row) => row.address);
  const amounts = batch.map((row) =>
    BigInt(
      new BigNumber(row.amount)
        .times(10 ** token.decimals)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString(),
    ),
  );
  const totalAmount = amounts.reduce((acc, amount) => acc + amount, BigInt(0));
  console.log("[makeBatchTransfer] {recipients, amounts, totalAmount}:", {
    recipients,
    amounts,
    totalAmount,
  });

  const transaction = new Transaction();
  transaction.setSender(keypair.toSuiAddress());

  const coin = coinWithBalance({
    balance: totalAmount,
    type: token.coinType,
    useGasCoin: isSui(token.coinType),
  })(transaction);

  transaction.moveCall({
    target: `${STEAMM_AIRDROPPER_PACKAGE_ID}::steamm_airdropper::airdrop`,
    arguments: [
      transaction.object(coin),
      transaction.pure.vector("address", recipients),
      transaction.pure.vector("u64", amounts),
    ],
    typeArguments: [token.coinType],
  });

  const res = await keypairSignExecuteAndWaitForTransaction(
    transaction,
    keypair,
    suiClient,
    onSign,
  );

  return { batch, res };
};
