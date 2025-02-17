import { PropsWithChildren, createContext, useContext, useMemo } from "react";

import BigNumber from "bignumber.js";

import useFetchStatsData from "@/fetchers/useFetchStatsData";
import { ChartData } from "@/lib/chart";

export interface StatsData {
  poolHistoricalTvlUsd_24h_map: Record<string, ChartData[]>;

  poolVolumeUsd_24h_map: Record<string, BigNumber>;
  poolHistoricalVolumeUsd_24h_map: Record<string, ChartData[]>;

  poolFeesUsd_24h_map: Record<string, BigNumber>;
  poolHistoricalFeesUsd_24h_map: Record<string, ChartData[]>;

  poolApr_24h_map: Record<string, BigNumber>;
  poolHistoricalApr_24h_map: Record<string, ChartData[]>;
}

interface StatsContext {
  statsData: StatsData | undefined;
}

const StatsContext = createContext<StatsContext>({
  statsData: undefined,
});

export const useStatsContext = () => useContext(StatsContext);

export function StatsContextProvider({ children }: PropsWithChildren) {
  // Stats data
  const { data: statsData, mutateData: mutateStatsData } = useFetchStatsData();

  // Context
  const contextValue: StatsContext = useMemo(
    () => ({
      statsData,
    }),
    [statsData],
  );

  return (
    <StatsContext.Provider value={contextValue}>
      {children}
    </StatsContext.Provider>
  );
}
