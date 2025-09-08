import { useCallback, useMemo } from "react";

import BigNumber from "bignumber.js";
import { Settings2 } from "lucide-react";

import { formatToken } from "@suilend/sui-fe";

import { Skeleton } from "@/components/ui/skeleton";
import {
  QuickBuyToken,
  Token,
  useMarketContext,
} from "@/contexts/MarketContext";
import { ASSETS_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TokenTickerProps {
  tokens: Token[];
  className?: string;
  watchListTokens: Token[];
}

export default function TokenTicker({
  tokens,
  className,
  watchListTokens,
}: TokenTickerProps) {
  // Duplicate tokens to create seamless loop
  const {
    isWatchlistMode,
    setIsWatchlistMode,
    quickBuyAmount,
    quickBuyToken,
    buyingTokenId,
  } = useMarketContext();
  const duplicatedTokens = useMemo(() => {
    const sourceTokens = isWatchlistMode ? watchListTokens : tokens;
    if (sourceTokens.length === 0) return [];

    // Calculate how many times we need to duplicate to get at least 10 items
    const minItems = 10;
    const multiplier = Math.ceil(minItems / sourceTokens.length);

    // Create the duplicated array
    const result = [];
    for (let i = 0; i < multiplier; i++) {
      result.push(...sourceTokens);
    }

    return result;
  }, [tokens, watchListTokens, isWatchlistMode]);
  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  };

  const handleQuickBuy = useCallback(
    async (token: Token) => {
      const quickBuyTokenData: QuickBuyToken = {
        id: token.id,
        symbol: token.symbol,
        decimals: token.decimals,
        description: token.description,
        name: token.name,
        coinType: token.coinType,
      };
      await quickBuyToken(quickBuyTokenData);
    },
    [quickBuyToken],
  );

  return (
    <div className="fixed left-0 right-0 z-10 -mt-6 flex h-[42px] bg-background/60 backdrop-blur-lg md:-mt-8">
      <div
        className="flex cursor-pointer items-center gap-2 border-b border-r border-border px-2 text-p2 text-secondary-foreground"
        onClick={() => setIsWatchlistMode(!isWatchlistMode)}
      >
        {isWatchlistMode ? "Watchlist" : "Trending"}{" "}
        <Settings2 className="h-4 w-4" />
      </div>
      <div className="relative h-full flex-1">
        <div
          className={cn(
            "absolute left-0 right-0 h-full w-full overflow-hidden border-b",
            className,
          )}
        >
          <div className="animate-scroll flex h-[41px] items-center divide-x divide-border whitespace-nowrap">
            {duplicatedTokens.map((token, index) => (
              <div
                key={`${token.id}-${index}`}
                className="text-sm group relative flex flex-shrink-0 cursor-pointer items-center gap-2 px-4 py-2"
                onClick={() => {
                  window.open(
                    `https://noodles.fi/coins/${token.coinType}`,
                    "_blank",
                  );
                }}
              >
                {token.image ? (
                  <img
                    src={token.image}
                    alt={token.name}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                ) : (
                  <Skeleton className="h-5 w-5 rounded-full" />
                )}

                {/* Token name */}
                <span className="font-medium text-foreground">
                  {token.name}
                </span>

                {/* Market cap */}
                <span className="text-secondary-foreground">
                  {formatToken(new BigNumber(token.marketCap), {
                    exact: false,
                  })}
                </span>

                {/* Change percentage */}
                <span
                  className={cn(
                    "font-medium",
                    token.change24h >= 0 ? "text-success" : "text-error",
                    "group-hover:text-background",
                  )}
                >
                  {formatChange(token.change24h)}
                </span>
                <span
                  className={cn(
                    "absolute right-2 hidden cursor-pointer items-center gap-1 rounded-md bg-button-2 px-2 py-1 font-medium text-button-1 transition-colors hover:bg-button-2/90 group-hover:flex",
                    buyingTokenId === token.id &&
                      "cursor-not-allowed opacity-50",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (buyingTokenId !== token.id) {
                      handleQuickBuy(token);
                    }
                  }}
                >
                  {buyingTokenId === token.id
                    ? "..."
                    : quickBuyAmount.length
                      ? formatToken(new BigNumber(quickBuyAmount), {
                          trimTrailingZeros: true,
                        })
                      : "-"}
                  <img
                    src={`${ASSETS_URL}/icons/sui.png`}
                    alt="Coin"
                    width={16}
                    height={16}
                    className="h-4 w-4 flex-shrink-0"
                  />
                </span>
              </div>
            ))}
          </div>

          {/* Gradient fade effects */}
          <div className="to-transparent pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background" />
          <div className="to-transparent pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background" />
        </div>
      </div>
    </div>
  );
}
