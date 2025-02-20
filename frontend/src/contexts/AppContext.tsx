import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { KioskItem } from "@mysten/kiosk";
import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";
import { useFlags } from "launchdarkly-react-client-sdk";
import { useLocalStorage } from "usehooks-ts";

import {
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import useFetchBalances from "@suilend/frontend-sui-next/fetchers/useFetchBalances";
import useCoinMetadataMap from "@suilend/frontend-sui-next/hooks/useCoinMetadataMap";
import useRefreshOnBalancesChange from "@suilend/frontend-sui-next/hooks/useRefreshOnBalancesChange";
import { BETA_CONFIG, MAINNET_CONFIG, SteammSDK } from "@suilend/steamm-sdk";

import useFetchAppData from "@/fetchers/useFetchAppData";
import useFetchOwnedKiosks from "@/fetchers/useFetchOwnedKiosks";
import { ParsedBank, ParsedPool } from "@/lib/types";

export interface AppData {
  coinMetadataMap: Record<string, CoinMetadata>;
  bTokenTypeCoinTypeMap: Record<string, string>;
  lendingMarketIdTypeMap: Record<string, string>;

  banks: ParsedBank[];
  bankMap: Record<string, ParsedBank>;
  bankCoinTypes: string[];

  pools: ParsedPool[];
  poolCoinTypes: string[];

  featuredCoinTypePairs: [string, string][];
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

  hasRootlets: boolean;
  isWhitelisted: boolean;
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

  hasRootlets: false,
  isWhitelisted: false,
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

  // Rootlets
  const ROOTLETS_TYPE =
    "0x8f74a7d632191e29956df3843404f22d27bd84d92cca1b1abde621d033098769::rootlet::Rootlet";

  const { data: ownedKiosks, mutateData: mutateOwnedKiosks } =
    useFetchOwnedKiosks();

  const hasRootlets = useMemo(
    () =>
      (ownedKiosks ?? []).reduce(
        (acc, { kiosk }) => [
          ...acc,
          ...kiosk.items.filter((item) => item.type === ROOTLETS_TYPE),
        ],
        [] as KioskItem[],
      ).length > 0,
    [ownedKiosks],
  );

  const flags = useFlags();
  const isWhitelisted = useMemo(
    () => !!address && (flags?.steammBetaWhitelist ?? []).includes(address),
    [address, flags?.steammBetaWhitelist],
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

      hasRootlets,
      isWhitelisted,
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
      hasRootlets,
      isWhitelisted,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
