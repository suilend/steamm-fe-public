import Head from "next/head";
import { useEffect } from "react";

import { useWalletContext } from "@suilend/sui-fe-next";

import PointsHeader from "@/components/points/PointsHeader";
import PointsLeaderboardTable from "@/components/points/PointsLeaderboardTable";
import {
  LeaderboardContextProvider,
  useLeaderboardContext,
} from "@/contexts/LeaderboardContext";

function Page() {
  const { address } = useWalletContext();
  const { points } = useLeaderboardContext();

  useEffect(() => {
    points.fetchLeaderboardRows();
  }, [points]);

  return (
    <>
      <Head>
        <title>STEAMM | Leaderboard</title>
      </Head>

      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex w-full flex-col items-center gap-6">
          <PointsHeader />
        </div>

        {address && (
          <div className="flex w-full max-w-[960px] flex-col gap-6">
            <h2 className="text-h3 text-foreground">Your position</h2>

            <PointsLeaderboardTable
              tableId="address"
              rows={
                points.addressRow !== undefined
                  ? [points.addressRow]
                  : undefined
              }
              skeletonRows={1}
              disableSorting
            />
          </div>
        )}

        <div className="flex w-full max-w-[960px] flex-col gap-6">
          <h2 className="text-h3 text-foreground">Leaderboard</h2>

          <PointsLeaderboardTable
            tableId="leaderboard"
            rows={points.leaderboardRows}
          />
        </div>
      </div>
    </>
  );
}

export default function Leaderboard() {
  return (
    <LeaderboardContextProvider>
      <Page />
    </LeaderboardContextProvider>
  );
}
