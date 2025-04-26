import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { ClassValue } from "clsx";

import { Skeleton } from "@/components/ui/skeleton";
import useCreateToken, { LaunchConfig } from "@/hooks/useCreateToken";
import { cn } from "@/lib/utils";

import TokenCreationConfirmDialog from "./TokenCreationConfirmDialog";
import TokenCreationStatus, {
  TokenCreationStatus as Status,
} from "./TokenCreationStatus";

interface TokenCreationFormProps {
  className?: ClassValue;
  tokenParams: LaunchConfig;
  onSuccess?: (
    tokenType: string,
    treasuryCapId: string,
    poolId: string,
  ) => void;
}

export default function TokenCreationForm({
  className,
  tokenParams,
  onSuccess,
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
          onSuccess(result.tokenType, result.treasuryCapId, result.poolId);
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
    router.push(`/pool/${tokenParams.poolId}`);
  };

  // Check if error is related to contract deployment
  const isContractDeploymentError =
    formError && formError.message?.includes("requires deploying");

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
          tokenName={tokenParams.tokenName}
          tokenSymbol={tokenParams.tokenSymbol}
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
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Token Review</h2>
          <p className="text-sm text-muted-foreground">
            Review your token details before creating it on the blockchain
          </p>

          <div className="space-y-3 rounded-md border p-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Name</span>
              <span className="text-sm">{tokenParams.tokenName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm font-medium">Symbol</span>
              <span className="text-sm">{tokenParams.tokenSymbol}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm font-medium">Decimals</span>
              <span className="text-sm">{tokenParams.tokenDecimals}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm font-medium">Initial Supply</span>
              <span className="text-sm">
                {tokenParams.initialSupply} {tokenParams.tokenSymbol}
              </span>
            </div>

            {tokenParams.tokenDescription && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Description</span>
                <span className="text-sm">{tokenParams.tokenDescription}</span>
              </div>
            )}

            {tokenParams.iconUrl && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Icon</span>
                <div className="flex justify-center">
                  <img
                    src={tokenParams.iconUrl}
                    alt="Token icon"
                    className="h-12 w-12 object-contain"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <span className="text-sm font-medium">Options</span>
              <div className="flex flex-wrap gap-2">
                {tokenParams.isMintable && (
                  <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                    Mintable
                  </span>
                )}
                {tokenParams.isBurnable && (
                  <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                    Burnable
                  </span>
                )}
                {tokenParams.isPausable && (
                  <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                    Pausable
                  </span>
                )}
                {tokenParams.isUpgradeable && (
                  <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                    Upgradeable
                  </span>
                )}
                {tokenParams.maxSupply && (
                  <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                    Max Supply: {tokenParams.maxSupply}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

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
