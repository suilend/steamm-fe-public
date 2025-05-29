import Head from "next/head";

import { useWalletContext } from "@suilend/sui-fe-next";

import PointsHeader from "@/components/points/PointsHeader";
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

      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex w-full flex-col items-center gap-6">
          <PointsHeader />
        </div>

        {address && (
          <div className="flex w-full max-w-[960px] flex-col gap-6">
            <h2 className="text-h3 text-foreground">Your position</h2>

            <PointsLeaderboardTable
              tableId="address"
              rows={addressRow !== undefined ? [addressRow] : undefined}
              skeletonRows={1}
              disableSorting
            />
          </div>
        )}

        <div className="flex w-full max-w-[960px] flex-col gap-6">
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
