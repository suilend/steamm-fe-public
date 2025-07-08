import BigNumber from "bignumber.js";
import { AlertTriangle, Info } from "lucide-react";

import { StandardizedQuote } from "@suilend/sdk";
import { SwapQuote } from "@suilend/steamm-sdk";
import { Token, formatPercent } from "@suilend/sui-fe";

import { Skeleton } from "@/components/ui/skeleton";
import {
  PRICE_DIFFERENCE_PERCENT_WARNING_THRESHOLD,
  getQuoteRatio,
} from "@/lib/swap";
import { cn } from "@/lib/utils";

interface PriceDifferenceLabelProps {
  inToken: Token;
  outToken: Token;
  cachedUsdPriceRatio?: BigNumber | null;
  isFetchingQuote: boolean;
  quote?: SwapQuote | StandardizedQuote;
}

export default function PriceDifferenceLabel({
  inToken,
  outToken,
  cachedUsdPriceRatio,
  isFetchingQuote,
  quote,
}: PriceDifferenceLabelProps) {
  const quoteRatio = getQuoteRatio(inToken, outToken, quote);

  // Price difference
  const priceDifferencePercent =
    quoteRatio === undefined || cachedUsdPriceRatio === undefined
      ? undefined
      : cachedUsdPriceRatio === null
        ? null
        : BigNumber.max(
            0,
            cachedUsdPriceRatio.eq(0)
              ? new BigNumber(0)
              : new BigNumber(cachedUsdPriceRatio.minus(quoteRatio))
                  .div(cachedUsdPriceRatio)
                  .times(100),
          );

  const PriceDifferenceIcon =
    priceDifferencePercent === null ||
    priceDifferencePercent?.gte(PRICE_DIFFERENCE_PERCENT_WARNING_THRESHOLD)
      ? AlertTriangle
      : Info;

  return isFetchingQuote || !quote || priceDifferencePercent === undefined ? (
    <Skeleton className="h-[21px] w-40" />
  ) : (
    <p
      className={cn(
        "text-p2 text-foreground",
        (priceDifferencePercent === null ||
          priceDifferencePercent.gte(
            PRICE_DIFFERENCE_PERCENT_WARNING_THRESHOLD,
          )) &&
          "text-warning",
      )}
    >
      <PriceDifferenceIcon className="mb-0.5 mr-1.5 inline h-3.5 w-3.5" />
      {priceDifferencePercent === null
        ? "N/A"
        : formatPercent(BigNumber.max(0, priceDifferencePercent))}{" "}
      Price difference (Noodles/Birdeye)
    </p>
  );
}
