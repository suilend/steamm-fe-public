import BigNumber from "bignumber.js";

import { API_URL, Token } from "@suilend/frontend-sui";
import { MultiSwapQuote, SwapQuote } from "@suilend/steamm-sdk";

import { HistorySwap, HistoryTransactionType } from "@/lib/types";

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
  inUsdPrice !== undefined && outUsdPrice !== undefined
    ? !inUsdPrice.eq(0) && !outUsdPrice.eq(0)
      ? inUsdPrice.div(outUsdPrice)
      : null
    : undefined;

export const fetchHistoricalSwapTransactions = async (
  address: string,
  poolId?: string,
) => {
  const urlSearchParams: Record<string, string> = { user: address };
  if (poolId) urlSearchParams.poolId = poolId;

  const res = await fetch(
    `${API_URL}/steamm/historical/swaps?${new URLSearchParams(urlSearchParams)}`,
  );
  const json: Omit<HistorySwap, "type">[] = await res.json();
  if ((json as any)?.statusCode === 500)
    throw new Error("Failed to fetch historical swap transactions");

  return [
    ...(json.map((entry) => ({
      ...entry,
      type: HistoryTransactionType.SWAP,
    })) as HistorySwap[]),
  ];
};
