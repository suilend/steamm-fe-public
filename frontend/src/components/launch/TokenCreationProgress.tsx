import { useMemo } from "react";

import { CheckCircle, ExternalLink, XCircle } from "lucide-react";

import { useSettingsContext } from "@suilend/frontend-sui-next";

import { formatTokenAmount } from "@/components/launch/validation";
import { TokenCreationStatus, useLaunch } from "@/contexts/LaunchContext";
import { cn } from "@/lib/utils";

export default function TokenCreationProgress() {
  const { explorer } = useSettingsContext();

  const { config, txnInProgress } = useLaunch();
  const { status, transactionDigests, error, initialSupply } = config;

  const steps = useMemo(
    () => [
      {
        status: TokenCreationStatus.Publishing,
        label: "Create token",
      },
      {
        status: TokenCreationStatus.Minting,
        label: "Mint token supply",
      },
      {
        status: TokenCreationStatus.BTokenCreation,
        label: "Create bToken(s)",
      },
      {
        status: TokenCreationStatus.BankCreation,
        label: "Create bank(s)",
      },
      {
        status: TokenCreationStatus.LpTokenCreation,
        label: "Create LP token",
      },
      {
        status: TokenCreationStatus.DepositLiquidity,
        label: "Deposit liquidity",
      },
    ],
    [],
  );

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Progress indicator with connected circles */}
      <div className="flex w-full flex-col items-center gap-6">
        <div className="relative flex w-full flex-col gap-4 md:flex-row md:justify-between md:gap-2">
          {steps
            .map((step, index) => {
              let circle = <span className="text-p3">{index + 1}</span>;
              if (step.status === status && txnInProgress)
                circle = (
                  <div className="rounded-full absolute inset-0 h-full w-full animate-spin border-2 border-border border-t-foreground" />
                );
              else if (step.status < status)
                circle = <CheckCircle className="h-5 w-5" />;
              else if (step.status === status && error)
                circle = <XCircle className="h-5 w-5" />;

              return (
                <div
                  key={step.status}
                  className="flex flex-col items-center gap-2 md:gap-3"
                >
                  <div
                    className={cn(
                      "rounded-full relative z-10 flex h-10 w-10 items-center justify-center border-2",
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

                  <div className="flex flex-col items-center gap-1">
                    <span className="-mx-1 text-center text-p3 text-secondary-foreground">
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
                            className="flex items-center text-center text-p3 text-secondary-foreground underline"
                          >
                            Txn
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        ))}
                    </div>
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
                        "mt-5 hidden h-[2px] w-8 -translate-y-1/2 md:block",
                        index < status - 1
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
        <p className="text-p2 text-secondary-foreground">
          Do not close this window or reload the page.
        </p>
      )}

      {error && (
        <p className="text-p2 text-error">
          An error occurred during the token creation process. Please try again.
          <br />
          {error}
        </p>
      )}
      {status === TokenCreationStatus.Success && (
        <p className="text-p2 text-foreground">
          {formatTokenAmount(initialSupply)} tokens successfully minted.
          <br />
          10% of the supply was deposited into the pool and the remainder was
          sent to your wallet.
        </p>
      )}
    </div>
  );
}
