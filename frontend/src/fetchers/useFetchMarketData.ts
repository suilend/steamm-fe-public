import useSWR, { useSWRConfig } from "swr";

import { API_URL } from "@suilend/sui-fe";
import { showErrorToast } from "@suilend/sui-fe-next";

import { MarketData, TrendingCoin } from "@/contexts/MarketContext";

const MISSED_STEAMM_COIN_TYPES = [
  "0x0ef38abcdaaafedd1e2d88929068a3f65b59bf7ee07d7e8f573c71df02d27522::attn::ATTN",
];

interface CoinDetailsResponse {
  successful: Array<{
    code: number;
    message: string;
    data: {
      coin: {
        coin_type: string;
        symbol: string;
        name: string;
        logo: string | null;
        description: string | null;
        liquidity: string | null;
        market_cap: string | null;
        fdv: string | null;
        circulating_supply: string | null;
        total_supply: string | null;
        holders: number | null;
        creator: string | null;
        published_at: string | null;
        verified: boolean;
        decimals: number | null;
      };
      price_change: {
        price: string;
        price_change_1h: number | null;
        price_change_6h: number | null;
        price_change_1d: number | null;
        price_change_7d: number | null;
        price_24h_low: string | null;
        price_24h_high: string | null;
        ath: string | null;
        atl: string | null;
      };
      social_media: {
        x: string | null;
        website: string | null;
        discord: string | null;
        coingecko_url: string | null;
        coinmarketcap_url: string | null;
        docs: string | null;
      } | null;
      tags: Array<{
        id: number;
        name: string;
      }> | null;
      rank: number | null;
      security: {
        mintable: boolean;
        blacklist: boolean;
        top_10_holders: number | null;
      } | null;
    };
  }>;
  failed: Array<{ coin_id: string; error: string }>;
}

export default function useFetchMarketData() {
  const { cache } = useSWRConfig();

  // Data fetcher
  const dataFetcher = async (): Promise<MarketData> => {
    // Fetch STEAMM coin types
    const coinTypesRes = await fetch(`${API_URL}/steamm/cointypes/all`);
    if (!coinTypesRes.ok) {
      throw new Error(
        `Failed to fetch STEAMM coin types: ${coinTypesRes.status}`,
      );
    }
    const steammCoinTypes: string[] = (await coinTypesRes.json()).concat(
      MISSED_STEAMM_COIN_TYPES,
    );

    // Fetch coin details data from our API endpoint
    const coinDetailsRes = await fetch("/api/coin-details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coin_ids: steammCoinTypes, // Fetch details for all STEAMM coin types
      }),
    });

    if (!coinDetailsRes.ok) {
      throw new Error(`Failed to fetch coin details: ${coinDetailsRes.status}`);
    }

    const coinDetailsData: CoinDetailsResponse = await coinDetailsRes.json();

    // Convert coin details to TrendingCoin format for compatibility
    const trendingCoins: TrendingCoin[] = coinDetailsData.successful.map(
      (detail) => ({
        coin_type: detail.data.coin.coin_type,
        name: detail.data.coin.name,
        symbol: detail.data.coin.symbol,
        logo: detail.data.coin.logo || "",
        price: detail.data.price_change.price,
        price_change_1d: detail.data.price_change.price_change_1d || 0,
        price_change_6h: detail.data.price_change.price_change_6h || 0,
        price_change_4h: detail.data.price_change.price_change_6h || 0, // Use 6h as fallback for 4h
        price_change_1h: detail.data.price_change.price_change_1h || 0,
        price_change_30m: 0, // Not available in coin-detail API
        vol_change_1d: 0, // Not available in coin-detail API
        liq_change_1d: 0, // Not available in coin-detail API
        tx_change_1d: 0, // Not available in coin-detail API
        tx_24h: 0, // Not available in coin-detail API
        volume_24h: "0", // Not available in coin-detail API
        volume_6h: "0", // Not available in coin-detail API
        volume_4h: "0", // Not available in coin-detail API
        volume_30m: "0", // Not available in coin-detail API
        maker_24h: detail.data.coin.holders || 0, // Use holders count as maker count
        market_cap: detail.data.coin.market_cap || "0",
        liquidity_usd: detail.data.coin.liquidity || "0",
        circulating_supply: detail.data.coin.circulating_supply || "0",
        total_supply: detail.data.coin.total_supply || "0",
        published_at: detail.data.coin.published_at || new Date().toISOString(),
        verified: detail.data.coin.verified,
        rank: detail.data.rank || undefined,
        decimals: detail.data.coin.decimals || 9,
      }),
    );

    console.log(
      `Fetched ${trendingCoins.length} coin details, ${coinDetailsData.failed.length} failed`,
    );

    return {
      steammCoinTypes,
      trendingCoins,
    };
  };

  const { data, mutate } = useSWR<MarketData>("marketData", dataFetcher, {
    refreshInterval: 30 * 1000, // 30 seconds refresh like AppContext
    onSuccess: (data) => {
      console.log("Fetched market data", data);
    },
    onError: (err, key) => {
      const isInitialLoad = cache.get(key)?.data === undefined;
      if (isInitialLoad) showErrorToast("Failed to fetch market data", err);

      console.error(err);
    },
  });

  return { data, mutateData: mutate };
}
