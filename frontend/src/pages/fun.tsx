import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import BigNumber from "bignumber.js";

import QuickBuyModal from "@/components/tokens/QuickBuyModal";
import TokenColumn from "@/components/tokens/TokenColumn";
import TokenTicker from "@/components/tokens/TokenTicker";
import {
  Token,
  TrendingCoin,
  useLoadedMarketContext,
} from "@/contexts/MarketContext";
import { ASSETS_URL } from "@/lib/constants";

// Convert TrendingCoin to Token format
export const convertTrendingCoinToToken = (
  trendingCoin: TrendingCoin,
  rank?: number,
): Token => {
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
    id: trendingCoin.coinType,
    coinType: trendingCoin.coinType,
    name: trendingCoin.name,
    symbol: trendingCoin.symbol,
    image: trendingCoin.logo || null,
    change24h: trendingCoin.price_change_1h, // Use 1h change as requested
    timeAgo,
    holders: trendingCoin.holders,
    marketCap: marketCapValue,
    price: priceValue,
    isVerified: trendingCoin.verified,
    decimals: trendingCoin.decimals,
    description: trendingCoin.description,
    topTenHolders: trendingCoin.topTenHolders,
    volume24h: trendingCoin.volume_24h,
    rank,
    socialMedia: trendingCoin.socialMedia,
  };
};

export default function TokensPage() {
  const {
    marketData,
    quickBuyAmount,
    setQuickBuyAmount,
    watchlist,
    slippagePercent,
    setSlippagePercent,
    quickBuyModalOpen,
    quickBuyModalData,
    setQuickBuyModalOpen,
    setBuyingTokenId,
  } = useLoadedMarketContext();

  const [searchString, setSearchString] = useState<string>("");

  // Convert trending coins to Token format
  const allTokens = useMemo(() => {
    return marketData?.trendingCoins.map(convertTrendingCoinToToken) || [];
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
      .sort(
        (a, b) =>
          Math.abs(new BigNumber(b.volume24h).toNumber()) -
          Math.abs(new BigNumber(a.volume24h).toNumber()),
      ) // Sort by highest volume
      .slice(0, 10);
  }, [allTokens]);

  const topTokens = useMemo(() => {
    return allTokens
      .slice()
      .sort((a, b) => b.marketCap - a.marketCap) // Sort by market cap
      .slice(0, 10)
      .map((token, index) => ({
        ...token,
        rank: index + 1, // Assign rank based on market cap position (1-based)
      }));
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
      <TokenTicker tokens={allTokens} watchListTokens={watchlistTokens} />

      <div className="mt-6 flex w-full flex-col gap-8">
        {/* Header */}
        <div className="flex w-full flex-col justify-between gap-2 xl:flex-row xl:items-center">
          <h1 className="text-h1 text-foreground">Tokens</h1>

          <div className="flex flex-row items-center gap-4 max-xl:w-full max-xl:justify-between">
            <div className="text-sm flex items-center gap-2 rounded-md bg-background pr-2 text-button-1-foreground shadow-[inset_0_0_0_1px_hsl(var(--border))] transition-colors hover:bg-background/90">
              <div className="text-sm flex items-center gap-2 rounded-md bg-[#0C131F] px-3 py-2 text-button-1-foreground shadow-[inset_0_0_0_1px_hsl(var(--border))] transition-colors hover:bg-background/90">
                <span className="mr-4 text-focus">Quickbuy</span>
                <input
                  type="text"
                  value={quickBuyAmount}
                  onChange={(e) => setQuickBuyAmount(e.target.value)}
                  onBlur={(e) => {
                    if (!e.target.value.match(/^\d+(\.\d*)?$/)) {
                      setQuickBuyAmount("1");
                    }
                  }}
                  className="relative z-[1] min-w-8 !border-0 !bg-[transparent] text-right text-button-1 !shadow-none !outline-none placeholder:text-tertiary-foreground"
                  size={Math.max(1, quickBuyAmount.length || 1)}
                  style={{
                    width: `${Math.max(2, (quickBuyAmount.length || 1) * 0.6)}rem`,
                  }}
                />
                <Image
                  src={`${ASSETS_URL}/icons/sui.png`}
                  alt="Coin"
                  width={24}
                  height={24}
                  className="h-4 w-4"
                />
              </div>
              <Image
                src={`${ASSETS_URL}/icons/slippage.svg`}
                alt="Coin"
                width={24}
                height={24}
                className="h-4 w-4"
              />
              <input
                type="text"
                value={slippagePercent}
                onBlur={(e) => {
                  if (!e.target.value.match(/^\d+(\.\d*)?$/)) {
                    setSlippagePercent("20");
                  }
                }}
                placeholder="-"
                onChange={(e) => setSlippagePercent(e.target.value)}
                className="relative z-[1] w-6 !border-0 !bg-[transparent] text-right text-secondary-foreground !shadow-none !outline-none placeholder:text-tertiary-foreground"
              />
              <span className="text-secondary-foreground">%</span>
            </div>
            <Link href="/create">
              <button className="text-sm w-full rounded-md bg-button-1 px-3 py-2 font-medium text-button-1-foreground transition-colors hover:bg-button-1/90">
                Create<span className="hidden xl:inline"> token</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex w-full flex-col gap-6">
          {/* Token Columns */}
          <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-3">
            {/* New */}
            <TokenColumn
              title="New"
              tokens={newTokens}
              searchString={searchString}
              onSearchChange={setSearchString}
            />

            {/* Top */}
            <TokenColumn
              title="Trending"
              tokens={trendingTokens}
              searchString=""
              onSearchChange={() => {}}
            />

            <TokenColumn
              title="Top"
              rankedBezels
              tokens={topTokens}
              searchString=""
              onSearchChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Quick Buy Modal */}
      <QuickBuyModal
        isOpen={quickBuyModalOpen}
        onClose={() => {
          setQuickBuyModalOpen(false);
          setBuyingTokenId(null);
        }}
        token={quickBuyModalData.token!}
        quote={quickBuyModalData.quote}
        isLoading={quickBuyModalData.isLoading}
        isExecuting={quickBuyModalData.isExecuting}
        error={quickBuyModalData.error}
      />
    </>
  );
}
