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

import BigNumber from "bignumber.js";

import { API_URL } from "@suilend/sui-fe";
import { useWalletContext } from "@suilend/sui-fe-next";

export interface LeaderboardRowData {
  rank: number;
  address: string;
  totalPoints: BigNumber;
}

interface PointsContext {
  leaderboardRows: LeaderboardRowData[] | undefined;
  updatedAt: Date | undefined;
  addressRow: LeaderboardRowData | undefined;
}

const defaultContextValue: PointsContext = {
  leaderboardRows: undefined,
  updatedAt: undefined,
  addressRow: undefined,
};

const PointsContext = createContext<PointsContext>(defaultContextValue);

export const usePointsContext = () => useContext(PointsContext);

export function PointsContextProvider({ children }: PropsWithChildren) {
  const { address } = useWalletContext();

  // Obligations
  const [leaderboardRows, setLeaderboardRows] = useState<
    LeaderboardRowData[] | undefined
  >(undefined);
  const [updatedAt, setUpdatedAt] = useState<Date | undefined>(undefined);

  const fetchLeaderboardRows = useCallback(async () => {
    try {
      const url = `${API_URL}/points/leaderboard?season=2&lendingMarketId=0xc1888ec1b81a414e427a44829310508352aec38252ee0daa9f8b181b6947de9f`;
      const res = await fetch(url);
      const json = await res.json();

      setLeaderboardRows(
        json.rows.map((row: any) => ({
          rank: row.rank,
          address: row.address,
          totalPoints: new BigNumber(row.totalPoints),
        })),
      );
      setUpdatedAt(new Date(json.updatedAt * 1000));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const isDataBeingFetchedRef = useRef<boolean>(false);
  useEffect(() => {
    if (isDataBeingFetchedRef.current) return;
    isDataBeingFetchedRef.current = true;

    fetchLeaderboardRows();
  }, [fetchLeaderboardRows]);

  // Address row
  const addressRow = useMemo(() => {
    if (!address || leaderboardRows === undefined) return undefined;

    return (
      leaderboardRows.find((row) => row.address === address) ?? {
        rank: -1,
        address,
        totalPoints: new BigNumber(-1),
      }
    );
  }, [address, leaderboardRows]);

  // Context
  const contextValue: PointsContext = useMemo(
    () => ({
      leaderboardRows,
      updatedAt,
      addressRow,
    }),
    [leaderboardRows, updatedAt, addressRow],
  );

  return (
    <PointsContext.Provider value={contextValue}>
      {children}
    </PointsContext.Provider>
  );
}
