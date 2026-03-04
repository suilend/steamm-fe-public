import { SignatureWithBytes } from "@mysten/sui/cryptography";
import {
  SuiJsonRpcClient,
  SuiTransactionBlockResponse,
} from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { parse as parseCsv } from "csv-parse/sync";

import {
  Token,
  getAllCoins,
  isSui,
  keypairSignExecuteAndWaitForTransaction,
  mergeAllCoins,
} from "@suilend/sui-fe";

export type AirdropRow = { number: number; address: string; amount: string };

export function parseCsvText(text: string): AirdropRow[] {
  const records: { [key: string]: string }[] = parseCsv(text, {
    columns: true,
    delimiter: ",",
    skip_empty_lines: true,
  });

  if (records.length === 0) throw new Error("No rows found");
  if (Object.keys(records[0]).length !== 2)
    throw new Error("Each row must have exactly 2 columns (address, amount)");

  return records.map((record, index) => {
    const addressKey = Object.keys(record)[0];
    const amountKey = Object.keys(record)[1];

    return {
      number: index + 1,
      address: record[addressKey],
      amount: record[amountKey],
    };
  });
}

// Make batch transfer
const STEAMM_AIRDROPPER_PACKAGE_ID =
  "0x11461c4c04384d13b5ab787ebac3fb063f9d5df6ee63d133e96b79edaf24c744";

export const getBatchTransferTransaction = async (
  token: Token,
  batch: AirdropRow[],
  address: string,
  suiClient: SuiJsonRpcClient,
) => {
  console.log("[getBatchTransferTransaction]", { token, batch, address });
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

  const allCoins = await getAllCoins(suiClient, address, token.coinType);

  const transaction = new Transaction();
  transaction.setSender(address);

  const mergeCoin = mergeAllCoins(token.coinType, transaction, allCoins);
  const [coin] = transaction.splitCoins(
    isSui(token.coinType)
      ? transaction.gas
      : transaction.object(mergeCoin.coinObjectId),
    [totalAmount],
  );

  transaction.moveCall({
    target: `${STEAMM_AIRDROPPER_PACKAGE_ID}::steamm_airdropper::airdrop`,
    arguments: [
      transaction.object(coin),
      transaction.pure.vector("address", recipients),
      transaction.pure.vector("u64", amounts),
    ],
    typeArguments: [token.coinType],
  });

  return transaction;
};

export type MakeBatchTransferResult = {
  batch: AirdropRow[];
  res: SuiTransactionBlockResponse;
};
export const makeBatchTransfer = async (
  token: Token,
  batch: AirdropRow[],
  keypair: Ed25519Keypair,
  suiClient: SuiJsonRpcClient,
  onSign: (signedTransaction: SignatureWithBytes) => void,
): Promise<MakeBatchTransferResult> => {
  const transaction = await getBatchTransferTransaction(
    token,
    batch,
    keypair.toSuiAddress(),
    suiClient,
  );

  const res = await keypairSignExecuteAndWaitForTransaction(
    transaction,
    keypair,
    suiClient,
    onSign,
  );

  return { batch, res };
};
