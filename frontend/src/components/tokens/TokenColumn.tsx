import Image from "next/image";
import { useMemo } from "react";

import { Clock, Copy, Search, Star, Users } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedMarketContext } from "@/contexts/MarketContext";
import { SUILEND_ASSETS_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface Token {
  id: string;
  name: string;
  symbol: string;
  image: string | null;
  change24h: number;
  timeAgo: string;
  rating: number;
  marketCap: number;
  price: number;
  isVerified: boolean;
}

interface TokenColumnProps {
  title: string;
  tokens: Token[];
  searchString: string;
  onSearchChange: (value: string) => void;
  showSearch?: boolean;
}

export default function TokenColumn({
  title,
  tokens,
  searchString,
  onSearchChange,
  showSearch = false,
}: TokenColumnProps) {
  const { quickBuyAmount, watchlist, setWatchlist } = useLoadedMarketContext();

  const filteredTokens = useMemo(() => {
    if (!searchString.trim()) return tokens;

    return tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(searchString.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchString.toLowerCase()),
    );
  }, [tokens, searchString]);

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(1)}M`;
    }
    return `$${(marketCap / 1000).toFixed(0)}K`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h3 className="text-h3 text-foreground">{title}</h3>

        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" />
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchString}
              onChange={(e) => onSearchChange(e.target.value)}
              className="text-sm w-full rounded-md border bg-background py-2 pl-10 pr-4 placeholder:text-secondary-foreground focus:border-focus focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Token List */}
      <div className="flex flex-col gap-3">
        {filteredTokens.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-secondary-foreground">
              {searchString ? "No tokens found" : "No tokens available"}
            </p>
          </div>
        ) : (
          filteredTokens.map((token) => (
            <div
              key={token.id}
              className="group flex items-center gap-3 overflow-hidden rounded-md border transition-colors hover:bg-card/50"
            >
              {/* Token Image */}
              <div className="flex-shrink-0 border-r border-border">
                {token.image ? (
                  <img
                    src={token.image}
                    alt={token.name}
                    className="h-16 w-16 object-cover"
                  />
                ) : (
                  <Skeleton className="h-full w-full rounded-full" />
                )}
              </div>

              {/* Token Info */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {/* Name and Icons */}
                <div className="flex flex-row items-center gap-2">
                  <h4 className="text-sm truncate font-medium text-foreground">
                    {token.symbol}
                  </h4>
                  <button
                    className="text-secondary-foreground transition-colors hover:text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(token.id);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    className="text-secondary-foreground transition-colors hover:text-foreground"
                    onClick={() => {
                      setWatchlist(token.id);
                    }}
                  >
                    {watchlist.includes(token.id) ? (
                      <Star className="h-3 w-3" fill="currentColor" />
                    ) : (
                      <Star className="h-3 w-3" />
                    )}
                  </button>
                </div>

                {/* Stats */}
                <div className="text-xs flex flex-row items-center gap-3 text-secondary-foreground">
                  <span className="flex items-center gap-1">
                    <span>
                      <Clock size={14} />
                    </span>
                    <span>{token.timeAgo}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span>
                      <Users size={14} />
                    </span>
                    <span>{token.rating}</span>
                  </span>
                  <span>MC: {formatMarketCap(token.marketCap)}</span>
                </div>
              </div>

              {/* Buy Button */}
              <div className="mr-3 flex-shrink-0">
                <button className="text-sm flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 transition-colors hover:bg-background/90">
                  <Image
                    src={`${SUILEND_ASSETS_URL}/Suilend.svg`}
                    alt="Coin"
                    width={16}
                    height={16}
                    className="h-4 w-4"
                  />
                  <span className="font-medium text-button-1">
                    {quickBuyAmount}
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
