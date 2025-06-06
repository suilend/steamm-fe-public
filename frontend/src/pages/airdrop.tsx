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
  getToken,
  isSui,
} from "@suilend/sui-fe";
import {
  showErrorToast,
  showSuccessToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import AirdropAddressAmountTable from "@/components/airdrop/AirdropAddressAmountTable";
import OpenUrlNewTab from "@/components/OpenUrlNewTab";
import Parameter from "@/components/Parameter";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import TokenSelectionDialog from "@/components/swap/TokenSelectionDialog";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { AirdropRow, Batch } from "@/lib/airdrop";
import {
  FundKeypairResult,
  ReturnAllOwnedObjectsAndSuiToUserResult,
  createKeypair,
  fundKeypair,
  keypairSignExecuteAndWaitForTransaction,
  returnAllOwnedObjectsAndSuiToUser,
} from "@/lib/keypair";

const VALID_MIME_TYPES = ["text/csv"];
const TRANSFERS_PER_BATCH = 400; // Max = 512 (if no other MOVE calls in the transaction)
const getBatchTransactionGas = (transferCount: number) =>
  Math.max(0.02, 0.0016 * transferCount);

type MakeBatchTransferResult = {
  batch: Batch;
  res: SuiTransactionBlockResponse;
};
const makeBatchTransfer = async (
  token: Token,
  batch: Batch,
  keypair: Ed25519Keypair,
  suiClient: SuiClient,
): Promise<MakeBatchTransferResult> => {
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

export default function AirdropPage() {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { appData } = useLoadedAppContext();
  const { balancesCoinMetadataMap, getBalance, refresh } = useUserContext();

  const [addressAmountRows, setAddressAmountRows] = useState<
    AirdropRow[] | undefined
  >(undefined);

  const [fundKeypairResult, setFundKeypairResult] = useState<
    FundKeypairResult | undefined
  >(undefined);
  const [makeBatchTransferResults, setMakeBatchTransferResults] = useState<
    MakeBatchTransferResult[] | undefined
  >(undefined);
  const [
    returnAllOwnedObjectsAndSuiToUserResult,
    setReturnAllOwnedObjectsAndSuiToUserResult,
  ] = useState<ReturnAllOwnedObjectsAndSuiToUserResult | undefined>(undefined);

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
    setFundKeypairResult(undefined);
    setMakeBatchTransferResults(undefined);
    setReturnAllOwnedObjectsAndSuiToUserResult(undefined);

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

    if (getBalance(NORMALIZED_SUI_COINTYPE).lt(totalGasAmount))
      return {
        isDisabled: true,
        title: `${formatToken(totalGasAmount, {
          dp: appData.coinMetadataMap[NORMALIZED_SUI_COINTYPE].decimals,
          trimTrailingZeros: true,
        })} SUI should be saved for gas`,
      };

    if (
      getBalance(token.coinType).lt(
        totalTokenAmount!.plus(isSui(token.coinType) ? totalGasAmount : 0),
      )
    )
      return { isDisabled: true, title: `Insufficient ${token.symbol}` };

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

      // 1) Generate and fund keypair
      // 1.1) Generate
      const { keypair } = createKeypair();

      // 1.2) Fund
      const fundKeypairResult = await fundKeypair(
        [
          {
            ...token,
            amount: totalTokenAmount!.plus(
              isSui(token.coinType) ? totalGasAmount : 0,
            ),
          },
          ...(isSui(token.coinType)
            ? []
            : [
                {
                  ...getToken(
                    NORMALIZED_SUI_COINTYPE,
                    appData.coinMetadataMap[NORMALIZED_SUI_COINTYPE],
                  ),
                  amount: totalGasAmount,
                },
              ]),
        ],
        keypair,
        signExecuteAndWaitForTransaction,
      );
      setFundKeypairResult(fundKeypairResult);

      // 2) Create and send keypair transactions (TODO: Move to serverless function)
      // 2.1) Create and send transaction for each batch
      const batches = chunk(addressAmountRows, TRANSFERS_PER_BATCH);
      for (let i = 0; i < batches.length; i++) {
        const makeBatchTransferResult = await makeBatchTransfer(
          token,
          batches[i],
          keypair,
          suiClient,
        );
        setMakeBatchTransferResults((prev) => [
          ...(prev ?? []),
          makeBatchTransferResult,
        ]);
      }

      // 2.2) Return unused SUI to user
      const returnAllOwnedObjectsAndSuiToUserResult =
        await returnAllOwnedObjectsAndSuiToUser(address, keypair, suiClient);
      setReturnAllOwnedObjectsAndSuiToUserResult(
        returnAllOwnedObjectsAndSuiToUserResult,
      );

      showSuccessToast(
        `Airdropped ${formatToken(totalTokenAmount!, {
          dp: token.decimals,
          trimTrailingZeros: true,
        })} ${token.symbol} to ${addressAmountRows.length} addresses`,
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

        {(fundKeypairResult !== undefined ||
          makeBatchTransferResults !== undefined ||
          returnAllOwnedObjectsAndSuiToUserResult !== undefined) && (
          <div className="flex w-full flex-col gap-2">
            {fundKeypairResult !== undefined && (
              <div className="flex flex-row items-center gap-2">
                <p className="text-p2 text-secondary-foreground">Setup</p>
                <OpenUrlNewTab
                  url={explorer.buildTxUrl(fundKeypairResult.res.digest)}
                  tooltip={`Open on ${explorer.name}`}
                />
              </div>
            )}

            {makeBatchTransferResults !== undefined &&
              makeBatchTransferResults.map((makeBatchTransferResult, index) => {
                const prevTransferred = makeBatchTransferResults
                  .slice(0, index)
                  .reduce((acc, { batch }) => acc + batch.length, 0);

                return (
                  <div
                    key={makeBatchTransferResult.res.digest}
                    className="flex flex-row items-center gap-2"
                  >
                    <p className="text-p2 text-secondary-foreground">
                      {prevTransferred + 1}–
                      {prevTransferred + makeBatchTransferResult.batch.length}
                    </p>
                    <OpenUrlNewTab
                      url={explorer.buildTxUrl(
                        makeBatchTransferResult.res.digest,
                      )}
                      tooltip={`Open on ${explorer.name}`}
                    />
                  </div>
                );
              })}

            {returnAllOwnedObjectsAndSuiToUserResult !== undefined && (
              <div className="flex flex-row items-center gap-2">
                <p className="text-p2 text-secondary-foreground">Finalize</p>
                <OpenUrlNewTab
                  url={explorer.buildTxUrl(
                    returnAllOwnedObjectsAndSuiToUserResult.res.digest,
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
