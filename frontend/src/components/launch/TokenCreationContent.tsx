import { useEffect, useState } from "react";

import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link,
  XCircle,
} from "lucide-react";

import { useSettingsContext } from "@suilend/frontend-sui-next";

import {
  DEFAULT_CONFIG,
  TokenCreationStatus,
  useLaunch,
} from "@/contexts/LaunchContext";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Separator } from "../ui/seperator";
import { Switch } from "../ui/switch";

import { formatTokenAmount } from "./validation";

export default function TokenCreationContent() {
  const { config, launchToken, setConfig } = useLaunch();
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const { status, tokenName, tokenSymbol, error, initialSupply } = config;

  // State for advanced options collapse
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const hasAcknowledgedOrInProgress =
    hasAcknowledged || status !== TokenCreationStatus.Pending;

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
            ? ` and ${formatTokenAmount(initialSupply)} tokens have been minted. 10% of the supply has been added to bootstrap the pool and the remainder was sent to your wallet.`
            : ""}
          .
        </p>

        <div className="flex w-full flex-col space-y-2 pt-4 sm:w-auto sm:flex-row sm:space-x-4 sm:space-y-0">
          {config.poolUrl && (
            <Link href={config.poolUrl}>
              <button
                id="continue-button"
                className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
              >
                <p className="text-p2 text-button-1-foreground">Visit Pool</p>
              </button>
            </Link>
          )}
        </div>
      </div>
    );
  } else if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 text-center sm:p-6">
        <XCircle className="h-12 w-12 text-error" />

        <h3 className="text-lg sm:text-xl font-semibold">
          Token Launch Failed
        </h3>

        <p className="text-sm text-muted-foreground">
          We encountered an error during the token creation process. Your
          progress has been saved. Please continue your
        </p>

        {error && (
          <div className="text-sm w-full max-w-md rounded-md border border-error bg-card p-3 text-left sm:p-4">
            <p className="font-semibold">Error details:</p>
            <p className="text-xs sm:text-sm mt-1 break-words">{error}</p>
          </div>
        )}

        <button
          className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
          onClick={() => {
            setConfig({ ...config, error: null });
          }}
        >
          <p className="text-p2 text-button-1-foreground">Continue and retry</p>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col gap-4")}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Review your token details before creating it on the blockchain
        </p>

        <div className="space-y-3 rounded-md border p-4">
          {config.iconUrl && (
            <div className="flex flex-col items-center">
              <img
                src={config.iconUrl}
                alt="Token icon"
                className="h-12 w-12 overflow-hidden rounded-full object-contain"
              />
            </div>
          )}
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
          <div className="flex justify-between">
            <span className="text-sm font-medium">Estimated Gas Fee</span>
            <span className="text-sm">~0.15 SUI</span>
          </div>

          <Separator />

          {/* Advanced Options Toggle Button */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-sm hover:bg-muted flex w-full items-center justify-between rounded-md font-medium transition-colors"
            >
              <span>Pool details</span>
              {showAdvancedOptions ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {showAdvancedOptions && (
            <>
              <div className="flex justify-between">
                <span className="text-sm font-medium">
                  Initial token supplied to LP
                </span>
                <span className="text-sm">
                  {Number(config.initialSupply) / 10} {config.tokenSymbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Quoter</span>
                <span className="text-sm">CPMM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Fier Tier</span>
                <span className="text-sm">0.3%</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 pt-4 sm:items-center">
        <Switch
          id="acknowledge"
          checked={hasAcknowledgedOrInProgress}
          onCheckedChange={setHasAcknowledged}
          className="mt-0.5 sm:mt-0"
        />
        <Label
          htmlFor="acknowledge"
          className="text-sm cursor-pointer leading-normal"
        >
          I understand that I am creating a new token and will be responsible
          for its management
        </Label>
      </div>
      <div className="mt-6">
        <button
          className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
          onClick={() => {
            if (hasAcknowledgedOrInProgress) {
              launchToken();
            }
          }}
          disabled={!hasAcknowledgedOrInProgress}
        >
          <p className="text-p2 text-button-1-foreground">Create Token</p>
        </button>
      </div>
    </div>
  );
}
