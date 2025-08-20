import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { useLocalStorage } from "usehooks-ts";

import useFetchMarketData from "@/fetchers/useFetchMarketData";

export interface TrendingCoin {
  coin_type: string;
  name: string;
  symbol: string;
  logo: string;
  price: string;
  price_change_1d: number;
  price_change_6h: number;
  price_change_4h: number;
  price_change_1h: number;
  price_change_30m: number;
  vol_change_1d: number;
  liq_change_1d: number;
  tx_change_1d: number;
  tx_24h: number;
  volume_24h: string;
  volume_6h: string;
  volume_4h: string;
  volume_30m: string;
  maker_24h: number;
  market_cap: string;
  liquidity_usd: string;
  circulating_supply: string;
  total_supply: string;
  published_at: string;
  verified: boolean;
  rank?: number;
  decimals: number;
}

export interface MarketData {
  steammCoinTypes: string[];
  trendingCoins: TrendingCoin[];
}

interface MarketContext {
  marketData: MarketData | undefined;
  refreshMarketData: () => Promise<void>;
  quickBuyAmount: number;
  setQuickBuyAmount: (amount: number) => void;
  watchlist: string[];
  setWatchlist: (coinId: string) => void;
  isWatchlistMode: boolean;
  setIsWatchlistMode: (isWatchlistMode: boolean) => void;
}

type LoadedMarketContext = MarketContext & {
  marketData: MarketData;
};

const MarketContext = createContext<MarketContext>({
  marketData: undefined,
  refreshMarketData: async () => {
    throw Error("MarketContextProvider not initialized");
  },
  quickBuyAmount: 0.05,
  setQuickBuyAmount: () => {
    throw Error("MarketContextProvider not initialized");
  },
  watchlist: [],
  setWatchlist: () => {
    throw Error("MarketContextProvider not initialized");
  },
  isWatchlistMode: false,
  setIsWatchlistMode: () => {
    throw Error("MarketContextProvider not initialized");
  },
});

export const useMarketContext = () => useContext(MarketContext);
export const useLoadedMarketContext = () =>
  useMarketContext() as LoadedMarketContext;

export function MarketContextProvider({ children }: PropsWithChildren) {
  // Market data (blocking)
  const { data: marketData, mutateData: mutateMarketData } =
    useFetchMarketData();
  const [isWatchlistMode, setIsWatchlistMode] = useLocalStorage<boolean>(
    "isWatchlistMode",
    false,
  );
  const [quickBuyAmount, setQuickBuyAmount] = useLocalStorage<number>(
    "quickBuyAmount",
    5,
  );
  const [watchlist, _setWatchlist] = useLocalStorage<string[]>("watchlist", []);

  const setWatchlist = useCallback(
    (coinId: string) => {
      _setWatchlist((prev) => {
        if (prev.includes(coinId)) {
          return prev.filter((id) => id !== coinId);
        }
        return [...prev, coinId];
      });
    },
    [_setWatchlist],
  );

  const refreshMarketData = useCallback(async () => {
    await mutateMarketData();
  }, [mutateMarketData]);

  // Context
  const contextValue: MarketContext = useMemo(
    () => ({
      marketData,
      refreshMarketData,
      quickBuyAmount,
      setQuickBuyAmount,
      watchlist,
      setWatchlist,
      isWatchlistMode,
      setIsWatchlistMode,
    }),
    [
      marketData,
      refreshMarketData,
      quickBuyAmount,
      setQuickBuyAmount,
      watchlist,
      setWatchlist,
      isWatchlistMode,
      setIsWatchlistMode,
    ],
  );

  return (
    <MarketContext.Provider value={contextValue}>
      {children}
    </MarketContext.Provider>
  );
}
