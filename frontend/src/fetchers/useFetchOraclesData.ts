import { SuiPriceServiceConnection } from "@pythnetwork/pyth-sui-js";
import BigNumber from "bignumber.js";
import pLimit from "p-limit";
import useSWR from "swr";

import { showErrorToast } from "@suilend/frontend-sui-next";
import { toHexString } from "@suilend/sdk";
import { OracleInfo, SteammSDK } from "@suilend/steamm-sdk";

import { OraclesData } from "@/contexts/AppContext";
import { ASSETS_URL } from "@/lib/constants";
import { OracleType } from "@/lib/oracles";

export default function useFetchOraclesData(steammClient: SteammSDK) {
  // Data
  const dataFetcher = async () => {
    const limit3 = pLimit(3);

    // Oracles
    const oracleInfos = await steammClient.getOracles();

    const oracleIndexOracleInfoMap: Record<number, OracleInfo> =
      oracleInfos.reduce(
        (acc, oracleInfo, index) => ({ ...acc, [index]: oracleInfo }),
        {} as Record<number, OracleInfo>,
      );

    const pythConnection = new SuiPriceServiceConnection(
      "https://hermes.pyth.network",
    );

    const oracleIndexOracleInfoPriceEntries: [
      number,
      { oracleInfo: OracleInfo; price: BigNumber },
    ][] = await Promise.all(
      Object.entries(oracleIndexOracleInfoMap).map(([index, oracleInfo]) =>
        limit3<[], [number, { oracleInfo: OracleInfo; price: BigNumber }]>(
          async () => {
            const priceIdentifier =
              oracleInfo.oracleType === OracleType.PYTH
                ? typeof oracleInfo.oracleIdentifier === "string"
                  ? oracleInfo.oracleIdentifier
                  : toHexString(oracleInfo.oracleIdentifier)
                : ""; // TODO: Parse Switchboard price identifier

            if (oracleInfo.oracleType === OracleType.PYTH) {
              const pythPriceFeeds =
                (await pythConnection.getLatestPriceFeeds([priceIdentifier])) ??
                [];

              return [
                +index,
                {
                  oracleInfo,
                  price: new BigNumber(
                    pythPriceFeeds[0]
                      .getPriceUnchecked()
                      .getPriceAsNumberUnchecked(),
                  ),
                },
              ];
            } else if (oracleInfo.oracleType === OracleType.SWITCHBOARD) {
              return [
                +index,
                {
                  oracleInfo,
                  price: new BigNumber(0.000001), // TODO: Fetch Switchboard price
                },
              ];
            } else {
              throw new Error(`Unknown oracle type: ${oracleInfo.oracleType}`);
            }
          },
        ),
      ),
    );
    const oracleIndexOracleInfoPriceMap = Object.fromEntries(
      oracleIndexOracleInfoPriceEntries,
    );

    let COINTYPE_ORACLE_INDEX_MAP: Record<string, number>;
    try {
      COINTYPE_ORACLE_INDEX_MAP = await (
        await fetch(
          `${ASSETS_URL}/cointype-oracle-index-map${process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true" ? "-beta" : ""}.json?timestamp=${Date.now()}`,
        )
      ).json();
    } catch (err) {
      COINTYPE_ORACLE_INDEX_MAP = {};
    }

    const coinTypeOracleInfoPriceMap: Record<
      string,
      { oracleInfo: OracleInfo; price: BigNumber }
    > = Object.entries(COINTYPE_ORACLE_INDEX_MAP).reduce(
      (acc, [coinType, oracleIndex]) => ({
        ...acc,
        [coinType]: oracleIndexOracleInfoPriceMap[oracleIndex],
      }),
      {} as Record<string, { oracleInfo: OracleInfo; price: BigNumber }>,
    );

    return {
      COINTYPE_ORACLE_INDEX_MAP,

      oracleIndexOracleInfoPriceMap,
      coinTypeOracleInfoPriceMap,
    };
  };

  const { data, mutate } = useSWR<OraclesData>("oraclesData", dataFetcher, {
    refreshInterval: 30 * 1000 * 60, // 30 minutes
    onSuccess: (data) => {
      console.log("Refreshed oracles data", data);
    },
    onError: (err) => {
      showErrorToast(
        "Failed to refresh oracles data. Please check your internet connection or change RPC providers in Settings.",
        err,
      );
      console.error(err);
    },
  });

  return { data, mutateData: mutate };
}
