import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { Transaction } from "@mysten/sui/transactions";
import { SUI_DECIMALS } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import { useLocalStorage } from "usehooks-ts";

import {
  QuoteProvider,
  getAggSortedQuotesAll,
  getSwapTransaction,
} from "@suilend/sdk";
import {
  NORMALIZED_SUI_COINTYPE,
  formatToken,
  getBalanceChange,
  getToken,
} from "@suilend/sui-fe";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import useFetchMarketData from "@/fetchers/useFetchMarketData";
import { useAggSdks } from "@/lib/agg-swap";
import { MAX_BALANCE_SUI_SUBTRACTED_AMOUNT } from "@/lib/constants";
import { formatPercentInputValue } from "@/lib/format";
import { showSuccessTxnToast } from "@/lib/toasts";

const SUI_TOKEN = getToken(NORMALIZED_SUI_COINTYPE, {
  decimals: SUI_DECIMALS,
  name: "sui",
  symbol: "SUI",
  description: "",
});

// Generic token interface for quick buy
export interface QuickBuyToken {
  id: string;
  symbol: string;
  decimals: number;
  description: string;
  name: string;
  coinType: string;
}

export interface TrendingCoin {
  coinType: string;
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
  holders: number;
  market_cap: string;
  liquidity_usd: string;
  circulating_supply: string;
  total_supply: string;
  published_at: string;
  verified: boolean;
  rank?: number;
  decimals: number;
  description: string;
  topTenHolders: number;
}

// Token interface for UI components
export interface Token {
  id: string;
  name: string;
  symbol: string;
  image: string | null;
  change24h: number;
  timeAgo: string;
  holders: number;
  marketCap: number;
  price: number;
  isVerified: boolean;
  decimals: number;
  description: string;
  coinType: string;
  topTenHolders: number;
  volume24h: string;
  rank?: number; // Original ranking position, unaffected by filtering
}

export interface MarketData {
  steammCoinTypes: string[];
  trendingCoins: TrendingCoin[];
}

interface MarketContext {
  marketData: MarketData | undefined;
  refreshMarketData: () => Promise<void>;
  quickBuyAmount: string;
  setQuickBuyAmount: (amount: string) => void;
  watchlist: string[];
  setWatchlist: (coinId: string) => void;
  isWatchlistMode: boolean;
  setIsWatchlistMode: (isWatchlistMode: boolean) => void;
  slippagePercent: string;
  setSlippagePercent: (slippagePercent: string) => void;
  quickBuyToken: (token: QuickBuyToken) => Promise<void>;
  buyingTokenId: string | null;
  quickBuyModalOpen: boolean;
  quickBuyModalData: {
    token: QuickBuyToken | null;
    quote: any;
    isLoading: boolean;
    isExecuting: boolean;
    error?: string;
  };
  setQuickBuyModalOpen: (open: boolean) => void;
}

type LoadedMarketContext = MarketContext & {
  marketData: MarketData;
};

const MarketContext = createContext<MarketContext>({
  marketData: undefined,
  refreshMarketData: async () => {
    throw Error("MarketContextProvider not initialized");
  },
  quickBuyAmount: "5",
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
  slippagePercent: "20",
  setSlippagePercent: () => {
    throw Error("MarketContextProvider not initialized");
  },
  quickBuyToken: async () => {
    throw Error("MarketContextProvider not initialized");
  },
  buyingTokenId: null,
  quickBuyModalOpen: false,
  quickBuyModalData: {
    token: null,
    quote: null,
    isLoading: false,
    isExecuting: false,
  },
  setQuickBuyModalOpen: () => {
    throw Error("MarketContextProvider not initialized");
  },
});

export const useMarketContext = () => useContext(MarketContext);
export const useLoadedMarketContext = () =>
  useMarketContext() as LoadedMarketContext;

