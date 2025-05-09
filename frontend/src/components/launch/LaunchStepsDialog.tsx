import Link from "next/link";
import { useMemo } from "react";

import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Check, ExternalLink, Loader2 } from "lucide-react";

import { useSettingsContext } from "@suilend/frontend-sui-next";

import Dialog from "@/components/Dialog";
import SubmitButton from "@/components/SubmitButton";
import { CreateCoinResult } from "@/lib/createCoin";
import {
  CreateBTokenAndBankForTokenResult,
  CreatePoolAndDepositInitialLiquidityResult,
} from "@/lib/createPool";
import { GetBTokenAndBankForTokenResult } from "@/lib/createPool";
import { MintTokenResult } from "@/lib/launchToken";
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface StepProps {
  number: number;
  title: string;
  isCompleted?: boolean;
  isCurrent?: boolean;
  res?: SuiTransactionBlockResponse[];
}

function Step({ number, title, isCurrent, isCompleted, res }: StepProps) {
  const { explorer } = useSettingsContext();

  return (
    <div className="flex w-full flex-row items-center gap-3">
      <div
        className={cn(
          "flex h-6 w-6 flex-row items-center justify-center rounded-full",
          isCompleted
            ? "bg-success"
            : isCurrent
              ? "bg-transparent"
              : "bg-border",
        )}
      >
        {isCompleted ? (
          <Check className="h-4 w-4 text-background" />
        ) : isCurrent ? (
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        ) : (
          <p className="text-p3 text-secondary-foreground">{number}</p>
        )}
      </div>

      <div className="flex flex-row items-center gap-2">
        <p
          className={cn(
            "!text-p1 transition-colors",
            isCurrent ? "text-foreground" : "text-secondary-foreground",
          )}
        >
          {title}
        </p>

        {isCompleted && (
          <div className="flex flex-row items-center gap-1">
            {(res ?? []).map((r, index) => (
              <Link
                key={index}
                className="block flex flex-col justify-center text-secondary-foreground transition-colors hover:text-foreground"
                href={explorer.buildTxUrl(r.digest)}
                target="_blank"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface LaunchStepsDialogProps {
  isOpen: boolean;
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
  hasClearedCache: boolean;
  reset: () => void;
}

export default function LaunchStepsDialog({
  isOpen,
  createTokenResult,
  mintTokenResult,
  bTokensAndBankIds,
  createdLpToken,
  createPoolResult,
  hasClearedCache,
  reset,
}: LaunchStepsDialogProps) {
  const currentStep: number = useMemo(() => {
    if (createTokenResult === undefined) return 1;
    if (mintTokenResult === undefined) return 2;
    if (
      bTokensAndBankIds.some((bTokenAndBankId) => bTokenAndBankId === undefined)
    )
      return 3;
    if (createdLpToken === undefined) return 4;
    if (createPoolResult === undefined) return 5;
    return 99;
  }, [
    createTokenResult,
    mintTokenResult,
    bTokensAndBankIds,
    createdLpToken,
    createPoolResult,
  ]);

  return (
    <Dialog
      rootProps={{
        open: isOpen,
        onOpenChange: !hasClearedCache ? undefined : reset,
      }}
      headerProps={{
        title: {
          children: !hasClearedCache ? "Launching token" : "Launched token",
        },
        description: !hasClearedCache
          ? "Don't close the window or refresh the page"
          : "Created pool and deposited initial liquidity",
        showCloseButton: !hasClearedCache ? false : true,
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
              title="Create token"
              isCompleted={currentStep > 1}
              isCurrent={currentStep === 1}
              res={createTokenResult ? [createTokenResult.res] : []}
            />
            <Step
              number={2}
              title="Mint token"
              isCompleted={currentStep > 2}
              isCurrent={currentStep === 2}
              res={mintTokenResult ? [mintTokenResult.res] : []}
            />
          </div>

          {/* Pool steps */}
          <div className="flex w-full flex-col gap-3">
            <div className="text-p3 text-tertiary-foreground">Pool</div>

            <Step
              number={1}
              title="Create bTokens and banks"
              isCompleted={currentStep > 3}
              isCurrent={currentStep === 3}
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
              isCompleted={currentStep > 4}
              isCurrent={currentStep === 4}
              res={createdLpToken ? [createdLpToken.res] : []}
            />
            <Step
              number={3}
              title="Create pool and deposit initial liquidity"
              isCompleted={currentStep > 5}
              isCurrent={currentStep === 5}
              res={createPoolResult ? [createPoolResult.res] : []}
            />
          </div>
        </div>

        {createPoolResult &&
          (!hasClearedCache ? (
            <SubmitButton
              submitButtonState={{
                isLoading: true,
                isDisabled: true,
              }}
              onClick={() => {}}
            />
          ) : (
            <Link
              className="flex h-14 w-full flex-row items-center justify-center gap-2 rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80"
              href={`${POOL_URL_PREFIX}/${createPoolResult.poolId}`} // Should always be defined
              target="_blank"
            >
              <p className="text-p1 text-button-1-foreground">Go to pool</p>
              <ExternalLink className="h-4 w-4 text-button-1-foreground" />
            </Link>
          ))}
      </div>
    </Dialog>
  );
}
