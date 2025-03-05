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
import {
  ParsedLendingMarket,
  ParsedReserve,
  SuilendClient,
} from "@suilend/sdk";
import { Reserve } from "@suilend/sdk/_generated/suilend/reserve/structs";
import { BETA_CONFIG, MAINNET_CONFIG, SteammSDK } from "@suilend/steamm-sdk";

import useFetchAppData from "@/fetchers/useFetchAppData";
import useFetchLstData from "@/fetchers/useFetchLstData";
import { ParsedBank, ParsedPool } from "@/lib/types";

export interface AppData {
  lm: {
    suilendClient: SuilendClient;

    lendingMarket: ParsedLendingMarket;

    refreshedRawReserves: Reserve<string>[];
    reserveMap: Record<string, ParsedReserve>;

    rewardPriceMap: Record<string, BigNumber | undefined>;
    rewardCoinMetadataMap: Record<string, CoinMetadata>;
  };

  coinMetadataMap: Record<string, CoinMetadata>;
  bTokenTypeCoinTypeMap: Record<string, string>;

  banks: ParsedBank[];
  bankMap: Record<string, ParsedBank>;
  bankCoinTypes: string[];

  pools: ParsedPool[];
  poolCoinTypes: string[];

  featuredCoinTypePairs: [string, string][];
}
export interface LstData {
  lstCoinTypes: string[];
  aprPercentMap: Record<string, BigNumber>;
}

interface AppContext {
  steammClient: SteammSDK | undefined;
  appData: AppData | undefined;
  refreshAppData: () => Promise<void>;

  lstData: LstData | undefined;

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
  refreshAppData: async () => {
    throw Error("AppContextProvider not initialized");
  },

  lstData: undefined,

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

  // LST (non-blocking)
  const { data: lstData } = useFetchLstData();

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
      refreshAppData,

      lstData,

      slippagePercent,
      setSlippagePercent,
    }),
    [
      steammClient,
      appData,
      refreshAppData,
      lstData,
      slippagePercent,
      setSlippagePercent,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
