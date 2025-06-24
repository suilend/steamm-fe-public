import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { shallowPushQuery } from "@suilend/sui-fe-next";

import LaunchTokenCard from "@/components/launch/LaunchTokenCard";
import CreatePoolCard from "@/components/pools/CreatePoolCard";
import { cn } from "@/lib/utils";

enum Tab {
  TOKEN = "token",
  POOL = "pool",
}

enum QueryParams {
  TAB = "tab",
}

const tabNameMap: Record<Tab, string> = {
  [Tab.TOKEN]: "Create token",
  [Tab.POOL]: "Create pool",
};

export default function CreatePage() {
  const router = useRouter();
  const queryParams = useMemo(
    () => ({
      [QueryParams.TAB]: router.query[QueryParams.TAB] as Tab | undefined,
    }),
    [router.query],
  );

  // Tabs
  const selectedTab =
    queryParams[QueryParams.TAB] &&
    Object.values(Tab).includes(queryParams[QueryParams.TAB])
      ? queryParams[QueryParams.TAB]
      : Tab.TOKEN;
  const onSelectedTabChange = (tab: Tab) => {
    shallowPushQuery(router, { ...router.query, [QueryParams.TAB]: tab });
  };

  return (
    <>
      <Head>
        <title>STEAMM | Create</title>
      </Head>

      <div className="flex w-full max-w-md flex-col gap-8">
        {/* Tabs */}
        <div className="flex w-full flex-row rounded-full bg-border/25">
          {Object.values(Tab).map((tab) => (
            <button
              key={tab}
              className={cn(
                "group flex h-10 flex-1 flex-row items-center justify-center rounded-full border border-[transparent] px-3 transition-colors",
                tab === selectedTab && "border-button-1 bg-button-1/25",
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
            </button>
          ))}
        </div>

        {selectedTab === Tab.TOKEN && <LaunchTokenCard />}
        {selectedTab === Tab.POOL && <CreatePoolCard />}
      </div>
    </>
  );
}
