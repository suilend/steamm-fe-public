import { useRouter } from "next/router";
import { PropsWithChildren, useEffect, useState } from "react";

import { ClassValue } from "clsx";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useCreateToken, { CreateTokenParams } from "@/hooks/useCreateToken";
import { cn } from "@/lib/utils";

import TokenCreationConfirmDialog from "../TokenCreationConfirmDialog";
import TokenCreationStatus, {
  TokenCreationStatus as Status,
} from "../TokenCreationStatus";

interface TokenCreationFormProps extends PropsWithChildren {
  className?: ClassValue;
  tokenParams: CreateTokenParams;
  onSuccess?: (tokenType: string, treasuryCapId: string) => void;
  onNext?: () => void;
  isLoading?: boolean;
}

export default function TokenCreationForm({
  className,
  children,
  tokenParams,
  onSuccess,
  onNext,
  isLoading = false,
}: TokenCreationFormProps) {
  const router = useRouter();
  const {
    createToken,
    isCreating,
    error,
    status: hookStatus,
  } = useCreateToken();

  // Dialog state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Transaction status state - now synchronized with the hook's status
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<Error | undefined>(undefined);
  const [txDigest, setTxDigest] = useState<string | null>(null);

  // Local data loading state - to control when to show skeletons
  const [isDataLoading, setIsDataLoading] = useState(isLoading);

  // Simulate data loading if necessary
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsDataLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

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
  const isContractDeploymentError =
    formError && formError.message?.includes("requires deploying");

  // Show loading skeleton
  if (isDataLoading) {
    return (
      <div className={cn("flex w-full flex-col gap-4", className)}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>

          {/* Token name input skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>

          {/* Token symbol input skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>

          {/* Token supply input skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>

          {/* Description input skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-32 w-full rounded-md" />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
      </div>
    );
  }

  // Show content based on status
  if (status !== "idle") {
    return (
      <div
        className={cn(
          "my-4 flex w-full flex-col items-center justify-center sm:my-8",
          className,
        )}
      >
        <TokenCreationStatus
          status={status}
          txDigest={txDigest}
          tokenName={tokenParams.name}
          tokenSymbol={tokenParams.symbol}
          error={formError}
          onRetry={isContractDeploymentError ? undefined : handleRetry}
          onContinue={
            isContractDeploymentError
              ? handleContinue
              : status === "success"
                ? handleContinue
                : undefined
          }
          actionButtonLabel={
            isContractDeploymentError ? "Continue Anyway" : undefined
          }
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
