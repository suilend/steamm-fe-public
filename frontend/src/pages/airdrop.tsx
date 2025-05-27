import Head from "next/head";
import { ChangeEvent, useMemo, useState } from "react";

import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { parse } from "csv-parse/sync";
import { chunk } from "lodash";

import {
  NORMALIZED_SUI_COINTYPE,
  formatToken,
  getToken,
  isSui,
} from "@suilend/frontend-sui";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";

import AirdropAddressAmountTable from "@/components/airdrop/AirdropAddressAmountTable";
import Parameter from "@/components/Parameter";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import TokenSelectionDialog from "@/components/swap/TokenSelectionDialog";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { showSuccessTxnToast } from "@/lib/toasts";

const VALID_MIME_TYPES = ["text/csv"];
const TRANSFERS_PER_BATCH = 1;
const GAS_PER_BATCH = 0.01 + 0.001 * TRANSFERS_PER_BATCH;

export default function AirdropPage() {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { balancesCoinMetadataMap, getBalance, refresh } = useUserContext();

  const [addressAmountRows, setAddressAmountRows] = useState<
    { address: string; amount: string }[] | undefined
  >(undefined);

  const totalTokenAmount: number = useMemo(
    () => (addressAmountRows ?? []).reduce((acc, row) => acc + +row.amount, 0),
    [addressAmountRows],
  );
  const totalGasAmount: number = useMemo(
    () =>
      chunk(addressAmountRows ?? [], TRANSFERS_PER_BATCH).length *
      GAS_PER_BATCH,
    [addressAmountRows],
  );
  console.log("XXX", { totalTokenAmount, totalGasAmount, GAS_PER_BATCH });

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

        const records: { address: string; amount: string }[] = parse(text, {
          columns: true,
          delimiter: ",",
          skip_empty_lines: true,
        });
        setAddressAmountRows(records);
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

    if (getBalance(token.coinType).lt(totalTokenAmount))
      return { isDisabled: true, title: `Insufficient ${token.symbol}` };

    if (
      getBalance(NORMALIZED_SUI_COINTYPE).lt(
        new BigNumber(isSui(token.coinType) ? totalTokenAmount : 0).plus(
          totalGasAmount,
        ),
      )
    )
      return { isDisabled: true, title: "Insufficient SUI" };

    return {
      isDisabled: false,
      title: "Send tokens",
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
          BigNumber(totalTokenAmount)
            .times(10 ** token.decimals)
            .integerValue(BigNumber.ROUND_DOWN)
            .toString(),
        ),
        type: token.coinType,
        useGasCoin: isSui(token.coinType),
      })(transaction);
      const gasCoin = coinWithBalance({
        balance: BigInt(
          BigNumber(totalGasAmount)
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
        `Started airdropping ${formatToken(new BigNumber(totalTokenAmount), {
          dp: token.decimals,
          trimTrailingZeros: true,
        })} ${token.symbol} to ${addressAmountRows.length} addresses`,
        txUrl,
        {
          description: `Airdropping ${token.symbol} to ${addressAmountRows?.length} addresses`,
        },
      );

      // 3) Create serverless transactions
      const serverlessTransactions: Transaction[] = [];
      const batches = chunk(addressAmountRows, TRANSFERS_PER_BATCH);

      for (const batch of batches) {
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

          transaction.transferObjects([tokenCoin], address);
        }

        serverlessTransactions.push(transaction);
      }

      // 3.1) Sign serverless transactions
      const signedServerlessTransactions = await Promise.all(
        serverlessTransactions.map((transaction) =>
          (async () => {
            const builtTransaction = await transaction.build({
              client: suiClient,
            });
            return serverlessKeypair.signTransaction(builtTransaction);
          })(),
        ),
      );

      // 3.2) Execute serverless transactions (TODO: Move to serverless function)
      const serverlessTransactionResponses = await Promise.all(
        signedServerlessTransactions.map(({ bytes, signature }) =>
          suiClient.executeTransactionBlock({
            transactionBlock: bytes,
            signature,
          }),
        ),
      );

      console.log(
        "XXX serverlessTransactionResponses:",
        serverlessTransactionResponses,
      );
    } catch (err) {
      showErrorToast("Failed to send tokens", err as Error, undefined, true);
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
      </div>
    </>
  );
}
