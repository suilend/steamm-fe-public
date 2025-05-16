import { useState } from "react";

import { ClassValue } from "clsx";
import { ArrowRightLeft } from "lucide-react";

import { Token, formatToken, formatUsd } from "@suilend/frontend-sui";
import { MultiSwapQuote, SwapQuote } from "@suilend/steamm-sdk";

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
  const reversedQuoteRatio =
    quoteRatio !== undefined ? quoteRatio.pow(-1) : undefined;

  const isDefined =
    quoteRatio !== undefined && reversedQuoteRatio !== undefined;

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
        <button
          className="group flex w-max flex-row items-center gap-2"
          onClick={() => setIsInverted((prev) => !prev)}
          disabled={!isDefined}
        >
          <p className={cn("!text-p2 text-foreground", labelClassName)}>
            {isDefined ? (
              !isInverted ? (
                <>
                  1 {inToken.symbol}
                  {" ≈ "}
                  {formatToken(quoteRatio!, {
                    dp: outToken.decimals,
                  })}{" "}
                  {outToken.symbol}
                </>
              ) : (
                <>
                  1 {outToken.symbol}
                  {" ≈ "}
                  {formatToken(reversedQuoteRatio!, {
                    dp: inToken.decimals,
                  })}{" "}
                  {inToken.symbol}
                </>
              )
            ) : (
              "N/A"
            )}
          </p>

          {isDefined && (
            <p
              className={cn(
                "!text-p2 text-secondary-foreground",
                priceLabelClassName,
              )}
            >
              {formatUsd(
                !isInverted
                  ? outPrice.times(quoteRatio!)
                  : inPrice.times(reversedQuoteRatio!),
                { exact: true },
              )}
            </p>
          )}

          {isDefined && (
            <ArrowRightLeft className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
          )}
        </button>
      )}
    </Parameter>
  );
}
