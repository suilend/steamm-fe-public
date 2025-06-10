import { ChangeEvent, useMemo, useState } from "react";

import { useSignPersonalMessage } from "@mysten/dapp-kit";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import BigNumber from "bignumber.js";
import { parse } from "csv-parse/sync";
import { chunk } from "lodash";

import {
  NORMALIZED_SUI_COINTYPE,
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
import AirdropStepsDialog from "@/components/airdrop/AirdropStepsDialog";
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
import {
  FundKeypairResult,
  ReturnAllOwnedObjectsAndSuiToUserResult,
  checkIfKeypairCanBeUsed,
  createKeypair,
  fundKeypair,
  returnAllOwnedObjectsAndSuiToUser,
} from "@/lib/keypair";
import { cn } from "@/lib/utils";

const VALID_MIME_TYPES = ["text/csv"];
const TRANSFERS_PER_BATCH = 100; // Max = 512 (if no other MOVE calls in the transaction)
const getBatchTransactionGas = (transferCount: number) =>
  Math.max(0.02, 0.0016 * transferCount);

export default function AirdropCard() {
  const { suiClient } = useSettingsContext();
  const { account, address, signExecuteAndWaitForTransaction } =
    useWalletContext();
  const { appData } = useLoadedAppContext();
  const { balancesCoinMetadataMap, getBalance, refresh } = useUserContext();

  // Progress
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  const [keypair, setKeypair] = useState<Ed25519Keypair | undefined>(undefined);
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

  const currentFlowDigests = useMemo(
    () =>
      [
        fundKeypairResult?.res.digest,
        ...(makeBatchTransferResults ?? []).map((x) => x.res.digest),
      ].filter(Boolean) as string[],
    [fundKeypairResult, makeBatchTransferResults],
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

  const [coinType, setCoinType] = useState<string | undefined>(undefined);
  const token =
    coinType !== undefined
      ? getToken(coinType, balancesCoinMetadataMap![coinType])
      : undefined;

  // State - CSV
  const [isLoadingCsv, setIsLoadingCsv] = useState<boolean>(false);

  const [addressAmountRows, setAddressAmountRows] = useState<
    AirdropRow[] | undefined
  >(undefined);
  const batches = useMemo(
    () => chunk(addressAmountRows ?? [], TRANSFERS_PER_BATCH),
    [addressAmountRows],
  );

  const resetCsv = () => {
    setIsLoadingCsv(false);
    (document.getElementById("csv-upload") as HTMLInputElement).value = "";

    setAddressAmountRows(undefined);
  };

  const handleFile = async (file: File) => {
    try {
      setIsLoadingCsv(true);
      setAddressAmountRows(undefined);

      // Validate file type
      if (!VALID_MIME_TYPES.includes(file.type))
        throw new Error("Please upload a CSV file");

      // Read file
      const reader = new FileReader();
      reader.onload = (e) => {
        // const base64String = e.target?.result as string;

        const text = e.target?.result as string;

        const records: { [key: string]: string }[] = parse(text, {
          columns: true,
          delimiter: ",",
          skip_empty_lines: true,
        });

        if (records.length === 0) throw new Error("No rows found");
        if (Object.keys(records[0]).length !== 2)
          throw new Error(
            "Each row must have exactly 2 columns (address, amount)",
          );

        const parsedRecords: AirdropRow[] = records.map((record, index) => {
          const addressKey = Object.keys(record)[0];
          const amountKey = Object.keys(record)[1];

          return {
            number: index + 1,
            address: record[addressKey],
            amount: record[amountKey],
          };
        });

        setTimeout(() => {
          setIsLoadingCsv(false);
          setAddressAmountRows(parsedRecords);
        }, 250);
      };
      reader.onerror = () => {
        throw new Error("Failed to upload CSV file");
      };
      reader.readAsText(file);
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to upload CSV file", err as Error);

      resetCsv();
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      resetCsv();
      return;
    }

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
  const reset = () => {
    // Progress
    setHasFailed(false);

    setFundKeypairResult(undefined);
    setMakeBatchTransferResults(undefined);
    setReturnAllOwnedObjectsAndSuiToUserResult(undefined);

    // State
    setCoinType(undefined);

    resetCsv();
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting)
      return { isDisabled: true, title: hasFailed ? "Retry" : "Airdrop" };
    if (hasFailed) return { isDisabled: false, title: "Retry" };
    if (!!returnAllOwnedObjectsAndSuiToUserResult)
      return { isDisabled: true, isSuccess: true };

    // Token
    if (token === undefined)
      return { isDisabled: true, title: "Select a token" };

    // CSV
    if (addressAmountRows === undefined)
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
    if (!token || addressAmountRows === undefined) return; // Should not happen

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

          const makeBatchTransferResult = await makeBatchTransfer(
            token,
            batches[i],
            _keypair,
            suiClient,
          );

          _makeBatchTransferResults = [
            ...(_makeBatchTransferResults ?? []),
            makeBatchTransferResult,
          ];
          setMakeBatchTransferResults(_makeBatchTransferResults);
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
        })} ${token.symbol} to ${addressAmountRows.length} ${
          addressAmountRows.length === 1 ? "address" : "addresses"
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
          <Parameter
            className="gap-3"
            labelContainerClassName="flex-col gap-1 items-start"
            label="CSV file"
            labelEndDecorator="Address & amount columns, comma-separated"
          >
            <input
              id="csv-upload"
              type="file"
              accept={VALID_MIME_TYPES.join(",")}
              onChange={handleFileSelect}
              disabled={isLoadingCsv}
            />
          </Parameter>

          {/* Preview */}
          {token !== undefined &&
            (isLoadingCsv || addressAmountRows !== undefined) && (
              <AirdropAddressAmountTable
                token={token}
                rows={addressAmountRows}
              />
            )}

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
              {addressAmountRows !== undefined ? (
                <p className="text-p2 text-foreground">
                  {addressAmountRows.length}
                </p>
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
              {addressAmountRows !== undefined ? (
                <p className="text-p2 text-foreground">{batches.length}</p>
              ) : (
                <p className="text-p2 text-foreground">--</p>
              )}
            </Parameter>

            {/* Max fee */}
            <Parameter label="Max fee" isHorizontal>
              {addressAmountRows !== undefined ? (
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
