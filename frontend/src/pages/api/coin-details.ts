import { NextApiRequest, NextApiResponse } from "next";

const NOODLES_API_BASE = "https://api.noodles.fi";

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

    // Helper function to chunk coin IDs for URL length limits
    const chunkCoinIds = (
      coinIds: string[],
      maxUrlLength: number = 2000,
    ): string[][] => {
      const chunks: string[][] = [];
      let currentChunk: string[] = [];
      let currentUrl = `${NOODLES_API_BASE}/api/v1/partner/coin-price-volume-multi?coin_ids=`;

      for (const coinId of coinIds) {
        const encodedCoinId = encodeURIComponent(coinId);
        const testUrl = currentUrl + [...currentChunk, encodedCoinId].join(",");

        if (testUrl.length > maxUrlLength && currentChunk.length > 0) {
          chunks.push([...currentChunk]);
          currentChunk = [coinId];
          currentUrl = `${NOODLES_API_BASE}/api/v1/partner/coin-price-volume-multi?coin_ids=`;
        } else {
          currentChunk.push(coinId);
        }
      }

      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }

      return chunks;
    };

    // Create promises for all coin detail requests
    const coinDetailPromises = requestBody.coin_ids.map(async (coinId) => {
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

    // Create promises for volume data requests (chunked)
    const coinIdChunks = chunkCoinIds(requestBody.coin_ids);
    const volumePromises = coinIdChunks.map(async (chunk) => {
      try {
        const coinIdsParam = chunk
          .map((id) => encodeURIComponent(id))
          .join(",");
        const response = await fetch(
          `${NOODLES_API_BASE}/api/v1/partner/coin-price-volume-multi?coin_ids=${coinIdsParam}`,
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

    // Execute all requests in parallel
    const [coinDetailResults, volumeResults] = await Promise.all([
      Promise.allSettled(coinDetailPromises),
      Promise.allSettled(volumePromises),
    ]);

    // Merge volume data from all chunks
    const volumeData: Record<string, VolumeData> = {};
    volumeResults.forEach((result) => {
      if (
        result.status === "fulfilled" &&
        result.value.status === "fulfilled"
      ) {
        Object.assign(volumeData, result.value.value);
      }
    });

    // Separate successful and failed requests
    const successful: CoinDetailResponse[] = [];
    const failed: { coin_id: string; error: string }[] = [];

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

    console.log(
      `Coin details fetch completed: ${successful.length} successful, ${failed.length} failed`,
    );
    console.log(
      `Volume data fetch completed: ${Object.keys(volumeData).length} coins with volume data`,
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
