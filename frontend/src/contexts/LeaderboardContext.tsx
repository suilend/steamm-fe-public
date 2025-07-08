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

export interface PointsLeaderboardRowData {
  rank: number;
  address: string;
  totalPoints: BigNumber;
}

interface LeaderboardContext {
  points: {
    leaderboardRows: PointsLeaderboardRowData[] | undefined;
    updatedAt: Date | undefined;
    addressRow: PointsLeaderboardRowData | undefined;
    fetchLeaderboardRows: () => void;
  };
}

const defaultContextValue: LeaderboardContext = {
  points: {
    leaderboardRows: undefined,
    updatedAt: undefined,
    addressRow: undefined,
    fetchLeaderboardRows: async () => {
      throw Error("LeaderboardContextProvider not initialized");
    },
  },
};

const LeaderboardContext =
  createContext<LeaderboardContext>(defaultContextValue);

export const useLeaderboardContext = () => useContext(LeaderboardContext);

export function LeaderboardContextProvider({ children }: PropsWithChildren) {
  const { address } = useWalletContext();

  // Data
  const [pointsLeaderboardRows, setPointsLeaderboardRows] = useState<
    LeaderboardContext["points"]["leaderboardRows"]
  >(defaultContextValue["points"]["leaderboardRows"]);
  const [pointsUpdatedAt, setPointsUpdatedAt] = useState<
    LeaderboardContext["points"]["updatedAt"]
  >(defaultContextValue["points"]["updatedAt"]);

  // Data - fetch
  const dataBeingFetchedRef = useRef<"points"[]>([]);

  const fetchPointsLeaderboardRows = useCallback(async () => {
    if (dataBeingFetchedRef.current.includes("points")) return;
    dataBeingFetchedRef.current.push("points");

    try {
      const url = `${API_URL}/points/leaderboard?season=2&lendingMarketId=0xc1888ec1b81a414e427a44829310508352aec38252ee0daa9f8b181b6947de9f`;
      const res = await fetch(url);
      const json = await res.json();

      setPointsLeaderboardRows(
        json.rows.map((row: any) => ({
          rank: row.rank,
          address: row.address,
          totalPoints: new BigNumber(row.totalPoints),
        })),
      );
      setPointsUpdatedAt(new Date(json.updatedAt * 1000));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPointsLeaderboardRows();
  }, [fetchPointsLeaderboardRows]);

  // Address row
  const [pointsAddressRow, setPointsAddressRow] = useState<
    LeaderboardContext["points"]["addressRow"]
  >(defaultContextValue["points"]["addressRow"]);

  useEffect(() => {
    if (!address || pointsLeaderboardRows === undefined) {
      setPointsAddressRow(undefined);
    } else {
      setPointsAddressRow(
        pointsLeaderboardRows.find((row) => row.address === address) ?? {
          rank: -1,
          address,
          totalPoints: new BigNumber(-1),
        },
      );
    }
  }, [address, pointsLeaderboardRows]);

  // Context
  const contextValue: LeaderboardContext = useMemo(
    () => ({
      points: {
        leaderboardRows: pointsLeaderboardRows,
        updatedAt: pointsUpdatedAt,
        addressRow: pointsAddressRow,
        fetchLeaderboardRows: fetchPointsLeaderboardRows,
      },
    }),
    [
      pointsLeaderboardRows,
      pointsUpdatedAt,
      pointsAddressRow,
      fetchPointsLeaderboardRows,
    ],
  );

  return (
    <LeaderboardContext.Provider value={contextValue}>
      {children}
    </LeaderboardContext.Provider>
  );
}
