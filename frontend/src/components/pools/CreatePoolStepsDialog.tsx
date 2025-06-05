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
import { POOL_URL_PREFIX } from "@/lib/navigation";

interface CreatePoolStepsDialogProps {
  isOpen: boolean;
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
  reset: () => void;
}

export default function CreatePoolStepsDialog({
  isOpen,
  bTokensAndBankIds,
  createdLpToken,
  createPoolResult,
  reset,
}: CreatePoolStepsDialogProps) {
  const currentStep: number = useMemo(() => {
    if (
      bTokensAndBankIds.some((bTokenAndBankId) => bTokenAndBankId === undefined)
    )
      return 1;
    if (createdLpToken === undefined) return 2;
    if (createPoolResult === undefined) return 3;
    return 99;
  }, [bTokensAndBankIds, createdLpToken, createPoolResult]);

  return (
    <Dialog
      rootProps={{
        open: isOpen,
        onOpenChange: !createPoolResult ? undefined : reset,
      }}
      headerProps={{
        title: { children: "Create pool" },
        description: "Don't close the window or refresh the page",
        showCloseButton: !createPoolResult ? false : true,
      }}
      dialogContentInnerClassName="max-w-sm"
    >
      <div className="flex w-full flex-col gap-6">
        {/* Steps */}
        <div className="flex w-full flex-col gap-4">
          {/* Pool steps */}
          <div className="flex w-full flex-col gap-3">
            <Step
              number={1}
              title="Create bTokens and banks"
              isCompleted={currentStep > 1}
              isCurrent={currentStep === 1}
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
              isCompleted={currentStep > 2}
              isCurrent={currentStep === 2}
              res={createdLpToken ? [createdLpToken.res] : []}
            />
            <Step
              number={3}
              title="Create pool and deposit initial liquidity"
              isCompleted={currentStep > 3}
              isCurrent={currentStep === 3}
              res={createPoolResult ? [createPoolResult.res] : []}
            />
          </div>
        </div>

        {!!createPoolResult && (
          <Link
            className="flex h-14 w-full flex-row items-center justify-center gap-2 rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80"
            href={`${POOL_URL_PREFIX}/${createPoolResult.poolId}`} // Should always be defined
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
