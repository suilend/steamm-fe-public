import { useState } from "react";

import { ArrowRightLeft } from "lucide-react";

import { formatToken } from "@suilend/frontend-sui";
import { MultiSwapQuote, SwapQuote } from "@suilend/steamm-sdk";

import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { getQuoteRatio } from "@/lib/swap";

interface ExchangeRateParameterProps {
  inCoinType: string;
  outCoinType: string;
  isFetchingQuote: boolean;
  quote?: SwapQuote | MultiSwapQuote;
}

export default function ExchangeRateParameter({
  inCoinType,
  outCoinType,
  isFetchingQuote,
  quote,
}: ExchangeRateParameterProps) {
  const { appData } = useLoadedAppContext();

  const inCoinMetadata = appData.poolCoinMetadataMap[inCoinType];
  const outCoinMetadata = appData.poolCoinMetadataMap[outCoinType];

  // Ratios
  const quoteRatio = getQuoteRatio(inCoinMetadata, outCoinMetadata, quote);
  const reversedQuoteRatio =
    quoteRatio !== undefined ? quoteRatio.pow(-1) : undefined;

  // State
  const [isShowingReversedQuoteRatio, setIsShowingReversedQuoteRatio] =
    useState<boolean>(false);

  return (
    <div className="flex w-full flex-row items-center justify-between">
      <p className="text-p2 text-secondary-foreground">Exchange rate</p>

      {isFetchingQuote || !quote ? (
        <Skeleton className="h-[21px] w-48" />
      ) : (
        <button
          className="group flex flex-row items-center gap-2"
          onClick={() => setIsShowingReversedQuoteRatio((prev) => !prev)}
        >
          <p className="text-p2 text-foreground">
            {!isShowingReversedQuoteRatio ? (
              <>
                1 {inCoinMetadata.symbol}
                {" ≈ "}
                {formatToken(quoteRatio!, {
                  dp: outCoinMetadata.decimals,
                })}{" "}
                {outCoinMetadata.symbol}
              </>
            ) : (
              <>
                1 {outCoinMetadata.symbol}
                {" ≈ "}
                {formatToken(reversedQuoteRatio!, {
                  dp: inCoinMetadata.decimals,
                })}{" "}
                {inCoinMetadata.symbol}
              </>
            )}
          </p>

          <ArrowRightLeft className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
        </button>
      )}
    </div>
  );
}
