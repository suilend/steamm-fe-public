import { useState } from "react";
import BigNumber from "bignumber.js";
import { X } from "lucide-react";
import { formatToken, formatUsd } from "@suilend/sui-fe";
import { cn } from "@/lib/utils";
import { QuickBuyToken } from "@/contexts/MarketContext";
import Dialog from "@/components/Dialog";

export interface QuoteDetails {
  inputAmount: string;
  outputAmount: string;
  exchangeRate: string;
  slippage: string;
  provider: string;
}

interface QuickBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: QuickBuyToken;
  quote: QuoteDetails | null;
  isLoading: boolean;
  isExecuting: boolean;
  error?: string;
}

export default function QuickBuyModal({
  isOpen,
  onClose,
  token,
  quote,
  isLoading,
  isExecuting,
  error,
}: QuickBuyModalProps) {
  return (
    <Dialog
      rootProps={{
        open: isOpen,
        onOpenChange: (open) => {
          if (!open) onClose();
        },
      }}
      headerProps={{
        children: (
          <div className="flex items-center justify-between p-5">
            <h2 className="text-h3 text-foreground">
              {isExecuting ? "Executing Transaction" : "Transaction Details"}
            </h2>
            <button
              onClick={onClose}
              className="text-secondary-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ),
      }}
      dialogContentInnerClassName="max-w-sm"
    >

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-focus border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-secondary-foreground">Getting best quote...</p>
          </div>
        ) : isExecuting ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-focus border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-secondary-foreground">Please sign the transaction in your wallet...</p>
            <p className="text-xs text-secondary-foreground mt-2">This modal will close automatically when complete</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-error mb-4">{error}</p>
            <p className="text-xs text-secondary-foreground">Click outside to close</p>
          </div>
        ) : null}
        {quote && <>
          {/* Transaction Details */}
          <div className="space-y-4 mb-6">
            <div className="bg-card rounded-md p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Transaction Details</h3>
              
              {/* You Pay */}
              <div className="flex justify-between items-center py-2">
                <span className="text-secondary-foreground">You Pay:</span>
                <div className="text-right">
                  <div className="text-foreground font-medium">
                    {formatToken(new BigNumber(quote.inputAmount), { trimTrailingZeros: true })} SUI
                  </div>
                  <div className="text-xs text-secondary-foreground">
                    {formatUsd(new BigNumber(quote.inputAmount).times(1), { exact: false })}
                  </div>
                </div>
              </div>

              {/* You Receive */}
              <div className="flex justify-between items-center py-2">
                <span className="text-secondary-foreground">You Receive:</span>
                <div className="text-right">
                  <div className="text-foreground font-medium">
                    {formatToken(new BigNumber(quote.outputAmount), { trimTrailingZeros: true })} {token.symbol}
                  </div>
                </div>
              </div>

              {/* Exchange Rate */}
              <div className="flex justify-between items-center py-2">
                <span className="text-secondary-foreground">Rate:</span>
                <span className="text-foreground">
                  1 SUI = {quote.exchangeRate} {token.symbol}
                </span>
              </div>

              {/* Slippage */}
              <div className="flex justify-between items-center py-2">
                <span className="text-secondary-foreground">Max Slippage:</span>
                <span className="text-foreground">{quote.slippage}%</span>
              </div>

              {/* Provider */}
              <div className="flex justify-between items-center py-2">
                <span className="text-secondary-foreground">Provider:</span>
                <span className="text-foreground">{quote.provider}</span>
              </div>
            </div>
          </div>

          {/* Info text */}
          <div className="text-center">
            <p className="text-xs text-secondary-foreground">
              Please review the details above and sign the transaction in your wallet
            </p>
          </div>
        </>}
    </Dialog>
  );
}
