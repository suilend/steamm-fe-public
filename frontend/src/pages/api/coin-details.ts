import { NextApiRequest, NextApiResponse } from "next";

const NOODLES_API_BASE = "https://api.noodles.fi";
const CACHE_TTL_MS = 5 * 60 * 1000; // 1 minutes in milliseconds

// In-memory cache structure
interface CachedCoinData {
  data: CoinDetailResponse;
  timestamp: number;
}

interface CachedVolumeData {
  data: Record<string, VolumeData>;
  timestamp: number;
}

// Cache storage
const coinDetailsCache = new Map<string, CachedCoinData>();
const volumeDataCache = new Map<string, CachedVolumeData>();

// Cache key helpers
const getCoinDetailCacheKey = (coinId: string): string =>
  `coin_detail_${coinId}`;
const getVolumeCacheKey = (coinIds: string[]): string =>
  `volume_${coinIds.sort().join(",")}`;

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
  for (const [key, value] of volumeDataCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      volumeDataCache.delete(key);
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

    // Helper function to chunk coin IDs for API limits (max 100 items per request)
    const chunkCoinIds = (
      coinIds: string[],
      chunkSize: number = 100,
    ): string[][] => {
      const chunks: string[][] = [];
      for (let i = 0; i < coinIds.length; i += chunkSize) {
        chunks.push(coinIds.slice(i, i + chunkSize));
      }
      return chunks;
    };

    // Separate cached and uncached coin IDs
    const cachedResults: CoinDetailResponse[] = [];
    const staleResults: CoinDetailResponse[] = [];
    const uncachedCoinIds: string[] = [];

    for (const coinId of requestBody.coin_ids) {
      const cacheKey = getCoinDetailCacheKey(coinId);
      const cached = coinDetailsCache.get(cacheKey);

      if (cached && isCacheValid(cached.timestamp)) {
        // Fresh cache hit
        cachedResults.push(cached.data);
      } else if (cached && hasCachedData(cached.timestamp)) {
        // Stale cache - keep for potential fallback
        staleResults.push(cached.data);
        uncachedCoinIds.push(coinId);
      } else {
        // No cache at all
        uncachedCoinIds.push(coinId);
      }
    }

    console.log(
      `Cache hit for ${cachedResults.length} coins, ${staleResults.length} stale cached, fetching ${uncachedCoinIds.length} from API`,
    );

    // Create promises for uncached coin detail requests
    const coinDetailPromises = uncachedCoinIds.map(async (coinId) => {
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

        if (data.code !== 200) {
          throw new Error(`API error: ${data.message}`);
        }

        // Cache the successful result
        const cacheKey = getCoinDetailCacheKey(coinId);
        coinDetailsCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });

        return { status: "fulfilled" as const, value: data };
      } catch (error) {
        return {
          status: "rejected" as const,
          reason: {
            coin_id: coinId,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    });

    // Check volume data cache
    const allCoinIds = requestBody.coin_ids;
    const volumeCacheKey = getVolumeCacheKey(allCoinIds);
    const cachedVolumeData = volumeDataCache.get(volumeCacheKey);

    let volumePromises: Promise<any>[] = [];
    let hasStaleVolumeData = false;

    if (cachedVolumeData && isCacheValid(cachedVolumeData.timestamp)) {
      console.log("Volume data cache hit");
      // Use cached volume data
      volumePromises = [
        Promise.resolve({
          status: "fulfilled" as const,
          value: { status: "fulfilled" as const, value: cachedVolumeData.data },
        }),
      ];
    } else {
      if (cachedVolumeData && hasCachedData(cachedVolumeData.timestamp)) {
        console.log("Volume data cache stale, will fallback if API fails");
        hasStaleVolumeData = true;
      } else {
        console.log("Volume data cache miss, fetching from API");
      }

      // Create chunked POST requests for volume data (max 100 items per request)
      const coinIdChunks = chunkCoinIds(allCoinIds);
      console.log(
        `Fetching volume data in ${coinIdChunks.length} chunks of up to 100 items each`,
      );

      volumePromises = coinIdChunks.map(async (chunk) => {
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
              body: JSON.stringify({
                coin_ids: chunk,
              }),
            },
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data: VolumeResponse = await response.json();

          if (data.code !== 200) {
            throw new Error(`API error: ${data.message}`);
          }

          return { status: "fulfilled" as const, value: data.data };
        } catch (error) {
          console.error("Volume API error:", error);
          return { status: "rejected" as const, reason: error };
        }
      });
    }

    // Execute all requests in parallel (only if there are uncached requests)
    const [coinDetailResults, volumeResults] = await Promise.all([
      uncachedCoinIds.length > 0
        ? Promise.allSettled(coinDetailPromises)
        : Promise.resolve([]),
      Promise.allSettled(volumePromises),
    ]);

    // Merge volume data from all chunks
    const volumeData: Record<string, VolumeData> = {};
    let volumeApiSuccessful = false;

    volumeResults.forEach((result) => {
      if (
        result.status === "fulfilled" &&
        result.value.status === "fulfilled"
      ) {
        Object.assign(volumeData, result.value.value);
        volumeApiSuccessful = true;
      }
    });

    // Fallback to stale volume data if API failed and we have stale data
    if (!volumeApiSuccessful && hasStaleVolumeData && cachedVolumeData) {
      console.log("Volume API failed, falling back to stale cached data");
      Object.assign(volumeData, cachedVolumeData.data);
    }

    // Cache the volume data if it was successfully fetched from API
    if (volumeApiSuccessful) {
      volumeDataCache.set(volumeCacheKey, {
        data: volumeData,
        timestamp: Date.now(),
      });
      console.log("Volume data cached successfully");
    }

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
    const failedCoinIds = failed.map((f) => f.coin_id);
    const staleResultsToUse = staleResults.filter(
      (staleResult) =>
        failedCoinIds.includes(staleResult.data.coin.coin_type) ||
        uncachedCoinIds.some(
          (coinId) => staleResult.data.coin.coin_type === coinId,
        ),
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
    if (successful.length - apiSuccessfulCount > 0 || volumeApiSuccessful) {
      cleanupCache();
    }

    console.log(
      `Coin details fetch completed: ${successful.length} successful (${cachedResults.length} from cache, ${successful.length - cachedResults.length} from API), ${failed.length} failed`,
    );
    console.log(
      `Volume data fetch completed: ${Object.keys(volumeData).length} coins with volume data`,
    );

    console.log(volumeData);
    console.log(
      `Cache sizes: ${coinDetailsCache.size} coin details, ${volumeDataCache.size} volume data entries`,
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
