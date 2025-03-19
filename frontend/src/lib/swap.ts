import BigNumber from "bignumber.js";

import { Token } from "@suilend/frontend-sui";
import { MultiSwapQuote, SwapQuote } from "@suilend/steamm-sdk";

export const PRICE_DIFFERENCE_PERCENT_WARNING_THRESHOLD = 2;

export const getQuoteRatio = (
  inToken: Token,
  outToken: Token,
  quote?: SwapQuote | MultiSwapQuote,
) =>
  quote !== undefined &&
  !new BigNumber(quote.amountIn.toString()).eq(0) &&
  !new BigNumber(quote.amountOut.toString()).eq(0)
    ? new BigNumber(
        new BigNumber(quote.amountOut.toString()).div(10 ** outToken.decimals),
      ).div(
        new BigNumber(quote.amountIn.toString()).div(10 ** inToken.decimals),
      )
    : undefined;

export const getBirdeyeRatio = (
  inUsdPrice: BigNumber | undefined,
  outUsdPrice: BigNumber | undefined,
) =>
  inUsdPrice !== undefined && outUsdPrice !== undefined && !outUsdPrice.eq(0)
    ? inUsdPrice.div(outUsdPrice)
    : undefined;
