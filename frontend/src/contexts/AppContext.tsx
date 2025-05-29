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
  ParsedLendingMarket,
  ParsedReserve,
  RewardMap,
  SuilendClient,
} from "@suilend/sdk";
import { Reserve } from "@suilend/sdk/_generated/suilend/reserve/structs";
import {
  BETA_CONFIG,
  MAINNET_CONFIG,
  OracleInfo,
  ParsedBank,
  ParsedPool,
  SteammSDK,
} from "@suilend/steamm-sdk";
import { useSettingsContext, useWalletContext } from "@suilend/sui-fe-next";

import useFetchAppData from "@/fetchers/useFetchAppData";

export interface AppData {
  suilend: {
    mainMarket: {
      suilendClient: SuilendClient;

      lendingMarket: ParsedLendingMarket;

      refreshedRawReserves: Reserve<string>[];
      reserveMap: Record<string, ParsedReserve>;

      rewardCoinMetadataMap: Record<string, CoinMetadata>;
      rewardPriceMap: Record<string, BigNumber | undefined>;

      depositAprPercentMap: Record<string, BigNumber>;
    };
    lmMarket: {
      suilendClient: SuilendClient;

      lendingMarket: ParsedLendingMarket;

      refreshedRawReserves: Reserve<string>[];
      reserveMap: Record<string, ParsedReserve>;

      rewardCoinMetadataMap: Record<string, CoinMetadata>;
      rewardPriceMap: Record<string, BigNumber | undefined>;
    };
  };

  coinMetadataMap: Record<string, CoinMetadata>;
  lstAprPercentMap: Record<string, BigNumber>;
  steammLaunchCoinTypes: string[];

  // Oracles
  oracleIndexOracleInfoPriceMap: Record<
    number,
    { oracleInfo: OracleInfo; price: BigNumber }
  >;
  COINTYPE_ORACLE_INDEX_MAP: Record<string, number>;
  coinTypeOracleInfoPriceMap: Record<
    string,
    { oracleInfo: OracleInfo; price: BigNumber }
  >;

  // Banks
  bTokenTypeCoinTypeMap: Record<string, string>;
  banks: ParsedBank[];
  bankMap: Record<string, ParsedBank>;

  // Pools
  pools: ParsedPool[];
  normalizedPoolRewardMap: RewardMap;
}
interface AppContext {
  steammClient: SteammSDK | undefined;

  appData: AppData | undefined;
  refreshAppData: () => Promise<void>;

  isLst: (coinType: string) => boolean;

  slippagePercent: number;
  setSlippagePercent: (slippagePercent: number) => void;

  featuredPoolIds: string[] | undefined;
  verifiedCoinTypes: string[] | undefined;
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

  isLst: () => {
    throw Error("AppContextProvider not initialized");
  },

  slippagePercent: 1,
  setSlippagePercent: () => {
    throw Error("AppContextProvider not initialized");
  },

  featuredPoolIds: undefined,
  verifiedCoinTypes: undefined,
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

  // LST
  const isLst = useCallback(
    (coinType: string) =>
      Object.keys(appData?.lstAprPercentMap ?? {}).includes(coinType),
    [appData?.lstAprPercentMap],
  );

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

  // Verified coinTypes
  const verifiedCoinTypes: string[] | undefined = useMemo(
    () => [
      ...Object.keys(appData?.suilend.mainMarket.reserveMap ?? {}),
      ...(flags?.steammVerifiedCoinTypes ?? []),
    ],
    [flags?.steammVerifiedCoinTypes, appData?.suilend.mainMarket.reserveMap],
  );

  // Context
  const contextValue: AppContext = useMemo(
    () => ({
      steammClient,

      appData,
      refreshAppData,

      isLst,

      slippagePercent,
      setSlippagePercent,

      featuredPoolIds,
      verifiedCoinTypes,
    }),
    [
      steammClient,
      appData,
      refreshAppData,
      isLst,
      slippagePercent,
      setSlippagePercent,
      featuredPoolIds,
      verifiedCoinTypes,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
