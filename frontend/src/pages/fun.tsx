import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import BigNumber from "bignumber.js";

import TokenColumn from "@/components/tokens/TokenColumn";
import TokenTicker from "@/components/tokens/TokenTicker";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { TrendingCoin, useLoadedMarketContext } from "@/contexts/MarketContext";
import { SUILEND_ASSETS_URL } from "@/lib/constants";

// Token interface for UI components
interface Token {
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

// Convert TrendingCoin to Token format
const convertTrendingCoinToToken = (trendingCoin: TrendingCoin): Token => {
  const marketCapValue = new BigNumber(
    trendingCoin.market_cap || "0",
  ).toNumber();
  const priceValue = new BigNumber(trendingCoin.price || "0").toNumber();

  // Calculate time ago from published_at
  const publishedDate = new Date(trendingCoin.published_at);
  const now = new Date();
  const diffMs = now.getTime() - publishedDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let timeAgo: string;
  if (diffMinutes < 60) {
    timeAgo = `${diffMinutes}m`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours}h`;
  } else {
    timeAgo = `${diffDays}d`;
  }

  return {
    id: trendingCoin.coin_type,
    name: trendingCoin.name,
    symbol: trendingCoin.symbol,
    image: trendingCoin.logo || null,
    change24h: trendingCoin.price_change_1h, // Use 1h change as requested
    timeAgo,
    rating: trendingCoin.maker_24h, // Use maker count as rating
    marketCap: marketCapValue,
    price: priceValue,
    isVerified: trendingCoin.verified,
  };
};

// Mock token data (fallback)
const mockTokens = [
  {
    id: "1",
    name: "ZOG",
    symbol: "ZOG",
    image: null,
    change24h: 7.26,
    timeAgo: "30m",
    rating: 225,
    marketCap: 100000,
    price: 0.05,
    isVerified: false,
  },
  {
    id: "2",
    name: "Moodeng",
    symbol: "MOODENG",
    image: null,
    change24h: 7.26,
    timeAgo: "30m",
    rating: 225,
    marketCap: 100000,
    price: 0.05,
    isVerified: true,
  },
  {
    id: "3",
    name: "lambofrog",
    symbol: "LAMBO",
    image: null,
    change24h: 7.26,
    timeAgo: "30m",
    rating: 225,
    marketCap: 100000,
    price: 0.05,
    isVerified: false,
  },
  {
    id: "4",
    name: "hurtz a lott",
    symbol: "HURT",
    image: null,
    change24h: 7.26,
    timeAgo: "30m",
    rating: 225,
    marketCap: 100000,
    price: 0.05,
    isVerified: false,
  },
  {
    id: "5",
    name: "SuiCat",
    symbol: "SCAT",
    image: null,
    change24h: -3.42,
    timeAgo: "1h",
    rating: 189,
    marketCap: 85000,
    price: 0.03,
    isVerified: false,
  },
  {
    id: "6",
    name: "MoonDoge",
    symbol: "MDOGE",
    image: null,
    change24h: 12.84,
    timeAgo: "15m",
    rating: 342,
    marketCap: 250000,
    price: 0.08,
    isVerified: true,
  },
  {
    id: "7",
    name: "RocketFuel",
    symbol: "ROCKET",
    image: null,
    change24h: -1.23,
    timeAgo: "2h",
    rating: 156,
    marketCap: 45000,
    price: 0.02,
    isVerified: false,
  },
  {
    id: "8",
    name: "DiamondHands",
    symbol: "DIAMOND",
    image: null,
    change24h: 25.67,
    timeAgo: "45m",
    rating: 478,
    marketCap: 500000,
    price: 0.15,
    isVerified: true,
  },
];

enum FilterType {
  FEATURED = "featured",
  LAST_TRADE = "lastTrade",
  CREATION_TIME = "creationTime",
  MARKET_CAP = "marketCap",
}

export default function TokensPage() {
  const {
    marketData,
    quickBuyAmount,
    setQuickBuyAmount,
    watchlist,
    isWatchlistMode,
    setIsWatchlistMode,
  } = useLoadedMarketContext();

  const [searchString, setSearchString] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>(
    FilterType.FEATURED,
  );

  // Convert trending coins to Token format
  const allTokens = useMemo(() => {
    if (!marketData?.trendingCoins) return mockTokens;
    return marketData.trendingCoins.map(convertTrendingCoinToToken);
  }, [marketData?.trendingCoins]);

  // Create different token sets for different columns
  const newTokens = useMemo(() => {
    return allTokens
      .slice()
      .sort(
        (a, b) => new Date(b.timeAgo).getTime() - new Date(a.timeAgo).getTime(),
      ) // Sort by newest
      .slice(0, 10);
  }, [allTokens]);

  const trendingTokens = useMemo(() => {
    return allTokens
      .slice()
      .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)) // Sort by highest price change
      .slice(0, 10);
  }, [allTokens]);

  const topTokens = useMemo(() => {
    return allTokens
      .slice()
      .sort((a, b) => b.marketCap - a.marketCap) // Sort by market cap
      .slice(0, 10);
  }, [allTokens]);

  const watchlistTokens = useMemo(() => {
    return allTokens
      .filter((token) => watchlist.includes(token.id))
      .slice(0, 10); // Verified tokens only
  }, [allTokens, watchlist]);

  return (
    <>
      <Head>
        <title>STEAMM | Tokens</title>
      </Head>
      {/* Token Ticker */}
      <TokenTicker tokens={allTokens} />

      <div className="mt-6 flex w-full flex-col gap-8">
        {/* Header */}
        <div className="flex w-full flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-4">
            <h1 className="text-h1 text-foreground">Tokens</h1>
            <div className="flex flex-row items-center gap-3">
              <Switch
                checked={isWatchlistMode}
                onCheckedChange={setIsWatchlistMode}
              />
              <span className="text-p2 text-secondary-foreground">
                Watchlist
              </span>
            </div>
          </div>

          <div className="flex flex-row items-center gap-4">
            <div className="text-sm flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-button-1-foreground transition-colors hover:bg-background/90">
              <span className="mr-4 text-tertiary-foreground">Buy</span>
              <Image
                src={`${SUILEND_ASSETS_URL}/Suilend.svg`}
                alt="Coin"
                width={24}
                height={24}
                className="h-4 w-4"
              />
              <input
                type="text"
                pattern="[0-9]*"
                min="0"
                value={quickBuyAmount}
                onChange={(e) => setQuickBuyAmount(Number(e.target.value))}
                className="relative z-[1] w-8 !border-0 !bg-[transparent] text-button-1 !shadow-none !outline-none placeholder:text-tertiary-foreground"
                placeholder="5"
              />
            </div>
            <Link href="/create">
              <button className="text-sm w-full rounded-md bg-button-1 px-3 py-2 font-medium text-button-1-foreground transition-colors hover:bg-button-1/90">
                Create token
              </button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex w-full flex-col gap-6">
          {/* Token Columns */}
          <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
            {/* New */}
            <TokenColumn
              title="New"
              tokens={newTokens}
              searchString={searchString}
              onSearchChange={setSearchString}
            />

            {/* Top */}
            <TokenColumn
              title="Top"
              tokens={topTokens}
              searchString=""
              onSearchChange={() => {}}
            />

            {/* Always show one more column - if watchlist is shown, show trending here, otherwise show watchlist */}
            {!isWatchlistMode ? (
              <TokenColumn
                title="Trending"
                tokens={trendingTokens}
                searchString=""
                onSearchChange={() => {}}
              />
            ) : (
              <TokenColumn
                title="Watchlist"
                tokens={watchlistTokens}
                searchString=""
                onSearchChange={() => {}}
              />
            )}
          </div>

          {/* Explore Section */}
          <div className="flex w-full flex-col gap-6">
            <div className="flex flex-row items-center justify-between">
              <h2 className="text-h3 text-foreground">Explore</h2>
              <div className="flex flex-row items-center gap-4">
                <button className="text-sm flex flex-row items-center gap-2 rounded-md border px-3 py-2 transition-colors hover:bg-card">
                  <span>Filter</span>
                </button>
                <div className="flex flex-row items-center gap-2">
                  <span className="text-p2 text-secondary-foreground">
                    Sort:
                  </span>
                  <select
                    value={selectedFilter}
                    onChange={(e) =>
                      setSelectedFilter(e.target.value as FilterType)
                    }
                    className="text-sm rounded-md border bg-background px-3 py-1"
                  >
                    <option value={FilterType.FEATURED}>Featured</option>
                    <option value={FilterType.LAST_TRADE}>Last trade</option>
                    <option value={FilterType.CREATION_TIME}>
                      Creation time
                    </option>
                    <option value={FilterType.MARKET_CAP}>Market cap</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Explore Grid */}
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allTokens.map((token) => (
                <div key={token.id} className="rounded-md border p-4">
                  <div className="flex flex-row items-center gap-3">
                    <div className="h-12 w-12 rounded-full">
                      {token.image ? (
                        <img
                          src={token.image}
                          alt={token.name}
                          className="h-full w-full rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                            (
                              e.target as HTMLImageElement
                            ).nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <Skeleton
                        className={`h-full w-full rounded-full ${token.image ? "hidden" : ""}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-row items-center gap-2">
                        <h3 className="text-p1 font-medium text-foreground">
                          {token.name}
                        </h3>
                        {token.isVerified && (
                          <div className="h-4 w-4 rounded-full bg-verified" />
                        )}
                        <span
                          className={`text-p2 ${token.change24h >= 0 ? "text-success" : "text-error"}`}
                        >
                          {token.change24h >= 0 ? "+" : ""}
                          {token.change24h.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex flex-row items-center gap-4 text-p3 text-secondary-foreground">
                        <span>{token.timeAgo}</span>
                        <span>👥 {token.rating}</span>
                        <span>
                          MC: $
                          {token.marketCap >= 1000000
                            ? (token.marketCap / 1000000).toFixed(1) + "M"
                            : (token.marketCap / 1000).toFixed(0) + "K"}
                        </span>
                      </div>
                    </div>
                    <div className="ml-auto">
                      <button className="text-sm rounded-md bg-button-1 px-3 py-1 text-button-1-foreground">
                        ${token.price.toFixed(4)}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
