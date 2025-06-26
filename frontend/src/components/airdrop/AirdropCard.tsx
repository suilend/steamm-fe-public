import { Dispatch, SetStateAction, useMemo, useState } from "react";

import { useSignPersonalMessage } from "@mysten/dapp-kit";
import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { SignatureWithBytes } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import BigNumber from "bignumber.js";
import { chunk } from "lodash";
import { useLocalStorage } from "usehooks-ts";

import {
  FundKeypairResult,
  NORMALIZED_SUI_COINTYPE,
  ReturnAllOwnedObjectsAndSuiToUserResult,
  checkIfKeypairCanBeUsed,
  createKeypair,
  formatToken,
  fundKeypair,
  getToken,
  isSui,
  keypairWaitForTransaction,
  returnAllOwnedObjectsAndSuiToUser,
} from "@suilend/sui-fe";
import {
  showErrorToast,
  showSuccessToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import AirdropStepsDialog from "@/components/airdrop/AirdropStepsDialog";
import CsvUpload from "@/components/airdrop/CsvUpload";
import Divider from "@/components/Divider";
import Parameter from "@/components/Parameter";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import TokenSelectionDialog from "@/components/swap/TokenSelectionDialog";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import {
  AirdropRow,
  MakeBatchTransferResult,
  makeBatchTransfer,
} from "@/lib/airdrop";
import { cn, sleep } from "@/lib/utils";

////

type LastSignedTransaction<T> = {
  signedTransaction: SignatureWithBytes;
  type: T;
};

async function checkLastTransactionSignature<T>(
  type: T,
  lastCurrentFlowTransaction: SuiTransactionBlockResponse | undefined,
  lastSignedTransaction: LastSignedTransaction<T> | undefined,
  setLastSignedTransaction: Dispatch<
    SetStateAction<LastSignedTransaction<T> | undefined>
  >,
  validCallback: () => Promise<void>,
  invalidCallback: () => Promise<void>,
) {
  console.log("[checkLastTransactionSignature]", {
    type,
    lastCurrentFlowTransaction,
    lastSignedTransaction,
  });

  if (
    lastSignedTransaction?.type === type &&
    (lastCurrentFlowTransaction?.transaction?.txSignatures ?? []).includes(
      lastSignedTransaction.signedTransaction.signature,
    )
  ) {
    console.log(
      "[checkLastTransactionSignature] lastSignedTransaction type and signature MATCH",
    );

    try {
      await validCallback();
      setLastSignedTransaction(undefined);
      await sleep(500); // Wait for `setLastSignedTransaction` to take effect
    } catch (err) {
      console.error("[checkLastTransactionSignature]", err);

      try {
        await invalidCallback();
        setLastSignedTransaction(undefined);
        await sleep(500); // Wait for `setLastSignedTransaction` to take effect
      } catch (err) {
        console.error(err);
        setLastSignedTransaction(undefined);
        await sleep(500); // Wait for `setLastSignedTransaction` to take effect

        throw err;
      }
    }
  } else {
    console.log(
      "[checkLastTransactionSignature] lastSignedTransaction type and signature DO NOT MATCH",
    );

    try {
      await invalidCallback();
      setLastSignedTransaction(undefined);
      await sleep(500); // Wait for `setLastSignedTransaction` to take effect
    } catch (err) {
      console.error(err);
      setLastSignedTransaction(undefined);
      await sleep(500); // Wait for `setLastSignedTransaction` to take effect

      throw err;
    }
  }
}

function onSign<T>(
  type: T,
  setLastSignedTransaction: Dispatch<
    SetStateAction<LastSignedTransaction<T> | undefined>
  >,
  index?: number,
) {
  return (signedTransaction: SignatureWithBytes) => {
    console.log(
      `[onSign] Setting setLastSignedTransaction for ${type}${
        index !== undefined ? ` ${index}` : ""
      }`,
    );
    setLastSignedTransaction({
      signedTransaction,
      type,
    });
  };
}

////

enum LastSignedTransactionType {
  FUND_KEYPAIR = "fundKeypair",
  MAKE_BATCH_TRANSFER = "makeBatchTransfer",
  RETURN_ALL_OWNED_OBJECTS_AND_SUI_TO_USER = "returnAllOwnedObjectsAndSuiToUser",
}

const TRANSFERS_PER_BATCH = 50; // Max = 512 (if no other MOVE calls in the transaction)
const getBatchTransactionGas = (transferCount: number) =>
  Math.max(0.02, 0.0016 * transferCount);

export default function AirdropCard() {
  const { suiClient } = useSettingsContext();
  const { account, address, signExecuteAndWaitForTransaction } =
    useWalletContext();
  const { appData } = useLoadedAppContext();
  const { balancesCoinMetadataMap, getBalance, refresh } = useUserContext();

  // Progress
  const [hasFailed, setHasFailed] = useState<boolean>(false); // Don't use `localStorage` (no need to persist)
  const [lastSignedTransaction, setLastSignedTransaction] = useLocalStorage<
    LastSignedTransaction<LastSignedTransactionType> | undefined
  >("airdrop-lastSignedTransaction", undefined);

  const [keypair, setKeypair] = useState<Ed25519Keypair | undefined>(undefined); // Don't use `localStorage` (shouldn't put private key in localStorage)
  const [fundKeypairResult, setFundKeypairResult] = useLocalStorage<
    FundKeypairResult | undefined
  >("airdrop-fundKeypairResults", undefined);
  const [makeBatchTransferResults, setMakeBatchTransferResults] =
    useLocalStorage<MakeBatchTransferResult[] | undefined>(
      "airdrop-makeBatchTransferResults",
      undefined,
    );
  const [
    returnAllOwnedObjectsAndSuiToUserResult,
    setReturnAllOwnedObjectsAndSuiToUserResult,
  ] = useLocalStorage<ReturnAllOwnedObjectsAndSuiToUserResult | undefined>(
    "airdrop-returnAllOwnedObjectsAndSuiToUserResult",
    undefined,
  );
  console.log("[AirdropCard]", {
    hasFailed,
    lastSignedTransaction,
    keypair,
    fundKeypairResult,
    makeBatchTransferResults,
    returnAllOwnedObjectsAndSuiToUserResult,
  });

  const currentFlowDigests = useMemo(
    () =>
      Array.from(
        new Set(
          [
            fundKeypairResult?.res.digest,
            ...(makeBatchTransferResults ?? []).map((x) => x.res.digest),
          ].filter(Boolean) as string[],
        ),
      ),
    [fundKeypairResult?.res.digest, makeBatchTransferResults],
  );

  // State - token
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

  const [coinType, setCoinType] = useLocalStorage<string | undefined>(
    "airdrop-coinType",
    undefined,
  );
  const token =
    coinType !== undefined
      ? getToken(coinType, balancesCoinMetadataMap![coinType])
      : undefined;

  // State - CSV
  const [csvRows, setCsvRows] = useLocalStorage<AirdropRow[] | undefined>(
    "airdrop-csvRows",
    undefined,
  );
  const [csvFilename, setCsvFilename] = useLocalStorage<string>(
    "airdrop-csvFilename",
    "",
  );
  const [csvFileSize, setCsvFileSize] = useLocalStorage<string>(
    "airdrop-csvFileSize",
    "",
  );

  const batches = useMemo(
    () => chunk(csvRows ?? [], TRANSFERS_PER_BATCH),
    [csvRows],
  );

  // Calcs
  const totalTokenAmount =
    token === undefined
      ? undefined
      : (csvRows ?? []).reduce(
          (acc, row) =>
            acc.plus(
              new BigNumber(row.amount).decimalPlaces(
                token.decimals,
                BigNumber.ROUND_DOWN,
              ),
            ),
          new BigNumber(0),
        );
  const totalGasAmount = chunk(csvRows ?? [], TRANSFERS_PER_BATCH).reduce(
    (acc, batch) => acc.plus(getBatchTransactionGas(batch.length)),
    new BigNumber(0),
  );

  // Submit
  const reset = () => {
    // Progress
    setHasFailed(false);
    setLastSignedTransaction(undefined);

    setKeypair(undefined);
    setFundKeypairResult(undefined);
    setMakeBatchTransferResults(undefined);
    setReturnAllOwnedObjectsAndSuiToUserResult(undefined);

    // State
    setCoinType(undefined);

    setCsvRows(undefined);
    setCsvFilename("");
    setCsvFileSize("");
    (document.getElementById("csv-upload") as HTMLInputElement).value = "";
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) return { isLoading: true, isDisabled: true };

    if (hasFailed && !returnAllOwnedObjectsAndSuiToUserResult)
      return { isDisabled: false, title: "Retry" };
    if (
      currentFlowDigests.length > 0 &&
      !returnAllOwnedObjectsAndSuiToUserResult
    )
      return { isDisabled: false, title: "Resume" };
    if (!!returnAllOwnedObjectsAndSuiToUserResult)
      return { isSuccess: true, isDisabled: true };

    // Token
    if (token === undefined)
      return { isDisabled: true, title: "Select a token" };

    // CSV
    if (csvRows === undefined)
      return { isDisabled: true, title: "Upload a CSV file" };

    //

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

  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const onSubmitClick = async () => {
    if (submitButtonState.isDisabled) return;
    if (!token || csvRows === undefined) return; // Should not happen

    try {
      if (!account?.publicKey || !address)
        throw new Error("Wallet not connected");

      setIsSubmitting(true);

      // 1) Generate and fund keypair
      // 1.1) Generate
      let _keypair = keypair;
      if (_keypair === undefined) {
        console.log("[onSubmitClick] createKeypair");

        _keypair = (await createKeypair(account, signPersonalMessage)).keypair;
        setKeypair(_keypair);
      }

      // 1.2) Check
      const { lastCurrentFlowTransaction } = await checkIfKeypairCanBeUsed(
        lastSignedTransaction?.signedTransaction,
        currentFlowDigests,
        _keypair,
        suiClient,
      );
      console.log(
        "[onSubmitClick] checkIfKeypairCanBeUsed - lastCurrentFlowTransaction:",
        lastCurrentFlowTransaction,
      );

      // 1.3) Fund
      if (fundKeypairResult === undefined) {
        await checkLastTransactionSignature(
          LastSignedTransactionType.FUND_KEYPAIR,
          lastCurrentFlowTransaction,
          lastSignedTransaction,
          setLastSignedTransaction,
          async () => {
            console.log("[onSubmitClick] fundKeypair - validCallback");

            const _fundKeypairResult: FundKeypairResult = {
              res: await keypairWaitForTransaction(
                lastCurrentFlowTransaction!.digest,
                suiClient,
              ),
            };
            setFundKeypairResult(_fundKeypairResult);
          },
          async () => {
            console.log("[onSubmitClick] fundKeypair - invalidCallback");

            const _fundKeypairResult: FundKeypairResult = await fundKeypair(
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
              _keypair,
              signExecuteAndWaitForTransaction,
              onSign<LastSignedTransactionType>(
                LastSignedTransactionType.FUND_KEYPAIR,
                setLastSignedTransaction,
              ),
            );
            setFundKeypairResult(_fundKeypairResult);
          },
        );
      }

      // 2) Create and send keypair transactions
      // 2.1) Make batch transfers
      const makeBatchTransferResultsCount = (makeBatchTransferResults ?? [])
        .length;
      console.log(
        "[onSubmitClick] makeBatchTransferResultsCount:",
        makeBatchTransferResultsCount,
        "batches.length:",
        batches.length,
      );

      if (makeBatchTransferResultsCount < batches.length) {
        for (let i = 0; i < batches.length; i++) {
          console.log(`[onSubmitClick] makeBatchTransfer ${i}`);
          const batch = batches[i];

          if (i <= makeBatchTransferResultsCount - 1) {
            console.log(`[onSubmitClick] makeBatchTransfer ${i} - skipping`);
            continue;
          } else {
            console.log(
              `[onSubmitClick] makeBatchTransfer ${i} - NOT skipping`,
            );
          }

          await checkLastTransactionSignature(
            LastSignedTransactionType.MAKE_BATCH_TRANSFER,
            lastCurrentFlowTransaction,
            lastSignedTransaction,
            setLastSignedTransaction,
            async () => {
              console.log(
                `[onSubmitClick] makeBatchTransfer ${i} - validCallback`,
              );

              const _makeBatchTransferResult: MakeBatchTransferResult = {
                batch,
                res: await keypairWaitForTransaction(
                  lastCurrentFlowTransaction!.digest,
                  suiClient,
                ),
              };
              setMakeBatchTransferResults((prev) => [
                ...(prev ?? []),
                _makeBatchTransferResult,
              ]);
            },
            async () => {
              console.log(
                `[onSubmitClick] makeBatchTransfer ${i} - invalidCallback`,
              );

              const _makeBatchTransferResult = await makeBatchTransfer(
                token,
                batch,
                _keypair,
                suiClient,
                onSign<LastSignedTransactionType>(
                  LastSignedTransactionType.MAKE_BATCH_TRANSFER,
                  setLastSignedTransaction,
                ),
              );
              setMakeBatchTransferResults((prev) => [
                ...(prev ?? []),
                _makeBatchTransferResult,
              ]);
            },
          );
        }
      }

      // 2.2) Return objects and unused SUI to user
      if (returnAllOwnedObjectsAndSuiToUserResult === undefined) {
        await checkLastTransactionSignature(
          LastSignedTransactionType.RETURN_ALL_OWNED_OBJECTS_AND_SUI_TO_USER,
          lastCurrentFlowTransaction,
          lastSignedTransaction,
          setLastSignedTransaction,
          async () => {
            console.log(
              "[onSubmitClick] returnAllOwnedObjectsAndSuiToUser - validCallback",
            );

            const _returnAllOwnedObjectsAndSuiToUserResult: ReturnAllOwnedObjectsAndSuiToUserResult =
              {
                res: await keypairWaitForTransaction(
                  lastCurrentFlowTransaction!.digest,
                  suiClient,
                ),
              };
            setReturnAllOwnedObjectsAndSuiToUserResult(
              _returnAllOwnedObjectsAndSuiToUserResult,
            );
          },
          async () => {
            console.log(
              "[onSubmitClick] returnAllOwnedObjectsAndSuiToUser - invalidCallback",
            );

            const _returnAllOwnedObjectsAndSuiToUserResult: ReturnAllOwnedObjectsAndSuiToUserResult =
              await returnAllOwnedObjectsAndSuiToUser(
                address,
                _keypair,
                suiClient,
                onSign<LastSignedTransactionType>(
                  LastSignedTransactionType.RETURN_ALL_OWNED_OBJECTS_AND_SUI_TO_USER,
                  setLastSignedTransaction,
                ),
              );
            setReturnAllOwnedObjectsAndSuiToUserResult(
              _returnAllOwnedObjectsAndSuiToUserResult,
            );
          },
        );
      }

      showSuccessToast(
        `Airdropped ${formatToken(totalTokenAmount!, {
          dp: token.decimals,
          trimTrailingZeros: true,
        })} ${token.symbol} to ${csvRows.length} ${
          csvRows.length === 1 ? "address" : "addresses"
        }`,
      );
    } catch (err) {
      showErrorToast("Failed to airdrop", err as Error, undefined, true);
      console.error(err);

      setHasFailed(true);
    } finally {
      setIsSubmitting(false);
      refresh();
    }
  };

  const isStepsDialogOpen =
    isSubmitting || !!returnAllOwnedObjectsAndSuiToUserResult;

  return (
    <>
      <AirdropStepsDialog
        isOpen={isStepsDialogOpen}
        token={token}
        batches={batches}
        fundKeypairResult={fundKeypairResult}
        makeBatchTransferResults={makeBatchTransferResults}
        returnAllOwnedObjectsAndSuiToUserResult={
          returnAllOwnedObjectsAndSuiToUserResult
        }
        reset={reset}
      />

      <div className="flex w-full flex-col gap-6">
        <div
          className={cn(
            "flex w-full flex-col gap-4",
            (hasFailed || currentFlowDigests.length > 0) &&
              "pointer-events-none",
          )}
        >
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
          <CsvUpload
            isDragAndDropDisabled={
              hasFailed || currentFlowDigests.length > 0 || isStepsDialogOpen
            }
            token={token}
            csvRows={csvRows}
            setCsvRows={setCsvRows}
            csvFilename={csvFilename}
            setCsvFilename={setCsvFilename}
            csvFileSize={csvFileSize}
            setCsvFileSize={setCsvFileSize}
          />

          <Divider />

          <div className="flex w-full flex-col gap-2">
            {/* Airdrop */}
            <Parameter label="Airdrop" isHorizontal>
              {token !== undefined ? (
                <p className="text-p2 text-foreground">
                  {formatToken(totalTokenAmount!, {
                    dp: token.decimals,
                    trimTrailingZeros: true,
                  })}{" "}
                  {token.symbol}
                </p>
              ) : (
                <p className="text-p2 text-foreground">--</p>
              )}
            </Parameter>

            {/* Recipients */}
            <Parameter label="Recipients" isHorizontal>
              {csvRows !== undefined ? (
                <p className="text-p2 text-foreground">{csvRows.length}</p>
              ) : (
                <p className="text-p2 text-foreground">--</p>
              )}
            </Parameter>

            {/* Batches */}
            <Parameter
              label="Batches"
              isHorizontal
              labelEndDecorator={`${TRANSFERS_PER_BATCH} transfers per batch`}
            >
              {csvRows !== undefined ? (
                <p className="text-p2 text-foreground">{batches.length}</p>
              ) : (
                <p className="text-p2 text-foreground">--</p>
              )}
            </Parameter>

            {/* Max fee */}
            <Parameter label="Max fee" isHorizontal>
              {csvRows !== undefined ? (
                <p className="text-p2 text-foreground">
                  {formatToken(totalGasAmount, {
                    dp: appData.coinMetadataMap[NORMALIZED_SUI_COINTYPE]
                      .decimals,
                    trimTrailingZeros: true,
                  })}{" "}
                  SUI
                </p>
              ) : (
                <p className="text-p2 text-foreground">--</p>
              )}
            </Parameter>
          </div>
        </div>

        <div className="flex w-full flex-col gap-1">
          <SubmitButton
            submitButtonState={submitButtonState}
            onClick={onSubmitClick}
          />

          {(hasFailed || currentFlowDigests.length > 0) &&
            !returnAllOwnedObjectsAndSuiToUserResult && (
              <button
                className="group flex h-10 w-full flex-row items-center justify-center rounded-md border px-3 transition-colors hover:bg-border/50"
                onClick={reset}
              >
                <p className="text-p2 text-secondary-foreground transition-colors group-hover:text-foreground">
                  Start over
                </p>
              </button>
            )}
        </div>
      </div>
    </>
  );
}
