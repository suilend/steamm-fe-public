import { useMemo, useState } from "react";

import { useSignPersonalMessage } from "@mysten/dapp-kit";
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
import { cn } from "@/lib/utils";

const TRANSFERS_PER_BATCH = 500; // Max = 512 (if no other MOVE calls in the transaction)
const getBatchTransactionGas = (transferCount: number) =>
  Math.max(0.02, 0.0016 * transferCount);

export default function AirdropCard() {
  const { suiClient } = useSettingsContext();
  const { account, address, signExecuteAndWaitForTransaction } =
    useWalletContext();
  const { appData } = useLoadedAppContext();
  const { balancesCoinMetadataMap, getBalance, refresh } = useUserContext();

  // Progress
  const [hasFailed, setHasFailed] = useLocalStorage<boolean>(
    "airdrop-hasFailed",
    false,
  );

  const [keypair, setKeypair] = useState<Ed25519Keypair | undefined>(undefined);
  const [fundKeypairResult, setFundKeypairResult] = useLocalStorage<
    FundKeypairResult | undefined
  >("airdrop-fundKeypairResults", undefined);
  const [makeBatchTransferResults, setMakeBatchTransferResults] =
    useLocalStorage<MakeBatchTransferResult[] | undefined>(
      "airdrop-makeBatchTransferResults",
      undefined,
    );
  const [lastExecutedBatchTransferDigest, setLastExecutedBatchTransferDigest] =
    useLocalStorage<string | undefined>(
      "airdrop-lastExecutedBatchTransferDigest",
      undefined,
    );
  const [
    returnAllOwnedObjectsAndSuiToUserResult,
    setReturnAllOwnedObjectsAndSuiToUserResult,
  ] = useState<ReturnAllOwnedObjectsAndSuiToUserResult | undefined>(undefined);

  const currentFlowDigests = useMemo(
    () =>
      Array.from(
        new Set(
          [
            fundKeypairResult?.res.digest,
            ...(makeBatchTransferResults ?? []).map((x) => x.res.digest),
            lastExecutedBatchTransferDigest, // May overlap with the last entry in `makeBatchTransferResults`
          ].filter(Boolean) as string[],
        ),
      ),
    [
      fundKeypairResult,
      makeBatchTransferResults,
      lastExecutedBatchTransferDigest,
    ],
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

    setKeypair(undefined);
    setFundKeypairResult(undefined);
    setMakeBatchTransferResults(undefined);
    setLastExecutedBatchTransferDigest(undefined);
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
    if (isSubmitting)
      return { isDisabled: true, title: hasFailed ? "Resume" : "Airdrop" };
    if (hasFailed) return { isDisabled: false, title: "Resume" };
    if (!!returnAllOwnedObjectsAndSuiToUserResult)
      return { isDisabled: true, isSuccess: true };

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
        _keypair = (await createKeypair(account, signPersonalMessage)).keypair;
        setKeypair(_keypair);
      }

      // 1.2) Check
      await checkIfKeypairCanBeUsed(currentFlowDigests, _keypair, suiClient);

      // 1.3) Fund
      let _fundKeypairResult = fundKeypairResult;
      if (_fundKeypairResult === undefined) {
        _fundKeypairResult = await fundKeypair(
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
        );
        setFundKeypairResult(_fundKeypairResult);
      }

      // 2) Create and send keypair transactions
      // 2.1) Make batch transfers
      let _makeBatchTransferResults = makeBatchTransferResults;
      if (
        _makeBatchTransferResults === undefined ||
        _makeBatchTransferResults.length < batches.length
      ) {
        for (let i = 0; i < batches.length; i++) {
          if (
            _makeBatchTransferResults !== undefined &&
            i <= _makeBatchTransferResults.length - 1
          ) {
            console.log("[onSubmitClick] Skipping batch", i);
            continue;
          }

          // Will always be undefined unless the last batch transfer failed, or the user
          // closed the app after executing the last batch transfer but before waiting for it
          if (lastExecutedBatchTransferDigest !== undefined) {
            try {
              // Check if the last executed batch transfer was successful
              const makeBatchTransferResult: MakeBatchTransferResult = {
                batch: batches[i],
                res: await keypairWaitForTransaction(
                  lastExecutedBatchTransferDigest,
                  suiClient,
                ),
              };
              _makeBatchTransferResults = [
                ...(_makeBatchTransferResults ?? []),
                makeBatchTransferResult,
              ];
              setMakeBatchTransferResults(_makeBatchTransferResults);
              setLastExecutedBatchTransferDigest(undefined);

              continue;
            } catch (err) {
              console.error(err);
              // Attempt the transfer again below
            }
          }

          try {
            const makeBatchTransferResult = await makeBatchTransfer(
              token,
              batches[i],
              _keypair,
              suiClient,
              (res) => setLastExecutedBatchTransferDigest(res.digest),
            );
            _makeBatchTransferResults = [
              ...(_makeBatchTransferResults ?? []),
              makeBatchTransferResult,
            ];
            setMakeBatchTransferResults(_makeBatchTransferResults);
            setLastExecutedBatchTransferDigest(undefined);
          } catch (err) {
            console.error(err);
            setLastExecutedBatchTransferDigest(undefined);

            throw err;
          }
        }
      }

      // 2.2) Return objects and unused SUI to user
      let _returnAllOwnedObjectsAndSuiToUserResult =
        returnAllOwnedObjectsAndSuiToUserResult;
      if (_returnAllOwnedObjectsAndSuiToUserResult === undefined) {
        _returnAllOwnedObjectsAndSuiToUserResult =
          await returnAllOwnedObjectsAndSuiToUser(address, _keypair, suiClient);
        setReturnAllOwnedObjectsAndSuiToUserResult(
          _returnAllOwnedObjectsAndSuiToUserResult,
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
            hasFailed && "pointer-events-none",
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
            isDragAndDropDisabled={hasFailed || isStepsDialogOpen}
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

          {hasFailed && !returnAllOwnedObjectsAndSuiToUserResult && (
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