export function MarketContextProvider({ children }: PropsWithChildren) {
  // External contexts
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { appData } = useLoadedAppContext();
  const { getBalance, refresh } = useUserContext();
  const { sdkMap, partnerIdMap } = useAggSdks();

  // Market data (blocking)
  const { data: marketData, mutateData: mutateMarketData } =
    useFetchMarketData();
  const [quickBuyAmount, _setQuickBuyAmount] = useLocalStorage<string>(
    "quickBuyAmount",
    "5",
  );
  const [slippagePercent, _setSlippagePercent] = useLocalStorage<string>(
    "slippagePercent",
    "20",
  );
  const [watchlist, _setWatchlist] = useLocalStorage<string[]>("watchlist", []);
  const [isWatchlistMode, setIsWatchlistMode] = useLocalStorage<boolean>(
    "isWatchlistMode",
    watchlist.length > 0,
  );

  const setQuickBuyAmount = useCallback(
    (amount: string) => {
      if (!amount.match(/^\d*(\.\d*)?$/)) return;
      _setQuickBuyAmount(amount);
    },
    [_setQuickBuyAmount],
  );

  // Buy state
  const [buyingTokenId, setBuyingTokenId] = useState<string | null>(null);

  // Quick buy modal state
  const [quickBuyModalOpen, setQuickBuyModalOpen] = useState(false);
  const [quickBuyModalData, setQuickBuyModalData] = useState<{
    token: QuickBuyToken | null;
    quote: any;
    isLoading: boolean;
    isExecuting: boolean;
    error?: string;
  }>({
    token: null,
    quote: null,
    isLoading: false,
    isExecuting: false,
  });

  const activeProviders = useMemo(
    () => [QuoteProvider.CETUS, QuoteProvider._7K, QuoteProvider.FLOWX],
    [],
  );

  const setSlippagePercent = useCallback(
    (_value: string) => {
      if (!_value.match(/^\d*(\.\d*)?$/)) return;
      const formattedValue = formatPercentInputValue(_value, 2);

      _setSlippagePercent(formattedValue);
      if (+formattedValue > 0 && +formattedValue <= 100)
        _setSlippagePercent(formattedValue);
    },
    [_setSlippagePercent],
  );

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

  const handleModalClose = useCallback(() => {
    setQuickBuyModalOpen(false);
    setBuyingTokenId(null);
    setQuickBuyModalData({
      token: null,
      quote: null,
      isLoading: false,
      isExecuting: false,
    });
  }, []);

  const executeQuickBuyInternal = useCallback(
    async (token: QuickBuyToken, bestQuote: any) => {
      try {
        // Show executing state
        setQuickBuyModalData((prev) => ({
          ...prev,
          isExecuting: true,
        }));

        // Build transaction
        let transaction = new Transaction();
        const { transaction: swapTransaction, coinOut } =
          await getSwapTransaction(
            suiClient,
            address!,
            bestQuote,
            +slippagePercent,
            sdkMap,
            partnerIdMap,
            transaction,
            undefined,
          );

        if (!coinOut) {
          throw new Error("Failed to get output coin from swap");
        }

        transaction = swapTransaction;
        transaction.transferObjects([coinOut], address!);

        // Execute transaction - this will trigger wallet signing
        const res = await signExecuteAndWaitForTransaction(transaction, {
          auction: true,
        });

        const txUrl = explorer.buildTxUrl(res.digest);

        // Get balance changes for success message
        const balanceChangeIn = getBalanceChange(res, address!, SUI_TOKEN, -1);
        const balanceChangeOut = getBalanceChange(res, address!, token, 1);

        // Show success toast
        showSuccessTxnToast(
          [
            "Bought",
            balanceChangeOut !== undefined
              ? formatToken(balanceChangeOut, {
                  dp: token.decimals,
                  trimTrailingZeros: true,
                })
              : null,
            token.symbol,
            "with",
            balanceChangeIn !== undefined
              ? formatToken(balanceChangeIn, {
                  dp: SUI_TOKEN.decimals,
                  trimTrailingZeros: true,
                })
              : null,
            SUI_TOKEN.symbol,
          ]
            .filter(Boolean)
            .join(" "),
          txUrl,
        );

        refresh();

        // Close modal on success
        handleModalClose();
      } catch (error) {
        console.error("Execute buy error:", error);
        showErrorToast(
          `Failed to buy ${token.symbol}`,
          error as Error,
          undefined,
          true,
        );

        // Close modal on error
        handleModalClose();
      }
    },
    [
      suiClient,
      address,
      slippagePercent,
      sdkMap,
      partnerIdMap,
      signExecuteAndWaitForTransaction,
      explorer,
      refresh,
      handleModalClose,
    ],
  );

  const quickBuyToken = useCallback(
    async (token: QuickBuyToken) => {
      if (!quickBuyAmount.length) return;
      if (!address || !appData) {
        showErrorToast(
          "Wallet not connected",
          new Error("Please connect your wallet"),
        );
        return;
      }

      if (buyingTokenId) return; // Prevent multiple simultaneous buys

      // Open modal and start loading
      setBuyingTokenId(token.id);
      setQuickBuyModalData({
        token,
        quote: null,
        isLoading: true,
        isExecuting: false,
      });
      setQuickBuyModalOpen(true);

      try {
        // Get SUI token info
        const suiTokenType = NORMALIZED_SUI_COINTYPE;

        // Calculate amount in SUI (convert from SUI to smallest unit)
        const suiAmountIn = new BigNumber(quickBuyAmount)
          .times(10 ** SUI_DECIMALS)
          .integerValue(BigNumber.ROUND_DOWN)
          .toString();

        // Check SUI balance
        const suiBalance = getBalance(suiTokenType);
        const requiredSuiAmount = new BigNumber(suiAmountIn)
          .div(10 ** SUI_DECIMALS)
          .plus(MAX_BALANCE_SUI_SUBTRACTED_AMOUNT); // Add buffer for gas

        if (suiBalance.lt(requiredSuiAmount)) {
          throw new Error(
            `Insufficient SUI balance. Need ${requiredSuiAmount.toFixed(4)} SUI`,
          );
        }

        // Get aggregated quotes
        const swapQuotes = await getAggSortedQuotesAll(
          sdkMap,
          activeProviders,
          SUI_TOKEN,
          token,
          suiAmountIn,
        );

        const bestQuote = swapQuotes[0];
        if (!bestQuote) {
          throw new Error(`No swap quotes available for ${token.symbol}`);
        }

        // Format quote data for modal
        const quoteDetails = {
          inputAmount: quickBuyAmount,
          outputAmount: new BigNumber(bestQuote.out.amount).toString(),
          exchangeRate: new BigNumber(bestQuote.out.amount)
            .div(quickBuyAmount)
            .toString(),
          slippage: slippagePercent,
          provider:
            bestQuote.provider.slice(0, 1).toUpperCase() +
            bestQuote.provider.slice(1),
        };

        // Update modal with quote data
        setQuickBuyModalData({
          token,
          quote: quoteDetails,
          isLoading: false,
          isExecuting: false,
        });

        // Auto-execute the transaction after showing details
        setTimeout(() => {
          executeQuickBuyInternal(token, bestQuote);
        }, 1000); // Give user 1 second to see the details
      } catch (error) {
        console.error("Quote error:", error);
        setQuickBuyModalData({
          token,
          quote: null,
          isLoading: false,
          isExecuting: false,
          error: error instanceof Error ? error.message : "Failed to get quote",
        });
      }
    },
    [
      address,
      appData,
      buyingTokenId,
      quickBuyAmount,
      executeQuickBuyInternal,
      getBalance,
      sdkMap,
      activeProviders,
      slippagePercent,
    ],
  );

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
      slippagePercent,
      setSlippagePercent,
      quickBuyToken,
      buyingTokenId,
      quickBuyModalOpen,
      quickBuyModalData,
      setQuickBuyModalOpen,
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
      slippagePercent,
      setSlippagePercent,
      quickBuyToken,
      buyingTokenId,
      quickBuyModalOpen,
      quickBuyModalData,
      setQuickBuyModalOpen,
    ],
  );

  return (
    <MarketContext.Provider value={contextValue}>
      {children}
    </MarketContext.Provider>
  );
}
