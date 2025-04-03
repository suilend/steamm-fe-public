import Head from "next/head";

import { useWalletContext } from "@suilend/frontend-sui-next";

import PointsLeaderboardTable from "@/components/points/PointsLeaderboardTable";
import { usePointsContext } from "@/contexts/PointsContext";

export default function Points() {
  const { address } = useWalletContext();
  const { leaderboardRows, addressRow } = usePointsContext();

  return (
    <>
      <Head>
        <title>STEAMM | Points</title>
      </Head>

      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <h1 className="text-h1 text-foreground">Points</h1>
        </div>

        {address && (
          <div className="flex w-full flex-col gap-6">
            <h2 className="text-h3 text-foreground">Your position</h2>

            <PointsLeaderboardTable
              tableId="address"
              rows={addressRow !== undefined ? [addressRow] : undefined}
              skeletonRows={1}
              disableSorting
            />
          </div>
        )}

        <div className="flex w-full flex-col gap-6">
          <h2 className="text-h3 text-foreground">Leaderboard</h2>

          <PointsLeaderboardTable
            tableId="leaderboard"
            rows={leaderboardRows}
          />
        </div>
      </div>
    </>
  );
}
