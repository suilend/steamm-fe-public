import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSignPersonalMessage } from "@mysten/dapp-kit";
import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import BigNumber from "bignumber.js";
import { chunk } from "lodash";
import { useLocalStorage } from "usehooks-ts";

import {
  FundKeypairResult,
  NORMALIZED_SUI_COINTYPE,
  ReturnAllOwnedObjectsAndSuiToUserResult,
  checkIfKeypairCanBeUsed,
  checkLastTransactionSignature,
  createKeypair,
  formatInteger,
  formatToken,
  fundKeypair,
  getToken,
  isSui,
  onSign,
  returnAllOwnedObjectsAndSuiToUser,
} from "@suilend/sui-fe";
import {
  showErrorToast,
  showSuccessToast,
  useLastSignedTransaction,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import AirdropAddressAmountTable from "@/components/airdrop/AirdropAddressAmountTable";
import AirdropStepsDialog from "@/components/airdrop/AirdropStepsDialog";
import CsvUpload from "@/components/airdrop/CsvUpload";
import Divider from "@/components/Divider";
import Parameter from "@/components/Parameter";
import SelectPopover from "@/components/SelectPopover";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import TokenSelectionDialog from "@/components/swap/TokenSelectionDialog";
import TextInput from "@/components/TextInput";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import {
  AirdropRow,
  MakeBatchTransferResult,
  makeBatchTransfer,
} from "@/lib/airdrop";
import { formatTextInputValue } from "@/lib/format";
import doubleUpCitizenObjectIds from "@/lib/nft-collections/doubleup-citizen-object-ids.json";
import primeMachinObjectIds from "@/lib/nft-collections/prime-machin-object-ids.json";
import rootletsObjectIds from "@/lib/nft-collections/rootlets-object-ids.json";
import { SelectPopoverOption } from "@/lib/select";
import { cn } from "@/lib/utils";

enum LastSignedTransactionType {
  FUND_KEYPAIR = "fundKeypair",
  MAKE_BATCH_TRANSFER = "makeBatchTransfer",
  RETURN_ALL_OWNED_OBJECTS_AND_SUI_TO_USER = "returnAllOwnedObjectsAndSuiToUser",
}

enum RecipientsType {
  CSV = "csv",
  ROOTLETS = "rootlets",
  DOUBLE_UP_CITIZEN = "doubleUpCitizen",
  PRIME_MACHIN = "primeMachin",
}
const recipientsTypeNameMap: Record<RecipientsType, string> = {
  [RecipientsType.CSV]: "CSV file",
  [RecipientsType.ROOTLETS]: "Rootlets",
  [RecipientsType.PRIME_MACHIN]: "Prime Machin",
  [RecipientsType.DOUBLE_UP_CITIZEN]: "DoubleUp Citizen",
};

const TRANSFERS_PER_BATCH = 500; // Max = 512 (if no other MOVE calls in the transaction)
const getBatchTransactionGas = (transferCount: number) =>
  Math.max(0.01, 0.0016 * transferCount);

export default function AirdropCard() {
  const { suiClient } = useSettingsContext();
  const { account, address, signExecuteAndWaitForTransaction } =
    useWalletContext();
  const { appData } = useLoadedAppContext();
  const { balancesCoinMetadataMap, getBalance, refresh } = useUserContext();

  // Progress
  const [hasFailed, setHasFailed] = useState<boolean>(false); // Don't use `localStorage` (no need to persist)
  const { lastSignedTransactionRef, setLastSignedTransaction } =
    useLastSignedTransaction<LastSignedTransactionType>("airdrop");

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
  console.log(
    "[AirdropCard] - fundKeypairResult:",
    fundKeypairResult,
    "makeBatchTransferResults:",
    makeBatchTransferResults,
    "returnAllOwnedObjectsAndSuiToUserResult:",
    returnAllOwnedObjectsAndSuiToUserResult,
  );

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

  // State - recipients
  const [batches, setBatches] = useLocalStorage<AirdropRow[][] | undefined>(
    "airdrop-batches",
    undefined,
  );

  const recipientsTypeOptions: SelectPopoverOption[] = useMemo(
    () => [
      {
        id: RecipientsType.CSV,
        name: recipientsTypeNameMap[RecipientsType.CSV],
        description: "Address & amount columns with headers, comma-separated",
      },
      {
        id: RecipientsType.ROOTLETS,
        name: recipientsTypeNameMap[RecipientsType.ROOTLETS],
        description: "NFT collection",
        count: rootletsObjectIds.length,
      },
      {
        id: RecipientsType.PRIME_MACHIN,
        name: recipientsTypeNameMap[RecipientsType.PRIME_MACHIN],
        description: "NFT collection",
        count: primeMachinObjectIds.length,
      },
      {
        id: RecipientsType.DOUBLE_UP_CITIZEN,
        name: recipientsTypeNameMap[RecipientsType.DOUBLE_UP_CITIZEN],
        description: "NFT collection",
        count: doubleUpCitizenObjectIds.length,
      },
    ],
    [],
  );
  const [recipientsType, setRecipientsType] = useLocalStorage<RecipientsType>(
    "airdrop-recipientsType",
    RecipientsType.CSV,
  );

  // State - recipients - CSV
  const [csvFilename, setCsvFilename] = useLocalStorage<string>(
    "airdrop-csvFilename",
    "",
  );
  const [csvFileSize, setCsvFileSize] = useLocalStorage<string>(
    "airdrop-csvFileSize",
    "",
  );

  // State - recipients - NFT collection
  const amountPerNftInputRef = useRef<HTMLInputElement>(null);
  const [amountPerNft, setAmountPerNft] = useLocalStorage<string>(
    "airdrop-amountPerNft",
    "",
  );
  const isAmountPerNftInvalid = useCallback(
    (value: string) =>
      value === "" || isNaN(+value) || new BigNumber(value).lte(0),
    [],
  );

  const onAmountPerNftChange = useCallback(
    (value: string) => {
      const formattedValue = formatTextInputValue(value, token?.decimals ?? 9);
      setAmountPerNft(formattedValue);
    },
    [token, setAmountPerNft],
  );

  const getNftCollectionObjectIds = (recipientsType: RecipientsType) => {
    if (recipientsType === RecipientsType.ROOTLETS) return rootletsObjectIds;
    else if (recipientsType === RecipientsType.DOUBLE_UP_CITIZEN)
      return doubleUpCitizenObjectIds;
    else if (recipientsType === RecipientsType.PRIME_MACHIN)
      return primeMachinObjectIds;
    throw new Error("Invalid NFT collection");
  };

  useEffect(() => {
    if (recipientsType === RecipientsType.CSV) return;

    if (isAmountPerNftInvalid(amountPerNft)) {
      setBatches(undefined);
    } else {
      setBatches(
        chunk(
          getNftCollectionObjectIds(recipientsType).map((objectId, index) => ({
            number: index + 1,
            address: objectId,
            amount: amountPerNft,
          })),
          TRANSFERS_PER_BATCH,
        ),
      );
    }
  }, [recipientsType, isAmountPerNftInvalid, amountPerNft, setBatches]);

  // Calcs
  const totalTokenAmount: BigNumber | undefined = useMemo(
    () =>
      token === undefined || batches === undefined
        ? undefined
        : batches
            .flat()
            .reduce(
              (acc, row) =>
                acc.plus(
                  new BigNumber(row.amount).decimalPlaces(
                    token.decimals,
                    BigNumber.ROUND_DOWN,
                  ),
                ),
              new BigNumber(0),
            ),
    [token, batches],
  );
  const totalGasAmount: BigNumber | undefined = useMemo(
    () =>
      batches === undefined
        ? undefined
        : batches.reduce(
            (acc, batch) => acc.plus(getBatchTransactionGas(batch.length)),
            new BigNumber(0),
          ),
    [batches],
  );

  // Submit
  const resetRecipients = (
    _recipientsType: RecipientsType = RecipientsType.CSV,
  ) => {
    setBatches(undefined);
    setRecipientsType(_recipientsType);

    setCsvFilename("");
    setCsvFileSize("");
    const csvUploadInput = document.getElementById(
      "csv-upload",
    ) as HTMLInputElement;
    if (csvUploadInput) csvUploadInput.value = "";

    setAmountPerNft("");
  };
  const reset = () => {
    // Progress
    setHasFailed(false);
    setLastSignedTransaction(undefined);

    setFundKeypairResult(undefined);
    setMakeBatchTransferResults(undefined);
    setReturnAllOwnedObjectsAndSuiToUserResult(undefined);

    // State
    setCoinType(undefined);

    resetRecipients();
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) return { isLoading: true, isDisabled: true };

    if (hasFailed && !returnAllOwnedObjectsAndSuiToUserResult)
      return { isDisabled: false, title: "Retry" };
    if (
      (lastSignedTransactionRef.current !== undefined ||
        currentFlowDigests.length > 0) &&
      !returnAllOwnedObjectsAndSuiToUserResult
    )
      return { isDisabled: false, title: "Resume" };
    if (!!returnAllOwnedObjectsAndSuiToUserResult)
      return { isSuccess: true, isDisabled: true };

    // Token
    if (token === undefined)
      return { isDisabled: true, title: "Select a token" };

    // Recipients
    if (
      batches === undefined ||
      totalTokenAmount === undefined ||
      totalGasAmount === undefined
    ) {
      if (recipientsType === RecipientsType.CSV)
        return { isDisabled: true, title: "Upload a CSV file" };
      else
        return {
          isDisabled: true,
          title: `Enter ${token.symbol} per NFT`,
        };
    }

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
        totalTokenAmount.plus(isSui(token.coinType) ? totalGasAmount : 0),
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
    if (
      token === undefined ||
      batches === undefined ||
      totalTokenAmount === undefined ||
      totalGasAmount === undefined
    )
      return; // Should not happen

    try {
      if (!account?.publicKey || !address)
        throw new Error("Wallet not connected");

      setIsSubmitting(true);

      // 1) Create, check, and fund keypair
      // 1.1) Create
      let _keypair = keypair;
      if (_keypair === undefined) {
        console.log("[onSubmitClick] createKeypair");

        _keypair = (await createKeypair(account, signPersonalMessage)).keypair;
        setKeypair(_keypair);
      }

      // 1.2) Check
      const { lastCurrentFlowTransaction } = await checkIfKeypairCanBeUsed(
        lastSignedTransactionRef.current?.signedTransaction,
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
        await checkLastTransactionSignature<LastSignedTransactionType>(
          LastSignedTransactionType.FUND_KEYPAIR,
          lastCurrentFlowTransaction,
          lastSignedTransactionRef.current,
          setLastSignedTransaction,
          suiClient,
          async (res: SuiTransactionBlockResponse) => {
            console.log("[onSubmitClick] fundKeypair - validCallback");
            setFundKeypairResult({ res });
          },
          async () => {
            console.log("[onSubmitClick] fundKeypair - invalidCallback");

            const _fundKeypairResult: FundKeypairResult = await fundKeypair(
              [
                {
                  ...token,
                  amount: totalTokenAmount.plus(
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

          await checkLastTransactionSignature<LastSignedTransactionType>(
            LastSignedTransactionType.MAKE_BATCH_TRANSFER,
            lastCurrentFlowTransaction,
            lastSignedTransactionRef.current,
            setLastSignedTransaction,
            suiClient,
            async (res: SuiTransactionBlockResponse) => {
              console.log(
                `[onSubmitClick] makeBatchTransfer ${i} - validCallback`,
              );
              setMakeBatchTransferResults((prev) => [
                ...(prev ?? []),
                { batch, res },
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
        await checkLastTransactionSignature<LastSignedTransactionType>(
          LastSignedTransactionType.RETURN_ALL_OWNED_OBJECTS_AND_SUI_TO_USER,
          lastCurrentFlowTransaction,
          lastSignedTransactionRef.current,
          setLastSignedTransaction,
          suiClient,
          async (res: SuiTransactionBlockResponse) => {
            console.log(
              "[onSubmitClick] returnAllOwnedObjectsAndSuiToUser - validCallback",
            );
            setReturnAllOwnedObjectsAndSuiToUserResult({ res });
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
              ); // Dry run will throw if there is no gas object (i.e. if we've already returned all owned objects and SUI to user)
            setReturnAllOwnedObjectsAndSuiToUserResult(
              _returnAllOwnedObjectsAndSuiToUserResult,
            );
          },
        );
      }

      showSuccessToast(
        `Airdropped ${formatToken(totalTokenAmount, {
          dp: token.decimals,
          trimTrailingZeros: true,
        })} ${token.symbol} to ${
          recipientsType === RecipientsType.CSV
            ? `${batches.flat().length} ${batches.flat().length === 1 ? "address" : "addresses"}`
            : `the ${recipientsTypeNameMap[recipientsType]} NFT collection`
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

  // Steps dialog
  const isStepsDialogOpen =
    isSubmitting || !!returnAllOwnedObjectsAndSuiToUserResult;

  return (
    <>
      <AirdropStepsDialog
        isOpen={isStepsDialogOpen}
        token={token}
        batches={batches ?? []}
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
            (hasFailed ||
              lastSignedTransactionRef.current !== undefined ||
              currentFlowDigests.length > 0) &&
              "pointer-events-none",
          )}
        >
          {/* Token */}
          <div className="flex w-full flex-col gap-3">
            <p className="text-p2 text-secondary-foreground">Token</p>

            <TokenSelectionDialog
              triggerClassName="w-max px-3 border rounded-md"
              triggerIconSize={16}
              triggerLabelSelectedClassName="!text-p2"
              triggerLabelUnselectedClassName="!text-p2"
              triggerChevronClassName="!h-4 !w-4 !ml-0 !mr-0"
              token={token}
              tokens={tokens}
              onSelectToken={(token) => setCoinType(token.coinType)}
            />
          </div>

          {/* Recipients */}
          <div className="flex w-full flex-col gap-3">
            <p className="text-p2 text-secondary-foreground">Recipients</p>

            {/* Recipients type */}
            <SelectPopover
              className="bg-transparent w-full"
              align="start"
              maxWidth={1000}
              options={recipientsTypeOptions}
              values={[recipientsType]}
              onChange={(id) => {
                resetRecipients(id as RecipientsType);
                if ((id as RecipientsType) !== RecipientsType.CSV)
                  setTimeout(() => amountPerNftInputRef.current?.focus(), 100);
              }}
            />

            {/* CSV upload */}
            {recipientsType === RecipientsType.CSV ? (
              <CsvUpload
                isDragAndDropDisabled={
                  hasFailed ||
                  lastSignedTransactionRef.current !== undefined ||
                  currentFlowDigests.length > 0 ||
                  isStepsDialogOpen
                }
                token={token}
                csvRows={batches === undefined ? undefined : batches.flat()}
                setCsvRows={(rows: AirdropRow[] | undefined) =>
                  setBatches(
                    rows === undefined
                      ? undefined
                      : chunk(rows, TRANSFERS_PER_BATCH),
                  )
                }
                csvFilename={csvFilename}
                setCsvFilename={setCsvFilename}
                csvFileSize={csvFileSize}
                setCsvFileSize={setCsvFileSize}
              />
            ) : (
              // NFT collection
              <div className="flex w-full flex-row items-center gap-4">
                <div className="w-32">
                  <TextInput
                    ref={amountPerNftInputRef}
                    placeholder="Enter amount"
                    value={amountPerNft}
                    onChange={onAmountPerNftChange}
                  />
                </div>
                <p className="text-p2 text-secondary-foreground">
                  {token === undefined ? "Per" : `${token.symbol} per`}{" "}
                  {recipientsTypeNameMap[recipientsType]} NFT
                </p>
              </div>
            )}
          </div>

          {/* Table */}
          {token !== undefined && batches !== undefined && (
            <AirdropAddressAmountTable token={token} rows={batches.flat()} />
          )}
        </div>

        <Divider />

        <div className="flex w-full flex-col gap-2">
          {/* Airdrop */}
          <Parameter label="Airdrop" isHorizontal>
            {token !== undefined && totalTokenAmount !== undefined ? (
              <p className="text-p2 text-foreground">
                {formatToken(totalTokenAmount, {
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
            {batches !== undefined ? (
              <p className="text-p2 text-foreground">
                {formatInteger(batches.flat().length)}
              </p>
            ) : (
              <p className="text-p2 text-foreground">--</p>
            )}
          </Parameter>

          {/* Batches */}
          <Parameter
            label="Batches"
            isHorizontal
            labelEndDecorator={`${formatInteger(TRANSFERS_PER_BATCH)} transfers per batch`}
          >
            {batches !== undefined ? (
              <p className="text-p2 text-foreground">
                {formatInteger(batches.length)}
              </p>
            ) : (
              <p className="text-p2 text-foreground">--</p>
            )}
          </Parameter>

          {/* Max gas fee */}
          <Parameter label="Max gas fee" isHorizontal>
            {totalGasAmount !== undefined ? (
              <p className="text-p2 text-foreground">
                {formatToken(totalGasAmount, {
                  dp: appData.coinMetadataMap[NORMALIZED_SUI_COINTYPE].decimals,
                  trimTrailingZeros: true,
                })}{" "}
                SUI
              </p>
            ) : (
              <p className="text-p2 text-foreground">--</p>
            )}
          </Parameter>
        </div>

        <div className="flex w-full flex-col gap-1">
          <SubmitButton
            submitButtonState={submitButtonState}
            onClick={onSubmitClick}
          />

          {(hasFailed ||
            lastSignedTransactionRef.current !== undefined ||
            currentFlowDigests.length > 0) &&
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
