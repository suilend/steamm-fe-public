import { useEffect } from "react";
import { CheckCircle, ExternalLink, XCircle } from "lucide-react";
import { useSettingsContext } from "@suilend/frontend-sui-next";
import { cn } from "@/lib/utils";
import { TokenCreationStatus, useLaunch } from "@/contexts/LaunchContext";
import { Button } from "../ui/button";


export default function TokenCreationProgress({onSubmit}: {onSubmit: () => void}) {
  const { explorer } = useSettingsContext();
  const { config } = useLaunch();
  const { status, transactionDigests, tokenName, tokenSymbol, error, initialSupply } = config;

  const steps = function(initialSupply: string, tokenSymbol: string) {
    return [
      {
        status: TokenCreationStatus.Pending,
        label: "Creating Token Type",
        description: "Publishing your token definition to the blockchain. This creates the token type but doesn't mint any tokens yet.",
    },
    {
      status: TokenCreationStatus.Publishing,
      label: "Publishing Token Type",
      description: "Publishing your token definition to the blockchain. This creates the token type but doesn't mint any tokens yet.",
    },
    {
      status: TokenCreationStatus.Minting,
      label: "Minting Token Supply",
      description: `Creating ${initialSupply} ${tokenSymbol} tokens and transferring them to your wallet.`,
    },
    {
      status: TokenCreationStatus.Pooling,
      label: "Creating Pool",
      description: "Creating a pool for your token. This creates a pool for your token and transfers the initial supply to the pool.",
    }
  ]
  }

  if (status === TokenCreationStatus.Pending || status === TokenCreationStatus.Publishing || status === TokenCreationStatus.Minting) {
    return (
      <div className="flex flex-col items-center space-y-4 p-4 text-center sm:p-6 w-full">
        {status !== TokenCreationStatus.Pending && <div className="relative h-12 w-12">
          <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-4 border-border border-t-primary"></div>
        </div>}

        {/* Progress indicator with connected circles */}
        <div className="flex w-full max-w-md flex-col items-center gap-6 pt-4">
          <div className="relative flex w-full max-w-[240px] items-center justify-between">
            {steps(initialSupply, tokenSymbol).map((step, index) => (
              <div key={step.status} className="flex flex-col items-center">
                <div
                  className={cn(
                    "rounded-full relative z-10 flex h-10 w-10 items-center justify-center border-2",
                    {
                      "border-primary": step.status === status,
                      "border-border": step.status > status,
                      "border-success bg-success text-background": step.status < status,
                    },
                  )}
                >
                  {step.status === status ? <CheckCircle className="h-5 w-5" /> : <span className="text-xs">{index + 1}</span>}
                </div>
                <span className="text-xs mt-2 text-secondary-foreground">
                  {step.label}
                </span>
              </div>
            )).reduce((acc, step, index) => {
              return [acc, <div
                className={cn(
                  "h-[2px] w-16 -translate-y-1/2",
                  
                  index < status ? "bg-success" : "bg-gradient-to-r from-foreground to-border"

                )}
              />, step];
            }, [] as React.ReactNode[])}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          Do not close this window or reload the page.
        </p>
      </div>
    );
  }

  if (status === TokenCreationStatus.Success) {
    return (
      <div className="flex flex-col items-center space-y-4 p-4 text-center sm:p-6">
        <CheckCircle className="h-12 w-12 text-success" />
        <h3 className="text-lg sm:text-xl font-semibold">
          Token Created Successfully!
        </h3>
        <p className="text-sm text-muted-foreground">
          Your token {tokenName} ({tokenSymbol}) has been successfully created
          {initialSupply
            ? ` and ${initialSupply} tokens have been minted to your wallet`
            : ""}
          .
        </p>

        {/* Progress indicator with connected circles for success */}
        <div className="flex w-full max-w-md flex-col items-center gap-6 pt-4">
          <div className="relative flex w-full max-w-[240px] items-center justify-between">
            {/* First step: Create Type */}
            <div className="flex flex-col items-center">
              <div className="rounded-full relative z-10 flex h-10 w-10 items-center justify-center border-2 border-success bg-success text-background">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-xs mt-2 text-secondary-foreground">
                Create Type
              </span>
            </div>

            {/* Connecting line */}
            <div className="absolute left-0 top-5 h-[2px] w-full -translate-y-1/2 bg-success"></div>

            {/* Second step: Mint Supply */}
            <div className="flex flex-col items-center">
              <div className="rounded-full relative z-10 flex h-10 w-10 items-center justify-center border-2 border-success bg-success text-background">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-xs mt-2 text-secondary-foreground">
                Mint Supply
              </span>
            </div>
          </div>
        </div>

        {transactionDigests.publish && (
          <a
            href={explorer.buildTxUrl(transactionDigests.publish)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground mt-2 inline-flex items-center underline"
          >
            View transaction details
            <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        )}
        <div className="flex w-full flex-col space-y-2 pt-4 sm:w-auto sm:flex-row sm:space-x-4 sm:space-y-0">
          <button
            id="continue-button"
            onClick={onSubmit}
            className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
          >
            <p className="text-p2 text-button-1-foreground">Continue to Pool</p>
          </button>
        </div>
      </div>
    );
  }

  if (status === TokenCreationStatus.Error) {
    return (
      <div className="flex flex-col items-center space-y-4 p-4 text-center sm:p-6">
        <XCircle className="h-12 w-12 text-error" />

        <h3 className="text-lg sm:text-xl font-semibold">
          Token Launch Failed
        </h3>

        <p className="text-sm text-muted-foreground">
          We encountered an error during the token creation process. The token
          type may have been created, but the initial supply minting might have
          failed.
        </p>

        {error && (
          <div className="text-sm w-full max-w-md rounded-md border border-error bg-card p-3 text-left sm:p-4">
            <p className="font-semibold">Error details:</p>
            <p className="text-xs sm:text-sm mt-1 break-words text-error">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex w-full flex-col space-y-2 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Button
              variant="outline"
              onClick={() => {}}
              className="w-full min-w-[120px] sm:w-auto"
            >
              Try Again
            </Button>

        </div>
      </div>
    );
  }

  return null;
}
