import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";
import { useFlags } from "launchdarkly-react-client-sdk";
import { useLocalStorage } from "usehooks-ts";

import {
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import {
  ParsedLendingMarket,
  ParsedReserve,
  SuilendClient,
} from "@suilend/sdk";
import { Reserve } from "@suilend/sdk/_generated/suilend/reserve/structs";
import {
  BETA_CONFIG,
  BankInfo,
  MAINNET_CONFIG,
  PoolInfo,
  SteammSDK,
} from "@suilend/steamm-sdk";

import useFetchAppData from "@/fetchers/useFetchAppData";
import useFetchBanksData from "@/fetchers/useFetchBanksData";
import useFetchLstData from "@/fetchers/useFetchLstData";
import useFetchPoolsData from "@/fetchers/useFetchPoolsData";
import { ParsedBank, ParsedPool } from "@/lib/types";

export interface AppData {
  mainMarket: {
    reserveMap: Record<string, ParsedReserve>;

    depositAprPercentMap: Record<string, BigNumber>;
  };
  lmMarket: {
    suilendClient: SuilendClient;

    lendingMarket: ParsedLendingMarket;

    refreshedRawReserves: Reserve<string>[];
    reserveMap: Record<string, ParsedReserve>;

    rewardPriceMap: Record<string, BigNumber | undefined>;
    rewardCoinMetadataMap: Record<string, CoinMetadata>;
  };

  coinMetadataMap: Record<string, CoinMetadata>;

  bankInfos: BankInfo[];
  poolInfos: PoolInfo[];
}
export interface BanksData {
  bTokenTypeCoinTypeMap: Record<string, string>;

  banks: ParsedBank[];
  bankMap: Record<string, ParsedBank>;
}
export interface PoolsData {
  coinTypePythPriceMap: Record<string, BigNumber>;
  coinTypeSwitchboardPriceMap: Record<string, BigNumber>;

  pools: ParsedPool[];
}
export interface LstData {
  lstCoinTypes: string[];
  aprPercentMap: Record<string, BigNumber>;
}

interface AppContext {
  steammClient: SteammSDK | undefined;

  appData: AppData | undefined;
  refreshAppData: () => Promise<void>;

  banksData: BanksData | undefined; // Depends on appData
  refreshBanksData: () => Promise<void>;

  poolsData: PoolsData | undefined; // Depends on appData and banksData
  refreshPoolsData: () => Promise<void>;

  lstData: LstData | undefined;

  slippagePercent: number;
  setSlippagePercent: (slippagePercent: number) => void;

  featuredPoolPairs: string[] | undefined;
}
type LoadedAppContext = AppContext & {
  steammClient: SteammSDK;

  appData: AppData;
};

const AppContext = createContext<AppContext>({
  steammClient: undefined,
  appData: undefined,
  refreshAppData: async () => {
    throw Error("AppContextProvider not initialized");
  },

  banksData: undefined,
  refreshBanksData: async () => {
    throw Error("AppContextProvider not initialized");
  },

  poolsData: undefined,
  refreshPoolsData: async () => {
    throw Error("AppContextProvider not initialized");
  },

  lstData: undefined,

  slippagePercent: 1,
  setSlippagePercent: () => {
    throw Error("AppContextProvider not initialized");
  },

  featuredPoolPairs: undefined,
});

export const useAppContext = () => useContext(AppContext);
export const useLoadedAppContext = () => useAppContext() as LoadedAppContext;

export function AppContextProvider({ children }: PropsWithChildren) {
  const { rpc } = useSettingsContext();
  const { address } = useWalletContext();

  // STEAMM client
  const steammClient = useMemo(() => {
    const sdk = new SteammSDK({
      ...(process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
        ? BETA_CONFIG
        : MAINNET_CONFIG),
      fullRpcUrl: rpc.url,
    });
    sdk.senderAddress =
      address ??
      "0x0000000000000000000000000000000000000000000000000000000000000000"; // Address must be set to use the SDK

    return sdk;
  }, [rpc.url, address]);

  // App data (blocking)
  const { data: appData, mutateData: mutateAppData } =
    useFetchAppData(steammClient);

  const refreshAppData = useCallback(async () => {
    await mutateAppData();
  }, [mutateAppData]);

  // Banks (non-blocking)
  const { data: banksData, mutateData: mutateBanksData } = useFetchBanksData(
    steammClient,
    appData,
  );

  const refreshBanksData = useCallback(async () => {
    await mutateBanksData();
  }, [mutateBanksData]);

  // Pools (non-blocking)
  const { data: poolsData, mutateData: mutatePoolsData } = useFetchPoolsData(
    steammClient,
    appData,
    banksData,
  );

  const refreshPoolsData = useCallback(async () => {
    await mutatePoolsData();
  }, [mutatePoolsData]);

  // LST (non-blocking)
  const { data: lstData } = useFetchLstData();

  // Slippage
  const [slippagePercent, setSlippagePercent] = useLocalStorage<number>(
    "slippagePercent",
    1,
  );

  // Featured pools
  const flags = useFlags();
  const featuredPoolPairs: string[] | undefined = useMemo(
    () => flags?.steammFeaturedPoolPairs ?? [],
    [flags?.steammFeaturedPoolPairs],
  );

  // Context
  const contextValue: AppContext = useMemo(
    () => ({
      steammClient,

      appData,
      refreshAppData,

      banksData,
      refreshBanksData,

      poolsData,
      refreshPoolsData,

      lstData,

      slippagePercent,
      setSlippagePercent,

      featuredPoolPairs,
    }),
    [
      steammClient,
      appData,
      refreshAppData,
      banksData,
      refreshBanksData,
      poolsData,
      refreshPoolsData,
      lstData,
      slippagePercent,
      setSlippagePercent,
      featuredPoolPairs,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
