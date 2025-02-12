import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";

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
