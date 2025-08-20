import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

import TokenColumn from "@/components/tokens/TokenColumn";
import { Skeleton } from "@/components/ui/skeleton";

// Mock token data
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
  const [searchString, setSearchString] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>(
    FilterType.FEATURED,
  );

  // Mock different token sets for different columns
  const newTokens = mockTokens.slice(0, 4);
  const trendingTokens = mockTokens.slice(1, 5);
  const topTokens = mockTokens
    .slice(2, 6)
    .sort((a, b) => b.marketCap - a.marketCap);
  const watchlistTokens = [mockTokens[1], mockTokens[5]]; // Verified tokens

  return (
    <>
      <Head>
        <title>STEAMM | Tokens</title>
      </Head>

      <div className="flex w-full flex-col gap-8">
        {/* Header */}
        <div className="flex w-full flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-4">
            <h1 className="text-h1 text-foreground">Tokens</h1>
            <div className="flex flex-row items-center gap-2">
              <div className="bg-blue-500 flex h-6 w-6 items-center justify-center rounded-full">
                <span className="text-xs text-white">W</span>
              </div>
              <span className="text-p2 text-secondary-foreground">
                Watchlist
              </span>
            </div>
          </div>

          <div className="flex flex-row items-center gap-4">
            <div className="flex flex-row items-center gap-2">
              <span className="text-p2 text-secondary-foreground">Buy</span>
              <div className="bg-blue-500 flex h-6 w-6 items-center justify-center rounded-full">
                <span className="text-xs text-white">0.05</span>
              </div>
            </div>
            <span className="text-p2 text-secondary-foreground">P1 P2 P3</span>
            <Link
              href="/create"
              className="text-sm rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create token
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex w-full flex-col gap-6">
          {/* Token Columns */}
          <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-4">
            {/* New */}
            <TokenColumn
              title="New"
              tokens={newTokens}
              searchString={searchString}
              onSearchChange={setSearchString}
              showSearch
            />

            {/* Trending */}
            <TokenColumn
              title="Trending"
              tokens={trendingTokens}
              searchString=""
              onSearchChange={() => {}}
            />

            {/* Top */}
            <TokenColumn
              title="Top"
              tokens={topTokens}
              searchString=""
              onSearchChange={() => {}}
            />

            {/* Watchlist */}
            <TokenColumn
              title="Watchlist"
              tokens={watchlistTokens}
              searchString=""
              onSearchChange={() => {}}
            />
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
              {mockTokens.map((token) => (
                <div key={token.id} className="rounded-md border p-4">
                  <div className="flex flex-row items-center gap-3">
                    <div className="h-12 w-12 rounded-full">
                      <Skeleton className="h-full w-full rounded-full" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-row items-center gap-2">
                        <h3 className="text-p1 font-medium text-foreground">
                          {token.name}
                        </h3>
                        {token.isVerified && (
                          <div className="bg-green-500 h-4 w-4 rounded-full" />
                        )}
                        <span className="text-green-500 text-p2">
                          +{token.change24h}%
                        </span>
                      </div>
                      <div className="flex flex-row items-center gap-4 text-p3 text-secondary-foreground">
                        <span>{token.timeAgo}</span>
                        <span>👥 {token.rating}</span>
                        <span>MC: ${token.marketCap / 1000}K</span>
                      </div>
                    </div>
                    <div className="ml-auto">
                      <button className="bg-blue-500 text-sm text-white rounded-md px-3 py-1">
                        {token.price}
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
