import { CheckCircle, ExternalLink } from "lucide-react";

import { useSettingsContext } from "@suilend/frontend-sui-next";

import { TokenCreationStatus, useLaunch } from "@/contexts/LaunchContext";
import { cn } from "@/lib/utils";

import { formatTokenAmount } from "./validation";

export default function TokenCreationProgress() {
  const { explorer } = useSettingsContext();
  const { config, txnInProgress } = useLaunch();
  const { status, transactionDigests, tokenSymbol, initialSupply } = config;

  const steps = function (initialSupply: string, tokenSymbol: string) {
    return [
      {
        status: TokenCreationStatus.Publishing,
        label: "Publishing Token Type",
        description:
          "Publishing your token definition to the blockchain. This creates the token type but doesn't mint any tokens yet.",
      },
      {
        status: TokenCreationStatus.Minting,
        label: "Minting Token Supply",
        description: `Creating ${formatTokenAmount(initialSupply)} ${tokenSymbol} tokens and transferring them to your wallet.`,
      },
      {
        status: TokenCreationStatus.Pooling,
        label: "Creating Pool",
        description:
          "Creating a pool for your token. This creates a pool for your token and transfers the initial supply to the pool.",
      },
    ];
  };

  return (
    <div className="flex w-full flex-col items-center space-y-4 py-8 text-center">
      {/* Progress indicator with connected circles */}
      <div className="flex w-full flex-col items-center gap-6">
        <div className="relative flex w-full justify-between gap-2">
          {steps(initialSupply, tokenSymbol)
            .map((step, index) => {
              let circle = <span className="text-xs">{index + 1}</span>;
              if (step.status === status && txnInProgress) {
                circle = (
                  <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-2 border-border border-t-foreground" />
                );
              } else if (step.status < status) {
                circle = <CheckCircle className="h-5 w-5" />;
              }

              return (
                <div key={step.status} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2",
                      {
                        // "border-background": step.status === status,
                        "border-border": step.status >= status,
                        "border-success bg-success text-background":
                          step.status < status,
                      },
                    )}
                  >
                    {circle}
                  </div>
                  <span className="text-xs mt-4 text-secondary-foreground">
                    {step.label}
                  </span>
                  <div className="flex flex-col gap-2">
                    {transactionDigests[step.status] &&
                      transactionDigests[step.status].map((digest) => (
                        <a
                          key={digest}
                          href={explorer.buildTxUrl(digest)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center text-secondary-foreground underline"
                        >
                          View transaction
                          <ExternalLink className="ml-1 h-4 w-4" />
                        </a>
                      ))}
                  </div>
                </div>
              );
            })
            .reduce((acc, step, index) => {
              return index === 0
                ? [acc, step]
                : [
                    acc,
                    <div
                      key={step.props.status}
                      className={cn(
                        "mt-5 h-[2px] w-16 -translate-y-1/2",

                        index < status
                          ? "bg-success bg-gradient-to-r from-border"
                          : "bg-gradient-to-r from-border to-foreground",
                      )}
                    />,
                    step,
                  ];
            }, [] as React.ReactNode[])}
        </div>
      </div>
      {txnInProgress && (
        <p className="text-sm mt-6 text-secondary-foreground">
          Do not close this window or reload the page.
        </p>
      )}
    </div>
  );
}
