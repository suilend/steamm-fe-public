import Head from "next/head";

import BigNumber from "bignumber.js";

import BarChartStat from "@/components/BarChartStat";
import Divider from "@/components/Divider";
import PoolsTable from "@/components/PoolsTable";
import Tag from "@/components/Tag";
import { useLoadedAppContext } from "@/contexts/AppContext";

export default function Pools() {
  const { appData } = useLoadedAppContext();

  return (
    <>
      <Head>
        <title>STEAMM | Pools</title>
      </Head>

      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <h1 className="text-h1 text-foreground">Pools</h1>

          {/* Stats */}
          <div className="flex w-full flex-col rounded-md border md:flex-row md:items-stretch">
            {/* TVL */}
            <div className="flex-1">
              <div className="w-full p-5">
                <BarChartStat
                  title="TVL"
                  periodDays={30}
                  periodChangePercent={new BigNumber(-4.92)}
                  data={appData.tvlData}
                />
              </div>
            </div>

            <Divider className="md:h-auto md:w-px" />

            {/* Volume */}
            <div className="flex-1">
              <div className="w-full p-5">
                <BarChartStat
                  title="Volume"
                  periodDays={1}
                  periodChangePercent={new BigNumber(2.51)}
                  data={appData.volumeData}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Featured pools */}
        <div className="flex w-full flex-col gap-6">
          <h2 className="text-h3 text-foreground">Featured pools</h2>
        </div>

        {/* All pools */}
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-row items-center gap-3">
            <h2 className="text-h3 text-foreground">All pools</h2>
            <Tag>
              {appData.poolGroups.reduce(
                (acc, poolGroup) => acc + poolGroup.pools.length,
                0,
              )}
            </Tag>
          </div>

          <PoolsTable poolGroups={appData.poolGroups} />
        </div>
      </div>
    </>
  );
}
