import Head from "next/head";
import { ChangeEvent, useMemo, useState } from "react";

import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { parse } from "csv-parse/sync";
import { chunk } from "lodash";

import {
  NORMALIZED_SUI_COINTYPE,
  Token,
  formatToken,
  getBalanceChange,
  getToken,
  isSui,
} from "@suilend/frontend-sui";
import {
  showErrorToast,
  showSuccessToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";

import AirdropAddressAmountTable from "@/components/airdrop/AirdropAddressAmountTable";
import OpenUrlNewTab from "@/components/OpenUrlNewTab";
import Parameter from "@/components/Parameter";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import TokenSelectionDialog from "@/components/swap/TokenSelectionDialog";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { AirdropRow, Batch } from "@/lib/airdrop";
import { showSuccessTxnToast } from "@/lib/toasts";

const VALID_MIME_TYPES = ["text/csv"];
const TRANSFERS_PER_BATCH = 400; // Max = 512 (if no other MOVE calls in the transaction)
const getBatchTransactionGas = (transferCount: number) =>
  Math.max(0.02, 0.0016 * transferCount);

const executeBatchTransaction = async (
  suiClient: SuiClient,
  token: Token,
  serverlessKeypair: Ed25519Keypair,
  batch: Batch,
) => {
  const serverlessAddress = serverlessKeypair.toSuiAddress();

  // 1) Create transaction
  const transaction = new Transaction();
  transaction.setSender(serverlessAddress);

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

  // 2) Sign transaction
  const builtTransaction = await transaction.build({
    client: suiClient,
  });
  const signedTransaction =
    await serverlessKeypair.signTransaction(builtTransaction);

  // 3) Execute signed transaction
  const res1 = await suiClient.executeTransactionBlock({
    transactionBlock: signedTransaction.bytes,
    signature: signedTransaction.signature,
  });

  const res2 = await suiClient.waitForTransaction({
    digest: res1.digest,
  });

  return { transaction, signedTransaction, res1, res2 };
};

const executeReturnGasTransaction = async (
  suiClient: SuiClient,
  address: string,
  serverlessKeypair: Ed25519Keypair,
) => {
  const serverlessAddress = serverlessKeypair.toSuiAddress();

  // 1) Create transaction
  const transaction = new Transaction();
  transaction.setSender(serverlessAddress);

  transaction.transferObjects([transaction.gas], address);

  // 2) Sign transaction
  const builtTransaction = await transaction.build({
    client: suiClient,
  });
  const signedTransaction =
    await serverlessKeypair.signTransaction(builtTransaction);

  // 3) Execute signed transaction
  const res1 = await suiClient.executeTransactionBlock({
    transactionBlock: signedTransaction.bytes,
    signature: signedTransaction.signature,
  });

  const res2 = await suiClient.waitForTransaction({
    digest: res1.digest,
    options: {
      showBalanceChanges: true,
    },
  });

  return { transaction, signedTransaction, res1, res2 };
};

export default function AirdropPage() {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { appData } = useLoadedAppContext();
  const { balancesCoinMetadataMap, getBalance, refresh } = useUserContext();

  const [addressAmountRows, setAddressAmountRows] = useState<
    AirdropRow[] | undefined
  >(undefined);

  const [batchTransactionResults, setBatchTransactionResults] = useState<
    { batch: Batch; res: SuiTransactionBlockResponse }[] | undefined
  >(undefined);
  const [returnGasTransactionResult, setReturnGasTransactionResult] = useState<
    { res: SuiTransactionBlockResponse } | undefined
  >(undefined);

  // Token
  const tokens = useMemo(
    () =>
      Object.entries(balancesCoinMetadataMap ?? {})
        .filter(([coinType]) => getBalance(coinType).gt(0))
        .map(([coinType, coinMetadata]) => getToken(coinType, coinMetadata))
        .sort(
          (a, b) => (a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1), // Sort by symbol (ascending)
        ),
    [balancesCoinMetadataMap, getBalance],
  );

  const [coinType, setCoinType] = useState<string | undefined>(undefined);
  const token =
    coinType !== undefined
      ? getToken(coinType, balancesCoinMetadataMap![coinType])
      : undefined;

  // CSV
  const reset = () => {
    setAddressAmountRows(undefined);
    (document.getElementById("csv-upload") as HTMLInputElement).value = "";
  };

  const handleFile = async (file: File) => {
    try {
      reset();

      // Validate file type
      if (!VALID_MIME_TYPES.includes(file.type))
        throw new Error("Please upload a CSV file");

      // Read file
      const reader = new FileReader();
      reader.onload = (e) => {
        // const base64String = e.target?.result as string;

        const text = e.target?.result as string;

        const records: Omit<AirdropRow, "number">[] = parse(text, {
          columns: true,
          delimiter: ",",
          skip_empty_lines: true,
        });
        setAddressAmountRows(
          records.map((record, index) => ({ number: index + 1, ...record })),
        );
      };
      reader.onerror = () => {
        throw new Error("Failed to upload image");
      };
      reader.readAsText(file);
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to upload CSV file", err as Error);

      reset();
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleFile(file);
  };

  // Calcs
  const totalTokenAmount =
    token === undefined
      ? undefined
      : (addressAmountRows ?? []).reduce(
          (acc, row) =>
            acc.plus(
              new BigNumber(row.amount).decimalPlaces(
                token.decimals,
                BigNumber.ROUND_DOWN,
              ),
            ),
          new BigNumber(0),
        );
  const totalGasAmount = chunk(
    addressAmountRows ?? [],
    TRANSFERS_PER_BATCH,
  ).reduce(
    (acc, batch) => acc.plus(getBatchTransactionGas(batch.length)),
    new BigNumber(0),
  );

  // Submit
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) return { isDisabled: true, isLoading: true };

    // Token
    if (token === undefined)
      return { isDisabled: true, title: "Select a token" };

    // CSV
    if (addressAmountRows === undefined)
      return { isDisabled: true, title: "Upload a CSV file" };
    if (addressAmountRows.length === 0)
      return { isDisabled: true, title: "Upload a non-empty CSV file" };

    if (getBalance(token.coinType).lt(totalTokenAmount!))
      return { isDisabled: true, title: `Insufficient ${token.symbol}` };

    if (
      getBalance(NORMALIZED_SUI_COINTYPE).lt(
        new BigNumber(isSui(token.coinType) ? totalTokenAmount! : 0).plus(
          totalGasAmount,
        ),
      )
    )
      return { isDisabled: true, title: "Insufficient SUI" };

    return {
      isDisabled: false,
      title: "Airdrop",
    };
  })();

  const onSubmitClick = async () => {
    if (submitButtonState.isDisabled) return;
    if (!addressAmountRows || !token) return; // Should not happen

    try {
      if (!address) throw new Error("Wallet not connected");

      setIsSubmitting(true);

      // 1) Generate serverless keypair
      const serverlessKeypair = new Ed25519Keypair();
      const serverlessAddress = serverlessKeypair.toSuiAddress();
      const serverlessPrivateKey = serverlessKeypair.getSecretKey();

      // 2) Fund serverless account
      const transaction = new Transaction();

      const tokenCoin = coinWithBalance({
        balance: BigInt(
          totalTokenAmount!
            .times(10 ** token.decimals)
            .integerValue(BigNumber.ROUND_DOWN)
            .toString(),
        ),
        type: token.coinType,
        useGasCoin: isSui(token.coinType),
      })(transaction);
      const gasCoin = coinWithBalance({
        balance: BigInt(
          totalGasAmount
            .times(
              10 ** appData.coinMetadataMap[NORMALIZED_SUI_COINTYPE].decimals,
            )
            .integerValue(BigNumber.ROUND_DOWN)
            .toString(),
        ),
        type: NORMALIZED_SUI_COINTYPE,
        useGasCoin: true,
      })(transaction);

      transaction.transferObjects([tokenCoin, gasCoin], serverlessAddress);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast(
        `Airdropping ${formatToken(totalTokenAmount!, {
          dp: token.decimals,
          trimTrailingZeros: true,
        })} ${token.symbol} to ${addressAmountRows.length} addresses`,
        txUrl,
      );

      // 3) Create and send serverless transactions (TODO: Move to serverless function)
      // 3.1) Create and send transaction for each batch
      const batches = chunk(addressAmountRows, TRANSFERS_PER_BATCH);
      for (let i = 0; i < batches.length; i++) {
        const { res2 } = await executeBatchTransaction(
          suiClient,
          token,
          serverlessKeypair,
          batches[i],
        );
        setBatchTransactionResults((prev) => [
          ...(prev ?? []),
          { batch: batches[i], res: res2 },
        ]);
      }

      // 3.2) Refund unused SUI to user
      const { res2: returnGasTransactionRes } =
        await executeReturnGasTransaction(
          suiClient,
          address,
          serverlessKeypair,
        );
      setReturnGasTransactionResult({ res: returnGasTransactionRes });

      const returnGasTransactionBalanceChangeSui = getBalanceChange(
        returnGasTransactionRes,
        address,
        getToken(
          NORMALIZED_SUI_COINTYPE,
          appData.coinMetadataMap[NORMALIZED_SUI_COINTYPE],
        ),
      );

      showSuccessToast(
        `Airdropped ${formatToken(totalTokenAmount!, {
          dp: token.decimals,
          trimTrailingZeros: true,
        })} ${token.symbol} to ${addressAmountRows.length} addresses`,
        {
          description:
            returnGasTransactionBalanceChangeSui === undefined
              ? undefined
              : `${formatToken(returnGasTransactionBalanceChangeSui, {
                  dp: appData.coinMetadataMap[NORMALIZED_SUI_COINTYPE].decimals,
                  trimTrailingZeros: true,
                })} unused SUI was refunded`,
        },
      );
    } catch (err) {
      showErrorToast("Failed to airdrop", err as Error, undefined, true);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      refresh();
    }
  };

  return (
    <>
      <Head>
        <title>STEAMM | Airdrop</title>
      </Head>

      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <h1 className="text-h1 text-foreground">Airdrop</h1>
        </div>

        <div className="flex w-full flex-col gap-6">
          <div className="flex w-full flex-col gap-4">
            {/* Token */}
            <div className="flex flex-row justify-between">
              <p className="text-p2 text-secondary-foreground">Token</p>

              <TokenSelectionDialog
                triggerClassName="h-6"
                triggerIconSize={16}
                triggerLabelSelectedClassName="!text-p2"
                triggerLabelUnselectedClassName="!text-p2"
                triggerChevronClassName="!h-4 !w-4 !ml-0 !mr-0"
                token={token}
                tokens={tokens}
                onSelectToken={(token) => setCoinType(token.coinType)}
              />
            </div>

            {/* CSV */}
            <Parameter label="CSV file" labelEndDecorator="address, amount">
              <input
                id="csv-upload"
                type="file"
                accept={VALID_MIME_TYPES.join(",")}
                onChange={handleFileSelect}
                disabled={token === undefined}
              />
            </Parameter>

            {token !== undefined && addressAmountRows !== undefined && (
              <AirdropAddressAmountTable
                token={token}
                rows={addressAmountRows}
              />
            )}
          </div>

          <SubmitButton
            submitButtonState={submitButtonState}
            onClick={onSubmitClick}
          />
        </div>

        {(batchTransactionResults !== undefined ||
          returnGasTransactionResult !== undefined) && (
          <div className="flex w-full flex-col gap-2">
            {batchTransactionResults !== undefined &&
              batchTransactionResults.map(({ batch, res }, index) => {
                const prevTransferred = batchTransactionResults
                  .slice(0, index)
                  .reduce((acc, { batch }) => acc + batch.length, 0);

                return (
                  <div
                    key={res.digest}
                    className="flex flex-row items-center gap-2"
                  >
                    <p className="text-p2 text-secondary-foreground">
                      {prevTransferred + 1}–{prevTransferred + batch.length}
                    </p>
                    <OpenUrlNewTab
                      url={explorer.buildTxUrl(res.digest)}
                      tooltip={`Open on ${explorer.name}`}
                    />
                  </div>
                );
              })}

            {returnGasTransactionResult !== undefined && (
              <div className="flex flex-row items-center gap-2">
                <p className="text-p2 text-secondary-foreground">
                  Refund unused SUI
                </p>
                <OpenUrlNewTab
                  url={explorer.buildTxUrl(
                    returnGasTransactionResult.res.digest,
                  )}
                  tooltip={`Open on ${explorer.name}`}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
