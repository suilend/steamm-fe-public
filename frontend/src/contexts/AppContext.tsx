import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";

import { NORMALIZED_SEND_COINTYPE } from "@suilend/frontend-sui";
import { useSettingsContext } from "@suilend/frontend-sui-next";
import useFetchBalances from "@suilend/frontend-sui-next/fetchers/useFetchBalances";
import useCoinMetadataMap from "@suilend/frontend-sui-next/hooks/useCoinMetadataMap";
import useRefreshOnBalancesChange from "@suilend/frontend-sui-next/hooks/useRefreshOnBalancesChange";
import {
  BankList,
  PoolInfo,
  STEAMM_BETA_CONFIG,
  SUILEND_BETA_CONFIG,
  SteammSDK,
} from "@suilend/steamm-sdk";

import { BarChartData } from "@/components/BarChartStat";
import useFetchAppData from "@/fetchers/useFetchAppData";
import { PoolGroup } from "@/lib/types";

export interface AppData {
  banks: BankList;
  pools: PoolInfo[];

  poolGroups: PoolGroup[];
  featuredPoolGroupIds: string[];
  tvlData: BarChartData[];
  volumeData: BarChartData[];
  coinTypes: string[];
}

interface AppContext {
  steammClient: SteammSDK | undefined;
  appData: AppData | undefined;
  coinMetadataMap: Record<string, CoinMetadata> | undefined;

  rawBalancesMap: Record<string, BigNumber> | undefined;
  balancesCoinMetadataMap: Record<string, CoinMetadata> | undefined;
  getBalance: (coinType: string) => BigNumber;

  refresh: () => Promise<void>; // Refreshes appData, and balances
}
type LoadedAppContext = AppContext & {
  steammClient: SteammSDK;
  appData: AppData;
};

const AppContext = createContext<AppContext>({
  steammClient: undefined,
  appData: undefined,
  coinMetadataMap: undefined,

  rawBalancesMap: undefined,
  balancesCoinMetadataMap: undefined,
  getBalance: () => {
    throw Error("AppContextProvider not initialized");
  },

  refresh: async () => {
    throw Error("AppContextProvider not initialized");
  },
});

export const useAppContext = () => useContext(AppContext);
export const useLoadedAppContext = () => useAppContext() as LoadedAppContext;

export function AppContextProvider({ children }: PropsWithChildren) {
  const { rpc } = useSettingsContext();
  // const { address } = useWalletContext();

  // STEAMM client
  const steammClient = useMemo(() => {
    const sdk = new SteammSDK({
      fullRpcUrl: rpc.url,
      steamm_config: STEAMM_BETA_CONFIG,
      suilend_config: SUILEND_BETA_CONFIG,
    });
    // sdk.signer = address;

    return sdk;
  }, [rpc.url]);

  // App data
  const { data: appData, mutateData: mutateAppData } =
    useFetchAppData(steammClient);

  // CoinMetadataMap
  const coinMetadataMap = useCoinMetadataMap(appData?.coinTypes ?? []);
  if (coinMetadataMap?.[NORMALIZED_SEND_COINTYPE]) {
    // Use SEND logo instead of Suilend logo
    coinMetadataMap[NORMALIZED_SEND_COINTYPE].iconUrl =
      "data:image/png;base64,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";
  }

  // Balances
  const { data: rawBalancesMap, mutateData: mutateRawBalancesMap } =
    useFetchBalances();

  const refreshRawBalancesMap = useCallback(async () => {
    await mutateRawBalancesMap();
  }, [mutateRawBalancesMap]);

  const balancesCoinTypes = useMemo(
    () => Object.keys(rawBalancesMap ?? {}),
    [rawBalancesMap],
  );
  const balancesCoinMetadataMap = useCoinMetadataMap(balancesCoinTypes);

  const getBalance = useCallback(
    (coinType: string) => {
      if (rawBalancesMap?.[coinType] === undefined) return new BigNumber(0);

      const coinMetadata = balancesCoinMetadataMap?.[coinType];
      if (!coinMetadata) return new BigNumber(0);

      return new BigNumber(rawBalancesMap[coinType]).div(
        10 ** coinMetadata.decimals,
      );
    },
    [rawBalancesMap, balancesCoinMetadataMap],
  );

  // Refresh
  const refresh = useCallback(async () => {
    await mutateAppData();
    await refreshRawBalancesMap();
  }, [mutateAppData, refreshRawBalancesMap]);

  useRefreshOnBalancesChange(refresh);

  // Context
  const contextValue: AppContext = useMemo(
    () => ({
      steammClient,
      appData,
      coinMetadataMap,

      rawBalancesMap,
      balancesCoinMetadataMap,
      getBalance,

      refresh,
    }),
    [
      steammClient,
      appData,
      coinMetadataMap,
      rawBalancesMap,
      balancesCoinMetadataMap,
      getBalance,
      refresh,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
