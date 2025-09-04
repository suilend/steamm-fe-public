import { useMemo, useState, useCallback } from "react";
import BigNumber from "bignumber.js";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { Settings2 } from "lucide-react";
import { formatToken } from "@suilend/sui-fe";
import { useMarketContext, QuickBuyToken, Token } from "@/contexts/MarketContext";
import { ASSETS_URL } from "@/lib/constants";


interface TokenTickerProps {
  tokens: Token[];
  className?: string;
  watchListTokens: Token[];
}

export default function TokenTicker({ tokens, className, watchListTokens }: TokenTickerProps) {
  // Duplicate tokens to create seamless loop
  const { isWatchlistMode, setIsWatchlistMode, quickBuyAmount, quickBuyToken, buyingTokenId } = useMarketContext();
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

  const handleQuickBuy = useCallback(async (token: Token) => {
    const quickBuyTokenData: QuickBuyToken = {
      id: token.id,
      symbol: token.symbol,
      decimals: token.decimals,
      description: token.description,
      name: token.name,
      coinType: token.coinType,
    };
    await quickBuyToken(quickBuyTokenData);
  }, [quickBuyToken]);

  return (
    <div className="fixed left-0 right-0 flex -mt-6 md:-mt-8 h-[42px] bg-background/60 backdrop-blur-lg">
      <div className="text-p2 text-secondary-foreground flex items-center px-2 gap-2 border-b border-border border-r cursor-pointer" onClick={() => setIsWatchlistMode(!isWatchlistMode)}>
        {isWatchlistMode ? "Watchlist" : "Trending"} <Settings2 className="h-4 w-4" />
      </div>
      <div className="flex-1 relative h-full">
    <div
      className={cn(
        "absolute left-0 right-0 w-full overflow-hidden border-b h-full",
        className,
      )}
    >
      <div className="flex items-center divide-x divide-border whitespace-nowrap h-[41px] animate-scroll">
        {duplicatedTokens.map((token, index) => (
          <div
            key={`${token.id}-${index}`}
            className="text-sm flex items-center gap-2 px-4 py-2 flex-shrink-0 group cursor-pointer relative"
            onClick={() => {
              window.open(`https://noodles.fi/coins/${token.coinType}`, "_blank");
            }}
          >
            {token.image ?<img
              src={token.image}
              alt={token.name}
              width={20}
              height={20}
              className="rounded-full"
            /> : <Skeleton className="h-5 w-5 rounded-full" />}

            {/* Token name */}
            <span className="font-medium text-foreground">{token.name}</span>

            {/* Market cap */}
            <span className="text-secondary-foreground">
              {formatToken(new BigNumber(token.marketCap), { exact: false })}
            </span>

            {/* Change percentage */}
            <span
              className={cn(
                "font-medium",
                token.change24h >= 0 ? "text-success" : "text-error",
                "group-hover:text-background"
              )}
            >
              {formatChange(token.change24h)}
            </span>
            <span
              className={cn(
                "font-medium hidden group-hover:flex absolute right-2 rounded-md bg-button-2 px-2 py-1 text-button-1 gap-1 items-center cursor-pointer transition-colors hover:bg-button-2/90",
                buyingTokenId === token.id && "opacity-50 cursor-not-allowed"
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (buyingTokenId !== token.id) {
                  handleQuickBuy(token);
                }
              }}
            >
              {buyingTokenId === token.id ? "..." : formatToken(new BigNumber(quickBuyAmount), { trimTrailingZeros: true })}
              <img
                src={`${ASSETS_URL}/icons/sui.png`}
                alt="Coin"
                width={16}
                height={16}
                className="flex-shrink-0 h-4 w-4"
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
