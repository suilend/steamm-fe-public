import useSWR from "swr";

import { showErrorToast } from "@suilend/frontend-sui-next";
import { SteammSDK } from "@suilend/steamm-sdk";

import { AppData } from "@/contexts/AppContext";

export default function useFetchAppData(steammClient: SteammSDK) {
  const dataFetcher = async () => {
    const banks = await steammClient.getBanks();
    const pools = await steammClient.getPools();

    return {
      banks,
      pools,
    };
  };

  const { data, mutate } = useSWR<AppData>("appData", dataFetcher, {
    refreshInterval: 30 * 1000,
    onSuccess: (data) => {
      console.log("Refreshed app data", data);
    },
    onError: (err) => {
      showErrorToast("Failed to refresh app data", err);
      console.error(err);
    },
  });

  return { data, mutateData: mutate };
}
