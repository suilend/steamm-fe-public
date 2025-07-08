import { useMemo } from "react";

import {
  FundKeypairResult,
  ReturnAllOwnedObjectsAndSuiToUserResult,
  Token,
} from "@suilend/sui-fe";

import Dialog from "@/components/Dialog";
import Step from "@/components/Step";
import { AirdropRow, MakeBatchTransferResult } from "@/lib/airdrop";

interface AirdropStepsDialogProps {
  isOpen: boolean;
  token?: Token;
  batches?: AirdropRow[][];
  fundKeypairResult: FundKeypairResult | undefined;
  makeBatchTransferResults: MakeBatchTransferResult[] | undefined;
  returnAllOwnedObjectsAndSuiToUserResult:
    | ReturnAllOwnedObjectsAndSuiToUserResult
    | undefined;
  reset: () => void;
}

export default function AirdropStepsDialog({
  isOpen,
  token,
  batches,
  fundKeypairResult,
  makeBatchTransferResults,
  returnAllOwnedObjectsAndSuiToUserResult,
  reset,
}: AirdropStepsDialogProps) {
  const currentStep: number = useMemo(() => {
    if (fundKeypairResult === undefined) return 1;
    if (
      makeBatchTransferResults === undefined ||
      makeBatchTransferResults.length !== (batches ?? []).length
    )
      return 2;
    if (returnAllOwnedObjectsAndSuiToUserResult === undefined) return 3;
    return 99;
  }, [
    fundKeypairResult,
    makeBatchTransferResults,
    batches,
    returnAllOwnedObjectsAndSuiToUserResult,
  ]);

  return (
    <Dialog
      rootProps={{
        open: isOpen,
        onOpenChange: !returnAllOwnedObjectsAndSuiToUserResult
          ? undefined
          : reset,
      }}
      headerProps={{
        title: {
          children: ["Airdrop", token?.symbol].filter(Boolean).join(" "),
        },
        description: "Don't close this window or refresh the page",
        showCloseButton: !returnAllOwnedObjectsAndSuiToUserResult
          ? false
          : true,
      }}
      dialogContentInnerClassName="max-w-sm"
    >
      <div className="flex w-full flex-col gap-6">
        {/* Steps */}
        <div className="flex w-full flex-col gap-4">
          {/* Airdrop steps */}
          <div className="flex w-full flex-col gap-3">
            <Step
              number={1}
              title="Setup"
              isCompleted={currentStep > 1}
              isCurrent={currentStep === 1}
              res={fundKeypairResult ? [fundKeypairResult.res] : []}
            />
            <Step
              number={2}
              title="Airdrop"
              isCompleted={currentStep > 2}
              isCurrent={currentStep === 2}
              subSteps={(batches ?? []).map((batch, index) => {
                const prevAddressCount = (batches ?? [])
                  .slice(0, index)
                  .reduce((acc, batch) => acc + batch.length, 0);

                return {
                  number: index + 1,
                  title: `${prevAddressCount + 1}–${
                    prevAddressCount + batch.length
                  }`,
                  isCompleted:
                    currentStep > 2 &&
                    index <= (makeBatchTransferResults ?? []).length - 1,
                  isCurrent:
                    currentStep === 2 &&
                    index === (makeBatchTransferResults ?? []).length - 1 + 1,
                  res: (makeBatchTransferResults ?? [])
                    .filter((_, i) => i === index)
                    .map((res) => res.res),
                };
              })}
            />
            <Step
              number={3}
              title="Finalize"
              isCompleted={currentStep > 3}
              isCurrent={currentStep === 3}
              res={
                returnAllOwnedObjectsAndSuiToUserResult
                  ? [returnAllOwnedObjectsAndSuiToUserResult.res]
                  : []
              }
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
