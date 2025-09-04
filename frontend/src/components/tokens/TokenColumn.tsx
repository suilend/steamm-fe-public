import Image from "next/image";
import { useCallback, useMemo } from "react";

import BigNumber from "bignumber.js";
import { Clock, Copy, Crown, Filter, FilterX, Search, Star, Users } from "lucide-react";

import { formatToken, formatUsd } from "@suilend/sui-fe";

import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedMarketContext, QuickBuyToken, Token } from "@/contexts/MarketContext";
import { ASSETS_URL, SUILEND_ASSETS_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import TokenFilterPopup, { FilterCriteria } from "./TokenFilterPopup";
import { useLocalStorage } from "usehooks-ts";
import { useWalletContext } from "@suilend/sui-fe-next";
import Tooltip from "@/components/Tooltip";
interface TokenColumnProps {
  title: string;
  tokens: Token[];
  searchString: string;
  onSearchChange: (value: string) => void;
  showSearch?: boolean;
  rankedBezels?: boolean;
}

const defaultFilters: FilterCriteria = {
  keywords: "",
  ageMin: "",
  ageMax: "",
  holdersMin: "",
  holdersMax: "",
  marketCapMin: "",
  marketCapMax: "",
};

export default function TokenColumn({
  title,
  tokens,
  searchString,
  onSearchChange,
  showSearch = false,
  rankedBezels = false,
}: TokenColumnProps) {
  const { address } = useWalletContext();
  const { quickBuyAmount, watchlist, setWatchlist, quickBuyToken, buyingTokenId, setIsWatchlistMode } = useLoadedMarketContext();
  // Filter state
  const [filters, setFilters] = useLocalStorage<FilterCriteria>(`token-filters-${title.toLowerCase()}`, defaultFilters);

  const filteredTokens = useMemo(() => {
    let filtered = tokens;

    // Apply search string filter
    if (searchString.trim()) {
      filtered = filtered.filter(
        (token) =>
          token.name.toLowerCase().includes(searchString.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchString.toLowerCase()),
      );
    }

    // Apply advanced filters
    if (filters.keywords.trim()) {
      const keywords = filters.keywords.toLowerCase().split(',').map(k => k.trim());
      filtered = filtered.filter(token =>
        keywords.some(keyword =>
          token.name.toLowerCase().includes(keyword) ||
          token.symbol.toLowerCase().includes(keyword)
        )
      );
    }

    if (filters.ageMin) {
      const minAge = parseInt(filters.ageMin);
      filtered = filtered.filter(token => {
        const tokenAgeInDays = parseFloat(token.timeAgo.replace(/[^\d.]/g, ''));
        return tokenAgeInDays >= minAge;
      });
    }

    if (filters.ageMax) {
      const maxAge = parseInt(filters.ageMax);
      filtered = filtered.filter(token => {
        const tokenAgeInDays = parseFloat(token.timeAgo.replace(/[^\d.]/g, ''));
        return tokenAgeInDays <= maxAge;
      });
    }

    if (filters.holdersMin) {
      const minHolders = parseInt(filters.holdersMin);
      filtered = filtered.filter(token => token.holders >= minHolders);
    }

    if (filters.holdersMax) {
      const maxHolders = parseInt(filters.holdersMax);
      filtered = filtered.filter(token => token.holders <= maxHolders);
    }

    if (filters.marketCapMin) {
      const minMarketCap = parseFloat(filters.marketCapMin);
      filtered = filtered.filter(token => token.marketCap >= minMarketCap);
    }

    if (filters.marketCapMax) {
      const maxMarketCap = parseFloat(filters.marketCapMax);
      filtered = filtered.filter(token => token.marketCap <= maxMarketCap);
    }

    return filtered;
  }, [tokens, searchString, filters]);

  const handleBuyToken = useCallback(async (token: Token) => {
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

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-h3 text-foreground">{title}</h3>
          <TokenFilterPopup
            trigger={
              <button
                className={cn(
                  "p-2 rounded-md border transition-colors",
                  hasActiveFilters
                    ? "border-focus bg-focus/10 text-focus"
                    : "border-border bg-background text-secondary-foreground hover:text-foreground"
                )}
              >
                {hasActiveFilters ? (
                  <FilterX className="h-4 w-4" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
              </button>
            }
            onFilterChange={setFilters}
            currentFilters={filters}
          />
        </div>

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
      <div className="flex flex-col border border-border divide-y">
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
              className="group flex items-center gap-3 overflow-hidden transition-colors hover:bg-card/50 bg-[#0A101A]"
            >
              {/* Token Image */}
              <div className="flex-shrink-0 p-2">
                <div className="relative h-16 w-16">  
                  {/* Animated Bezel for Top column */}
                  {rankedBezels && token.rank && token.rank <= 3 && (  
                    <div className="absolute inset-0 rounded-[10px] overflow-hidden">
                      {/* Spinning background gradient */}
                      <div 
                        className="absolute inset-[-16px] animate-spin-slow"
                        style={{
                          background: token.rank === 1 
                            ? 'conic-gradient(from 0deg, #fbbf24, #f59e0b, #d97706, #92400e, #451a03, #92400e, #d97706, #f59e0b, #fbbf24)' // Gold - wider range
                            : token.rank === 2 
                            ? 'conic-gradient(from 0deg, #f3f4f6, #d1d5db, #9ca3af, #6b7280, #374151, #6b7280, #9ca3af, #d1d5db, #f3f4f6)' // Silver - wider range
                            : 'conic-gradient(from 0deg, #fed7aa, #fdba74, #fb923c, #f97316, #ea580c, #c2410c, #9a3412, #c2410c, #ea580c, #f97316, #fb923c, #fdba74, #fed7aa)', // Bronze - wider range
                        }}
                      />
                    </div>
                  )}
                  
                  {token.image ? (
                    <img
                      src={token.image}
                      alt={token.name}
                      className={cn(
                        "relative z-10 h-16 w-16 object-cover rounded-md bg-[#0A101A]",
                        rankedBezels && token.rank && token.rank <= 3 && "h-[60px] w-[60px] absolute top-0.5 left-0.5" 
                      )}
                    />
                  ) : (
                    <Skeleton className={cn(
                      "relative z-10 h-16 w-16 rounded-md",
                      rankedBezels && token.rank && token.rank <= 3 && "h-[60px] w-[60px] absolute top-0.5 left-0.5"
                    )} />
                  )}
                </div>
              </div>

              {/* Token Info */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {/* Name and Icons */}
                <div className="flex flex-row justify-between items-center">
                <div className="flex flex-row items-center gap-2">
                  <h4 className="text-sm truncate font-medium text-foreground">
                    {token.symbol}
                  </h4>
                  <button
                    className="text-secondary-foreground transition-colors hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(token.id);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    className="text-secondary-foreground transition-colors hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setWatchlist(token.id);
                      setIsWatchlistMode(true);
                    }}
                  >
                    {watchlist.includes(token.id) ? (
                      <Star className="h-3 w-3" fill="currentColor" />
                    ) : (
                      <Star className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    className="text-secondary-foreground transition-colors hover:text-foreground"
                    onClick={(e) => {
                      window.open(`https://noodles.fi/coins/${token.coinType}`, "_blank");
                    }}
                  >
                    <img
                      src="https://d29k09wtkr1a3e.cloudfront.net/icons/noodles.svg"
                      alt="noodles"
                      width={12}
                      height={12}
                      className="h-3 w-3"
                    />
                  </button>
                </div>

              {/* Buy Button */}
              <div className="mr-3 flex-shrink-0">
                <button 
                  className={cn(
                    "text-sm flex items-center gap-2 rounded-md border border-border bg-button-2 px-2 py-1 transition-colors hover:bg-button-2/90",
                    buyingTokenId === token.id && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuyToken(token);
                  }}
                  disabled={buyingTokenId === token.id || !address}
                >
                  <span className="font-medium text-button-1">
                    {buyingTokenId === token.id ? "..." : formatToken(new BigNumber(quickBuyAmount), { trimTrailingZeros: true })}
                  </span>
                  <Image
                    src={`${ASSETS_URL}/icons/sui.png`}
                    alt="Coin"
                    width={16}
                    height={16}
                    className="h-4 w-4"
                  />
                </button>
              </div>
                </div>

                {/* Stats */}
                <div className="text-xs flex flex-row items-center gap-1 text-secondary-foreground">
                  <Tooltip title={`This token was created ${token.timeAgo} ago`}>
                    <span className="flex items-center gap-1 border border-border rounded-md px-2 py-1">
                      <span>
                        <Clock size={12} />
                      </span>
                      <span className="text-p3">{token.timeAgo}</span>
                    </span>
                  </Tooltip>
                  <Tooltip title={`${token.holders.toLocaleString()} distinct wallets hold this token`}>
                    <span className="flex items-center gap-1 border border-border rounded-md px-2 py-1">
                      <span>
                        <Users size={12} />
                      </span>
                      <span className="text-p3">{token.holders}</span>
                    </span>
                  </Tooltip>
                  <Tooltip title={`The top 10 wallets hold ${token.topTenHolders.toFixed(1)}% of this token`}>
                    <span className="flex items-center gap-1 border border-border rounded-md px-2 py-1">
                    <Crown size={12} />
                      <span className="text-p3">{token.topTenHolders.toFixed(0)}%</span>
                      </span>
                  </Tooltip>
                  <Tooltip title={`The market cap of this token is ${formatUsd(new BigNumber(token.marketCap), { exact: false })}`}>
                    <span className="text-p3 border border-border rounded-md px-2 py-1">MC: {formatUsd(new BigNumber(token.marketCap), { exact: false })}</span>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
