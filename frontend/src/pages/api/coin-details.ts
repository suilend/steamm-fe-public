import { NextApiRequest, NextApiResponse } from "next";

const NOODLES_API_BASE = "https://api.noodles.fi";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

// In-memory cache structure
interface CachedCoinData {
  data: CoinDetailResponse;
  timestamp: number;
}

interface CachedVolumeData {
  data: VolumeData;
  timestamp: number;
}

// Cache storage
const coinDetailsCache = new Map<string, CachedCoinData>();
const volumeCoinCache = new Map<string, CachedVolumeData>();

// Cache key helpers
const getCoinDetailCacheKey = (coinId: string): string =>
  `coin_detail_${coinId}`;
const getVolumeCoinCacheKey = (coinId: string): string => `volume_${coinId}`;

// Cache cleanup function (removes expired entries) - only called on successful requests
const cleanupCache = () => {
  const now = Date.now();

  // Clean coin details cache
  for (const [key, value] of coinDetailsCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      coinDetailsCache.delete(key);
    }
  }

  // Clean volume data cache
  for (const [key, value] of volumeCoinCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      volumeCoinCache.delete(key);
    }
  }
};

// Check if cached data is still valid
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL_MS;
};

// Check if cached data exists (regardless of expiration)
const hasCachedData = (timestamp: number): boolean => {
  return timestamp > 0;
};

interface CoinDetailRequest {
  coin_ids: string[];
}

interface CoinDetailResponse {
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
    volume_data?: {
      volume_24h: string;
      volume_change_24h: number;
    } | null;
  };
}

interface VolumeData {
  price: number;
  volume_24h: number;
  price_change_24h: number;
  volume_change_24h: number;
}

interface VolumeResponse {
  code: number;
  message: string;
  data: Record<string, VolumeData>;
}

