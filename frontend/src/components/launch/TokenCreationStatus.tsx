import { useEffect } from "react";
import { ExternalLink, CheckCircle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSettingsContext } from "@suilend/frontend-sui-next";
import { cn } from "@/lib/utils";

export type TokenCreationStatus = "idle" | "pending" | "publishing" | "minting" | "success" | "error";

interface TokenCreationStatusProps {
  status: TokenCreationStatus;
  txDigest?: string | null;
  tokenName?: string;
  tokenSymbol?: string;
  error?: Error;
  onRetry?: () => void;
  onContinue?: () => void;
  actionButtonLabel?: string;
  initialSupply?: string;
}

export default function TokenCreationStatus({
  status,
  txDigest,
  tokenName,
  tokenSymbol,
  error,
  onRetry,
  onContinue,
  actionButtonLabel,
  initialSupply,
}: TokenCreationStatusProps) {
  const { explorer } = useSettingsContext();
  
  // Auto-focus the continue button when status changes to success
  useEffect(() => {
    if (status === "success" && onContinue) {
      const continueButton = document.getElementById("continue-button");
      if (continueButton) {
        continueButton.focus();
      }
    }
  }, [status, onContinue]);

  // Render appropriate UI based on status
  if (status === "idle") {
    return null;
  }

  if (status === "pending" || status === "publishing" || status === "minting") {
    // Determine styling and content for the first step
    let firstStepStyles = "border-border bg-background";
    let firstStepContent = <span className="text-xs">1</span>;
    
    if (status === "publishing") {
      firstStepStyles = "border-foreground bg-foreground text-background";
      firstStepContent = <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent"></div>;
    } else if (status === "minting") {
      firstStepStyles = "border-success bg-success text-background";
      firstStepContent = <CheckCircle className="h-5 w-5" />;
    }
    
    // Determine styling and content for the second step
    let secondStepStyles = "border-border bg-background";
    let secondStepContent = <span className="text-xs">2</span>;
    
    if (status === "minting") {
      secondStepStyles = "border-foreground bg-foreground text-background";
      secondStepContent = <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent"></div>;
    }
    
    // Determine styling for the connecting line
    let lineStyles = "bg-border";
    if (status === "minting") {
      lineStyles = "bg-success";
    } else if (status === "publishing") {
      lineStyles = "bg-gradient-to-r from-foreground to-border";
    }
    
    return (
      <div className="flex flex-col items-center space-y-4 p-4 sm:p-6 text-center">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-4 border-border border-t-primary"></div>
        </div>
        
        {status === "publishing" && (
          <>
            <h3 className="text-lg sm:text-xl font-semibold">Step 1 of 2: Creating Token Type</h3>
            <p className="text-sm text-muted-foreground">
              Publishing your token definition to the blockchain. This creates the token type but doesn't mint any tokens yet.
            </p>
          </>
        )}
        
        {status === "minting" && (
          <>
            <h3 className="text-lg sm:text-xl font-semibold">Step 2 of 2: Minting Initial Supply</h3>
            <p className="text-sm text-muted-foreground">
              Creating {initialSupply} {tokenSymbol} tokens and transferring them to your wallet.
            </p>
          </>
        )}
        
        {status === "pending" && (
          <>
            <h3 className="text-lg sm:text-xl font-semibold">Creating Your Token</h3>
            <p className="text-sm text-muted-foreground">
              Token creation is a two-step process. First we'll create your token type, then mint your initial supply.
            </p>
          </>
        )}
        
        {/* Progress indicator with connected circles */}
        <div className="flex w-full max-w-md flex-col items-center gap-6 pt-4">
          <div className="relative flex w-full max-w-[240px] items-center justify-between">
            {/* First step: Create Type */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2",
                firstStepStyles
              )}>
                {firstStepContent}
              </div>
              <span className="mt-2 text-xs text-secondary-foreground">Create Type</span>
            </div>

            {/* Connecting line */}
            <div className={cn(
              "absolute left-0 top-5 h-[2px] w-full -translate-y-1/2",
              lineStyles
            )}></div>

            {/* Second step: Mint Supply */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2",
                secondStepStyles
              )}>
                {secondStepContent}
              </div>
              <span className="mt-2 text-xs text-secondary-foreground">Mint Supply</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mt-6">
          Do not close this window or reload the page.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center space-y-4 p-4 sm:p-6 text-center">
        <CheckCircle className="h-12 w-12 text-success" />
        <h3 className="text-lg sm:text-xl font-semibold">Token Created Successfully!</h3>
        <p className="text-sm text-muted-foreground">
          Your token {tokenName} ({tokenSymbol}) has been successfully created{initialSupply ? ` and ${initialSupply} tokens have been minted to your wallet` : ""}.
        </p>
        
        {/* Progress indicator with connected circles for success */}
        <div className="flex w-full max-w-md flex-col items-center gap-6 pt-4">
          <div className="relative flex w-full max-w-[240px] items-center justify-between">
            {/* First step: Create Type */}
            <div className="flex flex-col items-center">
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-success bg-success text-background">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="mt-2 text-xs text-secondary-foreground">Create Type</span>
            </div>

            {/* Connecting line */}
            <div className="absolute left-0 top-5 h-[2px] w-full -translate-y-1/2 bg-success"></div>

            {/* Second step: Mint Supply */}
            <div className="flex flex-col items-center">
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-success bg-success text-background">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="mt-2 text-xs text-secondary-foreground">Mint Supply</span>
            </div>
          </div>
        </div>
        
        {txDigest && (
          <a
            href={explorer.buildTxUrl(txDigest)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-2 text-sm text-muted-foreground underline"
          >
            View transaction details
            <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        )}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4 w-full sm:w-auto">
          <button
            id="continue-button"
            onClick={onContinue}
            className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
          >
           <p className="text-p2 text-button-1-foreground">Continue to Next Step</p>
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center space-y-4 p-4 sm:p-6 text-center">
        <XCircle className="h-12 w-12 text-error" />
        
        <h3 className="text-lg sm:text-xl font-semibold">Token Creation Failed</h3>
        
        <p className="text-sm text-muted-foreground">
          We encountered an error during the token creation process. The token type may have been created, but the initial supply minting might have failed.
        </p>
        
        {error && (
          <div className="w-full max-w-md rounded-md bg-card p-3 sm:p-4 text-left text-sm border border-error">
            <p className="font-semibold">Error details:</p>
            <p className="mt-1 break-words text-xs sm:text-sm text-error">{error.message}</p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4 w-full">
          {onRetry && (
            <Button variant="outline" onClick={onRetry} className="w-full sm:w-auto min-w-[120px]">
              Try Again
            </Button>
          )}
          
          {onContinue && (
            <Button
              onClick={onContinue}
              className="w-full sm:w-auto min-w-[120px]"
            >
              {actionButtonLabel || "Continue"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
} 