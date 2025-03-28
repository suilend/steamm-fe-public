import Head from "next/head";
import { useRouter } from "next/router";

import { shallowPushQuery } from "@suilend/frontend-sui-next";

import BanksTab from "@/components/admin/banks/BanksTab";
import OraclesTab from "@/components/admin/oracles/OraclesTab";
import PoolsTab from "@/components/admin/pools/PoolsTab";
import { cn } from "@/lib/utils";

enum Tab {
  POOLS = "pools",
  BANKS = "banks",
  ORACLES = "oracles",
}

const tabNameMap: Record<Tab, string> = {
  [Tab.POOLS]: "Pools",
  [Tab.BANKS]: "Banks",
  [Tab.ORACLES]: "Oracles",
};

enum QueryParams {
  TAB = "tab",
}

export default function AdminPage() {
  const router = useRouter();
  const queryParams = {
    [QueryParams.TAB]: router.query[QueryParams.TAB] as Tab | undefined,
  };

  // Tabs
  const selectedTab =
    queryParams[QueryParams.TAB] &&
    Object.values(Tab).includes(queryParams[QueryParams.TAB])
      ? queryParams[QueryParams.TAB]
      : Tab.POOLS;
  const onSelectedTabChange = (tab: Tab) => {
    shallowPushQuery(router, { ...router.query, [QueryParams.TAB]: tab });
  };

  return (
    <>
      <Head>
        <title>STEAMM | Admin</title>
      </Head>

      <div className="flex w-full max-w-[800px] flex-col items-center gap-4">
        {/* Tabs */}
        <div className="flex flex-row">
          {Object.values(Tab).map((tab) => {
            return (
              <button
                key={tab}
                className={cn(
                  "group relative flex h-8 flex-row px-2 transition-colors",
                  tab === selectedTab ? "cursor-default" : "",
                )}
                onClick={() => onSelectedTabChange(tab)}
              >
                <p
                  className={cn(
                    "!text-p2 transition-colors",
                    tab === selectedTab
                      ? "text-foreground"
                      : "text-secondary-foreground group-hover:text-foreground",
                  )}
                >
                  {tabNameMap[tab]}
                </p>
                <div
                  className={cn(
                    "absolute inset-x-0 top-full h-[2px] transition-all",
                    tab === selectedTab
                      ? "bg-foreground"
                      : "bg-border group-hover:bg-foreground",
                  )}
                />
              </button>
            );
          })}
        </div>

        {selectedTab === Tab.POOLS && <PoolsTab />}
        {selectedTab === Tab.BANKS && <BanksTab />}
        {selectedTab === Tab.ORACLES && <OraclesTab />}
      </div>
    </>
  );
}
