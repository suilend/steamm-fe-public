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
import {
  BETA_CONFIG,
  MAINNET_CONFIG,
  OracleInfo,
  SteammSDK,
} from "@suilend/steamm-sdk";

import useFetchAppData from "@/fetchers/useFetchAppData";
import { ParsedBank, ParsedPool } from "@/lib/types";

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

  slippagePercent: number;
  setSlippagePercent: (slippagePercent: number) => void;

  featuredPoolIds: string[] | undefined;
  verifiedPoolIds: string[] | undefined;
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

  slippagePercent: 1,
  setSlippagePercent: () => {
    throw Error("AppContextProvider not initialized");
  },

  featuredPoolIds: undefined,
  verifiedPoolIds: undefined,
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

  // Verified pools
  const verifiedPoolIds: string[] | undefined = useMemo(
    () => flags?.steammVerifiedPoolIds ?? [],
    [flags?.steammVerifiedPoolIds],
  );

  // Context
  const contextValue: AppContext = useMemo(
    () => ({
      steammClient,

      appData,
      refreshAppData,

      slippagePercent,
      setSlippagePercent,

      featuredPoolIds,
      verifiedPoolIds,
    }),
    [
      steammClient,
      appData,
      refreshAppData,
      slippagePercent,
      setSlippagePercent,
      featuredPoolIds,
      verifiedPoolIds,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
