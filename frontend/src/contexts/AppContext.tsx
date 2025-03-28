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
  RewardMap,
  SuilendClient,
} from "@suilend/sdk";
import { Reserve } from "@suilend/sdk/_generated/suilend/reserve/structs";
import { LiquidStakingObjectInfo } from "@suilend/springsui-sdk";
import {
  BETA_CONFIG,
  BankInfo,
  MAINNET_CONFIG,
  OracleInfo,
  PoolInfo,
  SteammSDK,
} from "@suilend/steamm-sdk";

import useFetchAppData from "@/fetchers/useFetchAppData";
import useFetchBanksData from "@/fetchers/useFetchBanksData";
import useFetchOraclesData from "@/fetchers/useFetchOraclesData";
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

  LIQUID_STAKING_INFO_MAP: Record<string, LiquidStakingObjectInfo>;
  lstCoinTypes: string[];

  bankInfos: BankInfo[];
  poolInfos: PoolInfo[];
}
export interface OraclesData {
  oracleIndexOracleInfoPriceMap: Record<
    number,
    { oracleInfo: OracleInfo; price: BigNumber }
  >;
  coinTypeOracleInfoPriceMap: Record<
    string,
    { oracleInfo: OracleInfo; price: BigNumber }
  >;
}
export interface BanksData {
  bTokenTypeCoinTypeMap: Record<string, string>;

  banks: ParsedBank[];
  bankMap: Record<string, ParsedBank>;
}
export interface PoolsData {
  lstAprPercentMap: Record<string, BigNumber>;
  rewardMap: RewardMap;

  pools: ParsedPool[];
}

interface AppContext {
  steammClient: SteammSDK | undefined;

  appData: AppData | undefined;
  refreshAppData: () => Promise<void>;

  oraclesData: OraclesData | undefined;
  refreshOraclesData: () => Promise<void>;

  banksData: BanksData | undefined; // Depends on appData
  refreshBanksData: () => Promise<void>;

  poolsData: PoolsData | undefined; // Depends on appData, oraclesData, and banksData
  refreshPoolsData: () => Promise<void>;

  slippagePercent: number;
  setSlippagePercent: (slippagePercent: number) => void;

  featuredPoolIds: string[] | undefined;
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

  oraclesData: undefined,
  refreshOraclesData: async () => {
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

  slippagePercent: 1,
  setSlippagePercent: () => {
    throw Error("AppContextProvider not initialized");
  },

  featuredPoolIds: undefined,
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

  // Oracles (non-blocking)
  const { data: oraclesData, mutateData: mutateOraclesData } =
    useFetchOraclesData(steammClient);

  const refreshOraclesData = useCallback(async () => {
    await mutateOraclesData();
  }, [mutateOraclesData]);

  // Banks (non-blocking, depends on appData)
  const { data: banksData, mutateData: mutateBanksData } = useFetchBanksData(
    steammClient,
    appData,
  );

  const refreshBanksData = useCallback(async () => {
    await mutateBanksData();
  }, [mutateBanksData]);

  // Pools (non-blocking, depends on appData, oraclesData, and banksData)
  const { data: poolsData, mutateData: mutatePoolsData } = useFetchPoolsData(
    steammClient,
    appData,
    oraclesData,
    banksData,
  );

  const refreshPoolsData = useCallback(async () => {
    await mutatePoolsData();
  }, [mutatePoolsData]);

  // Slippage
  const [slippagePercent, setSlippagePercent] = useLocalStorage<number>(
    "slippagePercent",
    1,
  );

  // Featured pools
  const flags = useFlags();
  const featuredPoolIds: string[] | undefined = useMemo(
    () => flags?.steammFeaturedPoolIds ?? [],
    [flags?.steammFeaturedPoolIds],
  );

  // Context
  const contextValue: AppContext = useMemo(
    () => ({
      steammClient,

      appData,
      refreshAppData,

      oraclesData,
      refreshOraclesData,

      banksData,
      refreshBanksData,

      poolsData,
      refreshPoolsData,

      slippagePercent,
      setSlippagePercent,

      featuredPoolIds,
    }),
    [
      steammClient,
      appData,
      refreshAppData,
      oraclesData,
      refreshOraclesData,
      banksData,
      refreshBanksData,
      poolsData,
      refreshPoolsData,
      slippagePercent,
      setSlippagePercent,
      featuredPoolIds,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
