import BigNumber from "bignumber.js";
import { AlertTriangle, Info } from "lucide-react";

import { formatPercent } from "@suilend/frontend-sui";
import { MultiSwapQuote, SwapQuote } from "@suilend/steamm-sdk";

import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import {
  PRICE_DIFFERENCE_PERCENT_DESTRUCTIVE_THRESHOLD,
  PRICE_DIFFERENCE_PERCENT_WARNING_THRESHOLD,
  getQuoteRatio,
} from "@/lib/swap";
import { cn } from "@/lib/utils";

interface PriceDifferenceLabelProps {
  inCoinType: string;
  outCoinType: string;
  birdeyeRatio?: BigNumber;
  isFetchingQuote: boolean;
  quote?: SwapQuote | MultiSwapQuote;
}

export default function PriceDifferenceLabel({
  inCoinType,
  outCoinType,
  birdeyeRatio,
  isFetchingQuote,
  quote,
}: PriceDifferenceLabelProps) {
  const { appData } = useLoadedAppContext();

  const inCoinMetadata = appData.coinMetadataMap[inCoinType];
  const outCoinMetadata = appData.coinMetadataMap[outCoinType];

  const quoteRatio = getQuoteRatio(inCoinMetadata, outCoinMetadata, quote);

  // Price difference (Birdeye)
  const priceDifferencePercent =
    birdeyeRatio !== undefined && quoteRatio !== undefined
      ? BigNumber.max(
          0,
          !birdeyeRatio.eq(0)
            ? new BigNumber(birdeyeRatio.minus(quoteRatio))
                .div(birdeyeRatio)
                .times(100)
            : new BigNumber(0),
        )
      : undefined;

  const PriceDifferenceIcon = priceDifferencePercent?.gte(
    PRICE_DIFFERENCE_PERCENT_WARNING_THRESHOLD,
  )
    ? AlertTriangle
    : Info;

  return isFetchingQuote || !quote || priceDifferencePercent === undefined ? (
    <Skeleton className="h-[21px] w-40" />
  ) : (
    <p
      className={cn(
        "text-p2 text-foreground",
        priceDifferencePercent!.gte(
          PRICE_DIFFERENCE_PERCENT_WARNING_THRESHOLD,
        ) &&
          cn(
            "text-warning",
            priceDifferencePercent!.gte(
              PRICE_DIFFERENCE_PERCENT_DESTRUCTIVE_THRESHOLD,
            ) && "text-error",
          ),
      )}
    >
      <PriceDifferenceIcon className="mb-0.5 mr-1.5 inline h-3.5 w-3.5" />
      {formatPercent(BigNumber.max(0, priceDifferencePercent!))} Price
      difference (Birdeye)
    </p>
  );
}
