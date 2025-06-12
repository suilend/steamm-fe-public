import Link from "next/link";
import { useMemo } from "react";

import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { ExternalLink } from "lucide-react";

import Dialog from "@/components/Dialog";
import Step from "@/components/Step";
import { CreateCoinResult } from "@/lib/createCoin";
import {
  CreateBTokenAndBankForTokenResult,
  CreatePoolAndDepositInitialLiquidityResult,
} from "@/lib/createPool";
import { GetBTokenAndBankForTokenResult } from "@/lib/createPool";
import {
  FundKeypairResult,
  ReturnAllOwnedObjectsAndSuiToUserResult,
} from "@/lib/keypair";
import { MintTokenResult } from "@/lib/launchToken";
import { POOL_URL_PREFIX } from "@/lib/navigation";

interface LaunchTokenStepsDialogProps {
  isOpen: boolean;
  fundKeypairResult: FundKeypairResult | undefined;
  createTokenResult: CreateCoinResult | undefined;
  mintTokenResult: MintTokenResult | undefined;
  bTokensAndBankIds: [
    (
      | GetBTokenAndBankForTokenResult
      | CreateBTokenAndBankForTokenResult
      | undefined
    ),
    (
      | GetBTokenAndBankForTokenResult
      | CreateBTokenAndBankForTokenResult
      | undefined
    ),
  ];
  createdLpToken: CreateCoinResult | undefined;
  createPoolResult: CreatePoolAndDepositInitialLiquidityResult | undefined;
  returnAllOwnedObjectsAndSuiToUserResult:
    | ReturnAllOwnedObjectsAndSuiToUserResult
    | undefined;
  reset: () => void;
}

export default function LaunchTokenStepsDialog({
  isOpen,
  fundKeypairResult,
  createTokenResult,
  mintTokenResult,
  bTokensAndBankIds,
  createdLpToken,
  createPoolResult,
  returnAllOwnedObjectsAndSuiToUserResult,
  reset,
}: LaunchTokenStepsDialogProps) {
  const currentStep: number = useMemo(() => {
    if (fundKeypairResult === undefined) return 1;
    if (createTokenResult === undefined) return 2;
    if (mintTokenResult === undefined) return 3;
    if (
      bTokensAndBankIds.some((bTokenAndBankId) => bTokenAndBankId === undefined)
    )
      return 4;
    if (createdLpToken === undefined) return 5;
    if (createPoolResult === undefined) return 6;
    if (returnAllOwnedObjectsAndSuiToUserResult === undefined) return 7;
    return 99;
  }, [
    fundKeypairResult,
    createTokenResult,
    mintTokenResult,
    bTokensAndBankIds,
    createdLpToken,
    createPoolResult,
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
        title: { children: "Launch token" },
        description: "Don't close the window or refresh the page",
        showCloseButton: !returnAllOwnedObjectsAndSuiToUserResult
          ? false
          : true,
      }}
      dialogContentInnerClassName="max-w-sm"
    >
      <div className="flex w-full flex-col gap-6">
        {/* Steps */}
        <div className="flex w-full flex-col gap-4">
          {/* Token steps */}
          <div className="flex w-full flex-col gap-3">
            <div className="text-p3 text-tertiary-foreground">Token</div>

            <Step
              number={1}
              title="Setup"
              isCompleted={currentStep > 1}
              isCurrent={currentStep === 1}
              res={fundKeypairResult ? [fundKeypairResult.res] : []}
            />
            <Step
              number={2}
              title="Create token"
              isCompleted={currentStep > 2}
              isCurrent={currentStep === 2}
              res={createTokenResult ? [createTokenResult.res] : []}
            />
            <Step
              number={3}
              title="Mint token"
              isCompleted={currentStep > 3}
              isCurrent={currentStep === 3}
              res={mintTokenResult ? [mintTokenResult.res] : []}
            />
          </div>

          {/* Pool steps */}
          <div className="flex w-full flex-col gap-3">
            <div className="text-p3 text-tertiary-foreground">Pool</div>

            <Step
              number={1}
              title="Create bTokens and banks"
              isCompleted={currentStep > 4}
              isCurrent={currentStep === 4}
              res={bTokensAndBankIds.reduce((acc, bTokenAndBankId) => {
                if (bTokenAndBankId === undefined) return acc;

                return "createBankRes" in bTokenAndBankId
                  ? [
                      ...acc,
                      bTokenAndBankId.createBTokenResult.res,
                      bTokenAndBankId.createBankRes,
                    ]
                  : acc;
              }, [] as SuiTransactionBlockResponse[])}
            />
            <Step
              number={2}
              title="Create LP token"
              isCompleted={currentStep > 5}
              isCurrent={currentStep === 5}
              res={createdLpToken ? [createdLpToken.res] : []}
            />
            <Step
              number={3}
              title="Create pool and deposit initial liquidity"
              isCompleted={currentStep > 6}
              isCurrent={currentStep === 6}
              res={createPoolResult ? [createPoolResult.res] : []}
            />
            <Step
              number={4}
              title="Finalize"
              isCompleted={currentStep > 7}
              isCurrent={currentStep === 7}
              res={
                returnAllOwnedObjectsAndSuiToUserResult
                  ? [returnAllOwnedObjectsAndSuiToUserResult.res]
                  : []
              }
            />
          </div>
        </div>

        {!!returnAllOwnedObjectsAndSuiToUserResult && (
          <Link
            className="flex h-14 w-full flex-row items-center justify-center gap-2 rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80"
            href={`${POOL_URL_PREFIX}/${createPoolResult!.poolId}`} // Should always be defined
            target="_blank"
          >
            <p className="text-p1 text-button-1-foreground">Go to pool</p>
            <ExternalLink className="h-4 w-4 text-button-1-foreground" />
          </Link>
        )}
      </div>
    </Dialog>
  );
}
