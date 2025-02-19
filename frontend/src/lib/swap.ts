import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";

import { MultiSwapQuote, SwapQuote } from "@suilend/steamm-sdk";

export const PRICE_DIFFERENCE_PERCENT_WARNING_THRESHOLD = 1;
export const PRICE_DIFFERENCE_PERCENT_DESTRUCTIVE_THRESHOLD = 8;

export const getQuoteRatio = (
  inCoinMetadata: CoinMetadata,
  outCoinMetadata: CoinMetadata,
  quote?: SwapQuote | MultiSwapQuote,
) =>
  quote !== undefined &&
  !new BigNumber(quote.amountIn.toString()).eq(0) &&
  !new BigNumber(quote.amountOut.toString()).eq(0)
    ? new BigNumber(
        new BigNumber(quote.amountOut.toString()).div(
          10 ** outCoinMetadata.decimals,
        ),
      ).div(
        new BigNumber(quote.amountIn.toString()).div(
          10 ** inCoinMetadata.decimals,
        ),
      )
    : undefined;
