import { useRouter } from "next/router";
import { useState } from "react";
import { ClassValue } from "clsx";
import { LaunchConfig, TokenCreationStatus, useLaunch } from "@/contexts/LaunchContext";
import { cn } from "@/lib/utils";
import TokenCreationProgress from "./TokenCreationProgress";

export default function TokenCreationForm({onSubmit}: {onSubmit: () => void}) {
  const router = useRouter();
  const {
    launchToken,
    config,
  } = useLaunch();

  return (
    <>
    <div
      className="my-4 flex w-full flex-col items-center justify-center sm:my-8"
    >
      <TokenCreationProgress onSubmit={onSubmit} />
    </div>
      <div className={cn("flex w-full flex-col gap-4")}>
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Token Review</h2>
          <p className="text-sm text-muted-foreground">
            Review your token details before creating it on the blockchain
          </p>

          <div className="space-y-3 rounded-md border p-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Name</span>
              <span className="text-sm">{config.tokenName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm font-medium">Symbol</span>
              <span className="text-sm">{config.tokenSymbol}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm font-medium">Decimals</span>
              <span className="text-sm">{config.tokenDecimals}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm font-medium">Token Supply</span>
              <span className="text-sm">
                {config.initialSupply} {config.tokenSymbol}
              </span>
            </div>

            {config.tokenDescription && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Description</span>
                <span className="text-sm">{config.tokenDescription}</span>
              </div>
            )}

            {config.iconUrl && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Icon</span>
                <div className="flex justify-center">
                  <img
                    src={config.iconUrl}
                    alt="Token icon"
                    className="h-12 w-12 object-contain"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <span className="text-sm font-medium">Options</span>
              <div className="flex flex-wrap gap-2">
                {config.isMintable && (
                  <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                    Mintable
                  </span>
                )}
                {config.isBurnable && (
                  <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                    Burnable
                  </span>
                )}
                {config.isPausable && (
                  <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                    Pausable
                  </span>
                )}
                {config.isUpgradeable && (
                  <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                    Upgradeable
                  </span>
                )}
                {config.maxSupply && (
                  <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                    Max Supply: {config.maxSupply}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
            onClick={launchToken}
          >
            <p className="text-p2 text-button-1-foreground">Create Token</p>
          </button>
        </div>
      </div>
    </>
  );
}
