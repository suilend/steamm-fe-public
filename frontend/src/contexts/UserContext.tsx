import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CoinMetadata, SuiTransactionBlockResponse } from "@mysten/sui/jsonRpc";
import { normalizeStructTag } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";

import { ParsedObligation, RewardMap } from "@suilend/sdk";
import { ObligationOwnerCap } from "@suilend/sdk/_generated/suilend/lending-market/structs";
import { NORMALIZED_SUI_COINTYPE } from "@suilend/sui-fe";
import { useSettingsContext, useWalletContext } from "@suilend/sui-fe-next";
import useFetchBalances from "@suilend/sui-fe-next/fetchers/useFetchBalances";
import useCoinMetadataMap from "@suilend/sui-fe-next/hooks/useCoinMetadataMap";
import useRefreshOnBalancesChange from "@suilend/sui-fe-next/hooks/useRefreshOnBalancesChange";

import { useAppContext } from "@/contexts/AppContext";
import useFetchUserData from "@/fetchers/useFetchUserData";

export interface UserData {
  obligationOwnerCaps: ObligationOwnerCap<string>[];
  obligations: ParsedObligation[];

  rewardMap: RewardMap;
  poolRewardMap: Record<string, Record<string, BigNumber>>;
}

interface UserContext {
  rawBalancesMap: Record<string, BigNumber> | undefined;
  refreshRawBalancesMap: () => Promise<void>;
  balancesCoinMetadataMap: Record<string, CoinMetadata> | undefined;
  getBalance: (coinType: string) => BigNumber;

  userData: UserData | undefined; // Depends on appData
  refreshUserData: () => Promise<void>;

  refresh: () => void; // Refreshes appData, balances, and userData

  virtualWalletLpTokenTransferTransactions:
    | SuiTransactionBlockResponse[]
    | undefined;
}

const UserContext = createContext<UserContext>({
  rawBalancesMap: undefined,
  refreshRawBalancesMap: async () => {
    throw Error("UserContextProvider not initialized");
  },
  balancesCoinMetadataMap: undefined,
  getBalance: () => {
    throw Error("UserContextProvider not initialized");
  },

  userData: undefined,
  refreshUserData: async () => {
    throw Error("UserContextProvider not initialized");
  },

  refresh: () => {
    throw Error("UserContextProvider not initialized");
  },

  virtualWalletLpTokenTransferTransactions: undefined,
});

export const useUserContext = () => useContext(UserContext);

export function UserContextProvider({ children }: PropsWithChildren) {
  const { suiClient } = useSettingsContext();
  const { address } = useWalletContext();
  const { refreshAppData } = useAppContext();

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

  // User data (non-blocking)
  const { data: userData, mutateData: mutateUserData } = useFetchUserData();

  // Refresh
  const refreshUserData = useCallback(async () => {
    await mutateUserData();
  }, [mutateUserData]);

  const refresh = useCallback(() => {
    (async () => {
      await refreshAppData();
      await refreshUserData();
    })();
    refreshRawBalancesMap();
  }, [refreshAppData, refreshUserData, refreshRawBalancesMap]);

  useRefreshOnBalancesChange(refresh as () => Promise<void>);

  // Virtual wallet LP token transfer transactions
  const [
    virtualWalletLpTokenTransferTransactionsMap,
    setVirtualWalletLpTokenTransferTransactionsMap,
  ] = useState<Record<string, SuiTransactionBlockResponse[]>>({});
  const virtualWalletLpTokenTransferTransactions:
    | SuiTransactionBlockResponse[]
    | undefined = useMemo(
    () =>
      !address ? [] : virtualWalletLpTokenTransferTransactionsMap[address],
    [address, virtualWalletLpTokenTransferTransactionsMap],
  );

  const hasFetchedVirtualWalletLpTokenTransferTransactionsMapRef = useRef<
    Record<string, boolean>
  >({});
  const fetchVirtualWalletLpTokenTransferTransactions =
    useCallback(async () => {
      if (!address) return;

      try {
        const allFilteredTransactionBlocks: SuiTransactionBlockResponse[] = [];

        let cursor = null;
        let hasNextPage = true;
        while (hasNextPage) {
          const transactionBlocks = await suiClient.queryTransactionBlocks({
            cursor,
            order: "descending",
            filter: {
              ToAddress: address,
            },
            options: {
              showBalanceChanges: true,
            },
          });

          const filteredTransactionBlocks = transactionBlocks.data.filter(
            (txb) => {
              const balanceChanges = txb.balanceChanges ?? [];
              if (balanceChanges.length !== 4) return false; // 2x SUI, 2x LP token

              const balanceChangesCoinTypes = Array.from(
                new Set(
                  balanceChanges.map((bc) => normalizeStructTag(bc.coinType)),
                ),
              );
              if (balanceChangesCoinTypes.length !== 2) return false; // Must be SUI and the LP token
              if (!balanceChangesCoinTypes.includes(NORMALIZED_SUI_COINTYPE))
                return false; // Must include SUI

              const lpTokenType = balanceChangesCoinTypes.find(
                (coinType) =>
                  coinType !== NORMALIZED_SUI_COINTYPE &&
                  coinType.includes("::STEAMM_LP_"),
              );
              if (!lpTokenType) return false; // Must include the LP token

              const balanceChange1 = balanceChanges.find(
                (bc) =>
                  normalizeStructTag(bc.coinType) === lpTokenType &&
                  (bc.owner as any).AddressOwner === address &&
                  +bc.amount > 0,
              );
              const balanceChange2 = balanceChanges.find(
                (bc) =>
                  normalizeStructTag(bc.coinType) === lpTokenType &&
                  (bc.owner as any).AddressOwner !== address &&
                  +bc.amount < 0,
              );
              if (!balanceChange1 || !balanceChange2) return false;
              if (+balanceChange1.amount !== -1 * +balanceChange2.amount)
                return false; // Amounts must be equal and opposite (it's a transfer)

              return true;
            },
          );

          allFilteredTransactionBlocks.push(...filteredTransactionBlocks);
          cursor = transactionBlocks.nextCursor;
          hasNextPage = transactionBlocks.hasNextPage;
        }

        // console.log(
        //   "XXX allFilteredTransactionBlocks:",
        //   allFilteredTransactionBlocks,
        // );
        setVirtualWalletLpTokenTransferTransactionsMap((prev) => ({
          ...prev,
          [address]: allFilteredTransactionBlocks,
        }));
      } catch (err) {
        // Fail silently
        console.error(err);
      }
    }, [address, suiClient]);

  useEffect(() => {
    if (!address) return;

    if (
      hasFetchedVirtualWalletLpTokenTransferTransactionsMapRef.current[address]
    )
      return;
    hasFetchedVirtualWalletLpTokenTransferTransactionsMapRef.current[address] =
      true;

    fetchVirtualWalletLpTokenTransferTransactions();
  }, [address, fetchVirtualWalletLpTokenTransferTransactions]);

  // Context
  const contextValue = useMemo(
    () => ({
      rawBalancesMap,
      refreshRawBalancesMap,
      balancesCoinMetadataMap,
      getBalance,

      userData,
      refreshUserData,

      refresh,

      virtualWalletLpTokenTransferTransactions,
    }),
    [
      rawBalancesMap,
      refreshRawBalancesMap,
      balancesCoinMetadataMap,
      getBalance,
      userData,
      refreshUserData,
      refresh,
      virtualWalletLpTokenTransferTransactions,
    ],
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}
