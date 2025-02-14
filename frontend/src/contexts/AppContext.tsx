import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";
import { useLocalStorage } from "usehooks-ts";

import {
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import useFetchBalances from "@suilend/frontend-sui-next/fetchers/useFetchBalances";
import useCoinMetadataMap from "@suilend/frontend-sui-next/hooks/useCoinMetadataMap";
import useRefreshOnBalancesChange from "@suilend/frontend-sui-next/hooks/useRefreshOnBalancesChange";
import {
  STEAMM_BETA_CONFIG,
  SUILEND_BETA_CONFIG,
  SteammSDK,
} from "@suilend/steamm-sdk";

import useFetchAppData from "@/fetchers/useFetchAppData";
import { ChartData } from "@/lib/chart";
import { ParsedPool } from "@/lib/types";

export interface AppData {
  lendingMarketIdTypeMap: Record<string, string>;

  pools: ParsedPool[];
  poolCoinTypes: string[];
  poolCoinMetadataMap: Record<string, CoinMetadata>;
  featuredCoinTypePairs: [string, string][];

  historicalTvlUsd_30d: ChartData[];
  volumeUsd_30d: BigNumber;
  historicalVolumeUsd_30d: ChartData[];
}

interface AppContext {
  steammClient: SteammSDK | undefined;
  appData: AppData | undefined;

  rawBalancesMap: Record<string, BigNumber> | undefined;
  balancesCoinMetadataMap: Record<string, CoinMetadata> | undefined;
  getBalance: (coinType: string) => BigNumber;

  refresh: () => Promise<void>; // Refreshes appData, and balances

  slippagePercent: number;
  setSlippagePercent: (slippagePercent: number) => void;
}
type LoadedAppContext = AppContext & {
  steammClient: SteammSDK;
  appData: AppData;
};

const AppContext = createContext<AppContext>({
  steammClient: undefined,
  appData: undefined,

  rawBalancesMap: undefined,
  balancesCoinMetadataMap: undefined,
  getBalance: () => {
    throw Error("AppContextProvider not initialized");
  },

  refresh: async () => {
    throw Error("AppContextProvider not initialized");
  },

  slippagePercent: 1,
  setSlippagePercent: () => {
    throw Error("AppContextProvider not initialized");
  },
});

export const useAppContext = () => useContext(AppContext);
export const useLoadedAppContext = () => useAppContext() as LoadedAppContext;

export function AppContextProvider({ children }: PropsWithChildren) {
  const { rpc } = useSettingsContext();
  const { address } = useWalletContext();

  // STEAMM client
  const steammClient = useMemo(() => {
    const sdk = new SteammSDK({
      fullRpcUrl: rpc.url,
      steamm_config: STEAMM_BETA_CONFIG,
      suilend_config: SUILEND_BETA_CONFIG,
    });
    sdk.senderAddress =
      address ??
      "0x0000000000000000000000000000000000000000000000000000000000000000"; // Address must be set to use the SDK

    return sdk;
  }, [rpc.url, address]);

  // App data
  const { data: appData, mutateData: mutateAppData } =
    useFetchAppData(steammClient);

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

  // Slippage
  const [slippagePercent, setSlippagePercent] = useLocalStorage<number>(
    "slippagePercent",
    1,
  );

  // Context
  const contextValue: AppContext = useMemo(
    () => ({
      steammClient,
      appData,

      rawBalancesMap,
      balancesCoinMetadataMap,
      getBalance,

      refresh,

      slippagePercent,
      setSlippagePercent,
    }),
    [
      steammClient,
      appData,
      rawBalancesMap,
      balancesCoinMetadataMap,
      getBalance,
      refresh,
      slippagePercent,
      setSlippagePercent,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
