import { PropsWithChildren, useState, useEffect } from "react";
import { ClassValue } from "clsx";
import { useRouter } from "next/router";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import useCreateToken, { CreateTokenParams } from "@/hooks/useCreateToken";
import TokenCreationConfirmDialog from "../TokenCreationConfirmDialog";
import TokenCreationStatus, { TokenCreationStatus as Status } from "../TokenCreationStatus";

interface TokenCreationFormProps extends PropsWithChildren {
  className?: ClassValue;
  tokenParams: CreateTokenParams;
  onSuccess?: (tokenType: string, treasuryCapId: string) => void;
  onNext?: () => void;
}

export default function TokenCreationForm({ 
  className, 
  children, 
  tokenParams,
  onSuccess,
  onNext
}: TokenCreationFormProps) {
  const router = useRouter();
  const { createToken, isCreating, error, status: hookStatus } = useCreateToken();
  
  // Dialog state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  // Transaction status state - now synchronized with the hook's status
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<Error | undefined>(undefined);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  
  // Monitor for status updates from the hook
  useEffect(() => {
    if (hookStatus && hookStatus !== "idle") {
      setStatus(hookStatus);
    }
  }, [hookStatus]);
  
  // Monitor for error updates from the hook
  useEffect(() => {
    if (error) {
      setFormError(error);
      setStatus("error");
    }
  }, [error]);
  
  // Handle create token
  const handleCreateToken = async () => {
    setStatus("pending");
    
    try {
      const result = await createToken(tokenParams);
      
      if (result) {
        setTxDigest(result.digest);
        // Status is now handled by the hook's status updates
        
        // Call onSuccess if provided
        if (onSuccess) {
          onSuccess(result.tokenType, result.treasuryCapId);
        }
      } else if (!error) {
        // If no result and no error was set in the hook
        throw new Error("Token creation failed with unknown error");
      }
    } catch (err) {
      console.error("Token creation error:", err);
      setFormError(err as Error);
      setStatus("error");
    }
  };
  
  // Handle retry
  const handleRetry = () => {
    setStatus("idle");
    setFormError(undefined);
    setIsConfirmDialogOpen(true);
  };
  
  // Handle continue to next step
  const handleContinue = () => {
    if (onNext) {
      onNext();
    } else {
      // Default next step if onNext not provided
      router.push("/launch/pool");
    }
  };

  // Check if error is related to contract deployment
  const isContractDeploymentError = formError && formError.message?.includes("requires deploying");
  
  // Show content based on status
  if (status !== "idle") {
    return (
      <div className={cn("flex w-full flex-col items-center justify-center my-4 sm:my-8", className)}>
        <TokenCreationStatus
          status={status}
          txDigest={txDigest}
          tokenName={tokenParams.name}
          tokenSymbol={tokenParams.symbol}
          error={formError}
          onRetry={isContractDeploymentError ? undefined : handleRetry}
          onContinue={isContractDeploymentError ? handleContinue : status === "success" ? handleContinue : undefined}
          actionButtonLabel={isContractDeploymentError ? "Continue Anyway" : undefined}
          initialSupply={tokenParams.initialSupply}
        />
      </div>
    );
  }
  
  return (
    <>
      <div className={cn("flex w-full flex-col gap-4", className)}>
        {children}
        
        <div className="mt-6 flex justify-end">
        <button
          className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
          onClick={() => setIsConfirmDialogOpen(true)}
        >
            <p className="text-p2 text-button-1-foreground">Create Token</p>
          </button>
        </div>
      </div>
      
      <TokenCreationConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleCreateToken}
        tokenParams={tokenParams}
        isSubmitting={isCreating}
      />
    </>
  );
} 