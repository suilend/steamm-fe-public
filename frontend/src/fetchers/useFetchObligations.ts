import useSWR from "swr";

import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import { SuilendClient, initializeSuilend } from "@suilend/sdk";

import { useLoadedAppContext } from "@/contexts/AppContext";

export default function useFetchObligations() {
  const { suiClient } = useSettingsContext();
  const { address } = useWalletContext();
  const { appData } = useLoadedAppContext();

  const dataFetcher = async () => {
    if (!address) return {};

    const result: Record<string, { obligationOwnerCaps: []; obligations: [] }> =
      {};

    for (const [lendingMarketId, lendingMarketType] of Object.entries(
      appData.lendingMarketIdTypeMap,
    )) {
      // const suilendClient = await SuilendClient.initialize(
      //   lendingMarketId,
      //   lendingMarketType,
      //   suiClient,
      // );
      //
      // const { reserveMap, refreshedRawReserves } = await initializeSuilend(
      //   suiClient,
      //   suilendClient,
      // );
      //
      // const { obligationOwnerCaps, obligations } = await initializeObligations(
      //   suiClient,
      //   suilendClient,
      //   refreshedRawReserves,
      //   reserveMap,
      //   address,
      // );
      //
      // result[lendingMarketId] = { obligationOwnerCaps, obligations };
    }

    return result;
  };

  const { data, mutate } = useSWR<
    Record<string, { obligationOwnerCaps: []; obligations: [] }>
  >(`obligations-${address}`, dataFetcher, {
    refreshInterval: 30 * 1000,
    onSuccess: (data) => {
      console.log("Refreshed obligations data", data);
    },
    onError: (err) => {
      showErrorToast("Failed to refresh obligations data", err);
      console.error(err);
    },
  });

  return { data, mutateData: mutate };
}
