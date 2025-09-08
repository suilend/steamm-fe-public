import BigNumber from "bignumber.js";
import { X } from "lucide-react";
import { formatToken, formatUsd, NORMALIZED_SUI_COINTYPE } from "@suilend/sui-fe";
import Dialog from "@/components/Dialog";
import { QuickBuyToken } from "@/contexts/MarketContext";
import useCachedUsdPrices from "@/hooks/useCachedUsdPrices";

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
  const { cachedUsdPricesMap } = useCachedUsdPrices([NORMALIZED_SUI_COINTYPE]);

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
              className="text-secondary-foreground transition-colors hover:text-foreground"
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
        <div className="py-8 text-center">
          <div className="border-t-transparent mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-focus"></div>
          <p className="text-secondary-foreground">Getting best quote...</p>
        </div>
      ) : isExecuting ? (
        <div className="py-8 text-center">
          <div className="border-t-transparent mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-focus"></div>
          <p className="text-secondary-foreground">
            Please sign the transaction in your wallet...
          </p>
          <p className="text-xs mt-2 text-secondary-foreground">
            This modal will close automatically when complete
          </p>
        </div>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="mb-4 text-error">{error}</p>
          <p className="text-xs text-secondary-foreground">
            Click outside to close
          </p>
        </div>
      ) : null}
      {quote && (
        <>
          {/* Transaction Details */}
          <div className="mb-6 space-y-4">
            <div className="rounded-md bg-card p-4">
              <h3 className="text-sm mb-3 font-medium text-foreground">
                Transaction Details
              </h3>

              {/* You Pay */}
              <div className="flex items-center justify-between py-2">
                <span className="text-secondary-foreground">You Pay:</span>
                <div className="text-right">
                  <div className="font-medium text-foreground">
                    {formatToken(new BigNumber(quote.inputAmount), {
                      trimTrailingZeros: true,
                    })}{" "}
                    SUI
                  </div>
                  <div className="text-xs text-secondary-foreground">
                    {formatUsd(new BigNumber(quote.inputAmount).times(cachedUsdPricesMap[NORMALIZED_SUI_COINTYPE]), {
                      exact: false,
                    })}
                  </div>
                </div>
              </div>

              {/* You Receive */}
              <div className="flex items-center justify-between py-2">
                <span className="text-secondary-foreground">You Receive:</span>
                <div className="text-right">
                  <div className="font-medium text-foreground">
                    {formatToken(new BigNumber(quote.outputAmount), {
                      trimTrailingZeros: true,
                    })}{" "}
                    {token.symbol}
                  </div>
                </div>
              </div>

              {/* Exchange Rate */}
              <div className="flex items-center justify-between py-2">
                <span className="text-secondary-foreground">Rate:</span>
                <span className="text-foreground">
                  1 SUI ={" "}
                  {formatToken(new BigNumber(quote.exchangeRate), {
                    trimTrailingZeros: true,
                  })}{" "}
                  {token.symbol}
                </span>
              </div>

              {/* Slippage */}
              <div className="flex items-center justify-between py-2">
                <span className="text-secondary-foreground">Max Slippage:</span>
                <span className="text-foreground">{quote.slippage}%</span>
              </div>

              {/* Provider */}
              <div className="flex items-center justify-between py-2">
                <span className="text-secondary-foreground">Provider:</span>
                <span className="text-foreground">{quote.provider}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </Dialog>
  );
}
