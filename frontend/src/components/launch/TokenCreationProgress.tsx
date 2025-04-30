import { CheckCircle, ExternalLink, XCircle } from "lucide-react";

import { useSettingsContext } from "@suilend/frontend-sui-next";

import { TokenCreationStatus, useLaunch } from "@/contexts/LaunchContext";
import { cn } from "@/lib/utils";

import { formatTokenAmount } from "./validation";

export default function TokenCreationProgress() {
  const { explorer } = useSettingsContext();
  const { config, txnInProgress } = useLaunch();
  const { status, transactionDigests, error, tokenSymbol, initialSupply } =
    config;

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
        status: TokenCreationStatus.BTokenCreation,
        label: "Creating BToken",
        description:
          "Creating a BToken for your token. This creates a BToken for your token and transfers the initial supply to the BToken.",
      },
      {
        status: TokenCreationStatus.BankCreation,
        label: "Creating Bank",
        description:
          "Creating a bank for your token. This creates a bank for your token and transfers the initial supply to the bank.",
      },
      {
        status: TokenCreationStatus.LpTokenCreation,
        label: "Creating LP Token",
        description:
          "Creating a LP token for your token. This creates a LP token for your token and transfers the initial supply to the LP token.",
      },
      {
        status: TokenCreationStatus.DepositLiquidity,
        label: "Depositing Liquidity",
        description:
          "Depositing liquidity into the pool. This deposits liquidity into the pool and transfers the initial supply to the pool.",
      },
    ];
  };

  return (
    <div className="flex w-full flex-col items-center space-y-4 py-8 text-center">
      {/* Progress indicator with connected circles */}
      <div className="flex w-full flex-col items-center gap-6">
        <div className="relative flex w-full justify-between gap-2 max-lg:flex-col max-lg:gap-8">
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

              if (step.status === status && error) {
                circle = <XCircle className="h-5 w-5" />;
              }

              return (
                <div key={step.status} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2",
                      {
                        "border-border": step.status >= status,
                        "border-success bg-success text-background":
                          step.status < status,
                      },
                      {
                        "border-error bg-error text-background":
                          error && step.status === status,
                      },
                    )}
                  >
                    {circle}
                  </div>
                  <span className="text-xs mt-2 text-secondary-foreground lg:mt-4">
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
                          View Txn
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
                        "mt-5 hidden h-[2px] w-8 -translate-y-1/2 lg:block",

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
      {error && (
        <p className="text-sm mt-6 text-error">
          An error occurred during the token creation process. Please try again.
          <br />
          {error}
        </p>
      )}
      {status === TokenCreationStatus.Success && (
        <p className="text-sm mt-6">
          {formatTokenAmount(initialSupply)} tokens successfully minted.
          <br />
          10% of the supply has been added to bootstrap the pool and the
          remainder was sent to your wallet.
        </p>
      )}
    </div>
  );
}