interface CoinDetailsResponse {
  successful: CoinDetailResponse[];
  failed: { coin_id: string; error: string }[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CoinDetailsResponse | { error: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const requestBody: CoinDetailRequest = req.body;

    // Validate required fields
    if (!requestBody.coin_ids || !Array.isArray(requestBody.coin_ids)) {
      return res.status(400).json({ error: "coin_ids array is required" });
    }

    if (requestBody.coin_ids.length === 0) {
      return res.status(400).json({ error: "coin_ids array cannot be empty" });
    }

    const apiKey = process.env.NOODLES_API_KEY;
    if (!apiKey) {
      console.error("NOODLES_API_KEY environment variable is not set");
      return res.status(500).json({ error: "API configuration error" });
    }

    // Separate cached and uncached coin IDs
    const cachedResults: CoinDetailResponse[] = [];
    const staleCoinIds: string[] = [];
    const uncachedCoinIds: string[] = [];

    for (const coinId of requestBody.coin_ids) {
      const cacheKey = getCoinDetailCacheKey(coinId);
      const cached = coinDetailsCache.get(cacheKey);

      if (cached && isCacheValid(cached.timestamp)) {
        // Fresh cache hit - include immediately
        cachedResults.push(cached.data);
      } else if (cached && hasCachedData(cached.timestamp)) {
        // Stale cache - include immediately and schedule background refresh
        cachedResults.push(cached.data);
        staleCoinIds.push(coinId);
      } else {
        // No cache at all
        uncachedCoinIds.push(coinId);
      }
    }

    console.log(
      `Cache hit for ${cachedResults.length} coins, ${staleCoinIds.length} stale cached, fetching ${uncachedCoinIds.length} from API`,
    );

    // Sort uncached coin details by staleness (oldest or missing first)
    const uncachedCoinIdsSorted = uncachedCoinIds
      .map((coinId) => ({
        coinId,
        ts: coinDetailsCache.get(getCoinDetailCacheKey(coinId))?.timestamp ?? 0,
      }))
      .sort((a, b) => a.ts - b.ts)
      .map(({ coinId }) => coinId);

    // Background refetch for stale cached coin details (fire-and-forget)
    const refetchCoinDetailInBackground = async (coinId: string) => {
      try {
        const response = await fetch(
          `${NOODLES_API_BASE}/api/v1/partner/coin-detail?coin_id=${encodeURIComponent(coinId)}`,
          {
            method: "GET",
            headers: {
              "Accept-Encoding": "application/json",
              "x-api-key": apiKey,
              "x-chain": "sui",
            },
          },
        );
        if (!response.ok) return;
        const data: CoinDetailResponse = await response.json();
        if (data.code !== 200) return;
        coinDetailsCache.set(getCoinDetailCacheKey(coinId), {
          data,
          timestamp: Date.now(),
        });
      } catch {
        // swallow
      }
    };

    // Limit immediate uncached fetches to 20, background the remainder
    const immediateUncachedCoinIds = uncachedCoinIdsSorted.slice(0, 20);
    const backgroundUncachedCoinIds = uncachedCoinIdsSorted.slice(20);

    // Fetch uncached coin details sequentially (stale-first, up to 20)
    const coinDetailResults: any[] = [];
    for (const coinId of immediateUncachedCoinIds) {
      try {
        const response = await fetch(
          `${NOODLES_API_BASE}/api/v1/partner/coin-detail?coin_id=${encodeURIComponent(coinId)}`,
          {
            method: "GET",
            headers: {
              "Accept-Encoding": "application/json",
              "x-api-key": apiKey,
              "x-chain": "sui",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: CoinDetailResponse = await response.json();
        if (data.code !== 200) throw new Error(`API error: ${data.message}`);

        // Cache the successful result
        const cacheKey = getCoinDetailCacheKey(coinId);
        coinDetailsCache.set(cacheKey, { data, timestamp: Date.now() });

        coinDetailResults.push({ status: "fulfilled", value: data });
      } catch (error) {
        coinDetailResults.push({
          status: "rejected",
          reason: {
            coin_id: coinId,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }
    // Schedule background for stale cached and remaining uncached
    for (const coinId of staleCoinIds) void refetchCoinDetailInBackground(coinId);
    for (const coinId of backgroundUncachedCoinIds)
      void refetchCoinDetailInBackground(coinId);

    // Volume: use per-coin cache immediately; background refetch stale; fetch missing per-coin
    const allCoinIds = requestBody.coin_ids;
    const volumeData: Record<string, VolumeData> = {};

    const refetchVolumeInBackground = async (coinId: string) => {
      try {
        const response = await fetch(
          `${NOODLES_API_BASE}/api/v1/partner/coin-price-volume-multi`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "x-api-key": apiKey,
              "x-chain": "sui",
            },
            body: JSON.stringify({ coin_ids: [coinId] }),
          },
        );
        if (!response.ok) return;
        const json: VolumeResponse = await response.json();
        if (json.code !== 200) return;
        const v = json.data[coinId];
        if (!v) return;
        volumeCoinCache.set(getVolumeCoinCacheKey(coinId), {
          data: v,
          timestamp: Date.now(),
        });
      } catch {
        // swallow
      }
    };

    // Sort all coins by staleness for the "missing" fetch order
    const coinsByStaleness = allCoinIds
      .map((coinId) => ({
        coinId,
        ts: volumeCoinCache.get(getVolumeCoinCacheKey(coinId))?.timestamp ?? 0,
      }))
      .sort((a, b) => a.ts - b.ts)
      .map(({ coinId }) => coinId);

    // Determine which coins are missing volume
    const missingVolumeIds: string[] = [];
    for (const coinId of coinsByStaleness) {
      const cached = volumeCoinCache.get(getVolumeCoinCacheKey(coinId));
      if (cached) {
        // Use cached immediately
        volumeData[coinId] = cached.data;
        if (!isCacheValid(cached.timestamp)) void refetchVolumeInBackground(coinId);
      } else {
        missingVolumeIds.push(coinId);
      }
    }

    // Limit immediate missing volume fetches to 20; background the rest
    const immediateMissingVolume = missingVolumeIds.slice(0, 20);
    const backgroundMissingVolume = missingVolumeIds.slice(20);

    for (const coinId of immediateMissingVolume) {
      try {
        const response = await fetch(
          `${NOODLES_API_BASE}/api/v1/partner/coin-price-volume-multi`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "x-api-key": apiKey,
              "x-chain": "sui",
            },
            body: JSON.stringify({ coin_ids: [coinId] }),
          },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json: VolumeResponse = await response.json();
        if (json.code !== 200) throw new Error(`API error: ${json.message}`);
        const v = json.data[coinId];
        if (v) {
          volumeData[coinId] = v;
          volumeCoinCache.set(getVolumeCoinCacheKey(coinId), {
            data: v,
            timestamp: Date.now(),
          });
        }
      } catch {
        // leave undefined
      }
    }

    for (const coinId of backgroundMissingVolume)
      void refetchVolumeInBackground(coinId);

    // Separate successful and failed requests from API calls
    const successful: CoinDetailResponse[] = [...cachedResults]; // Start with cached results
    const failed: { coin_id: string; error: string }[] = [];
    const apiSuccessfulCount = cachedResults.length;

    coinDetailResults.forEach((result) => {
      if (result.status === "fulfilled") {
        if (result.value.status === "fulfilled") {
          successful.push(result.value.value);
        } else {
          failed.push(result.value.reason);
        }
      } else {
        failed.push({ coin_id: "unknown", error: "Promise rejection" });
      }
    });

    // Fallback to stale data for failed coin detail requests
    const staleResultsToUse: CoinDetailResponse[] = cachedResults.filter((r) =>
      staleCoinIds.includes(r.data.coin.coin_type),
    );

    if (staleResultsToUse.length > 0) {
      console.log(
        `Using ${staleResultsToUse.length} stale cached results as fallback`,
      );
      successful.push(...staleResultsToUse);
      // Remove corresponding entries from failed array
      staleResultsToUse.forEach((staleResult) => {
        const index = failed.findIndex(
          (f) => f.coin_id === staleResult.data.coin.coin_type,
        );
        if (index > -1) {
          failed.splice(index, 1);
        }
      });
    }

    // Only cleanup cache if we had some successful API responses
    if (successful.length - apiSuccessfulCount > 0) {
      cleanupCache();
    }

    console.log(
      `Coin details fetch completed: ${successful.length} successful (${cachedResults.length} from cache, ${successful.length - cachedResults.length} from API), ${failed.length} failed`,
    );
    console.log(
      `Volume data fetch completed: ${Object.keys(volumeData).length} coins with volume data`,
    );

    console.log(
      `Cache sizes: ${coinDetailsCache.size} coin details, ${volumeCoinCache.size} volume data entries`,
    );

    // Enhance successful responses with volume data
    const enhancedSuccessful = successful.map((coinDetail) => {
      const coinType = coinDetail.data.coin.coin_type;
      const volume = volumeData[coinType];

      return {
        ...coinDetail,
        data: {
          ...coinDetail.data,
          volume_data: volume
            ? {
                volume_24h: volume.volume_24h.toString(),
                volume_change_24h: volume.volume_change_24h,
              }
            : null,
        },
      };
    });

    // Return both successful and failed results
    return res.status(200).json({
      successful: enhancedSuccessful,
      failed,
    });
  } catch (error) {
    console.error("Error fetching coin details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
