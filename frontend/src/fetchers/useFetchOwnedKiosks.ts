import { useMemo } from "react";

import { KioskClient, KioskData, KioskOwnerCap, Network } from "@mysten/kiosk";
import useSWR from "swr";

import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";

export default function useFetchOwnedKiosks() {
  const { suiClient } = useSettingsContext();
  const { address } = useWalletContext();

  const kioskClient = useMemo(
    () => new KioskClient({ client: suiClient, network: Network.MAINNET }),
    [suiClient],
  );

  const dataFetcher = async () => {
    if (!address) return [];

    const allKioskOwnerCaps = [];
    let cursor = undefined;
    let hasNextPage = true;
    while (hasNextPage) {
      const kiosks = await kioskClient.getOwnedKiosks({
        address,
        pagination: {
          cursor,
        },
      });

      allKioskOwnerCaps.push(...kiosks.kioskOwnerCaps);
      cursor = kiosks.nextCursor ?? undefined;
      hasNextPage = kiosks.hasNextPage;
    }

    const result: { kiosk: KioskData; kioskOwnerCap: KioskOwnerCap }[] =
      await Promise.all(
        allKioskOwnerCaps
          .filter((kioskOwnerCap) => kioskOwnerCap.isPersonal)
          .map((kioskOwnerCap) =>
            (async () => {
              const kiosk = await kioskClient.getKiosk({
                id: kioskOwnerCap.kioskId,
              });

              return { kiosk, kioskOwnerCap };
            })(),
          ),
      );

    return result;
  };

  const { data, mutate } = useSWR<
    { kiosk: KioskData; kioskOwnerCap: KioskOwnerCap }[]
  >(`ownedKiosks-${address}`, dataFetcher, {
    refreshInterval: 30 * 1000,
    onSuccess: (data) => {
      console.log("Refreshed ownedKiosks data", data);
    },
    onError: (err) => {
      showErrorToast("Failed to refresh ownedKiosks data", err);
      console.error(err);
    },
  });

  return { data, mutateData: mutate };
}
