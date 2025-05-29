import { useState } from "react";

import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";
import { ArrowRightLeft } from "lucide-react";

import { MultiSwapQuote, SwapQuote } from "@suilend/steamm-sdk";
import { Token, formatPrice, formatToken } from "@suilend/sui-fe";

import Parameter from "@/components/Parameter";
import { Skeleton } from "@/components/ui/skeleton";
import { getQuoteRatio } from "@/lib/swap";
import { cn } from "@/lib/utils";

interface ExchangeRateParameterProps {
  className?: ClassValue;
  labelClassName?: ClassValue;
  priceLabelClassName?: ClassValue;
  inToken: Token;
  inPrice: BigNumber;
  outToken: Token;
  outPrice: BigNumber;
  isFetchingQuote?: boolean;
  quote?: SwapQuote | MultiSwapQuote;
  isInverted?: boolean;
  label?: string;
  isHorizontal?: boolean;
}

export default function ExchangeRateParameter({
  className,
  labelClassName,
  priceLabelClassName,
  inToken,
  inPrice,
  outToken,
  outPrice,
  isFetchingQuote,
  quote,
  isInverted: _isInverted,
  label,
  isHorizontal,
}: ExchangeRateParameterProps) {
  // Ratios
  const quoteRatio = getQuoteRatio(inToken, outToken, quote);
  const invertedQuoteRatio =
    quoteRatio !== undefined && !quoteRatio.eq(0)
      ? quoteRatio.pow(-1)
      : undefined;

  // State
  const [isInverted, setIsInverted] = useState<boolean>(!!_isInverted);

  return (
    <Parameter
      className={className}
      label={label ?? "Exchange rate"}
      isHorizontal={isHorizontal}
    >
      {isFetchingQuote || !quote ? (
        <Skeleton className="h-[21px] w-48" />
      ) : (
        <div className="flex w-full flex-row items-center gap-2">
          <p className={cn("!text-p2 text-foreground", labelClassName)}>
            {!isInverted ? (
              <>
                1 {inToken.symbol}
                {" ≈ "}
                {quoteRatio !== undefined
                  ? formatToken(quoteRatio, { dp: outToken.decimals })
                  : "N/A"}{" "}
                {outToken.symbol}
              </>
            ) : (
              <>
                1 {outToken.symbol}
                {" ≈ "}
                {invertedQuoteRatio !== undefined
                  ? formatToken(invertedQuoteRatio, { dp: inToken.decimals })
                  : "N/A"}{" "}
                {inToken.symbol}
              </>
            )}
          </p>

          {!isInverted ? (
            <>
              {quoteRatio !== undefined && (
                <p
                  className={cn(
                    "!text-p2 text-secondary-foreground",
                    priceLabelClassName,
                  )}
                >
                  {formatPrice(outPrice.times(quoteRatio))}
                </p>
              )}
            </>
          ) : (
            <>
              {invertedQuoteRatio !== undefined && (
                <p
                  className={cn(
                    "!text-p2 text-secondary-foreground",
                    priceLabelClassName,
                  )}
                >
                  {formatPrice(inPrice.times(invertedQuoteRatio))}
                </p>
              )}
            </>
          )}

          <button
            className="group h-4 w-4 flex-1"
            onClick={() => setIsInverted((prev) => !prev)}
          >
            <ArrowRightLeft className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
          </button>
        </div>
      )}
    </Parameter>
  );
}
