import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { shallowPushQuery } from "@suilend/sui-fe-next";

import CreatePoolCard from "@/components/create/CreatePoolCard";
import CreateTokenAndPoolCard from "@/components/create/CreateTokenAndPoolCard";
import { cn } from "@/lib/utils";

enum Tab {
  TOKEN = "token",
  POOL = "pool",
}
enum TokenTab {
  TOKEN_AND_POOL = "tokenAndPool",
  TOKEN = "token",
}

enum QueryParams {
  TAB = "tab",
  TOKEN_TAB = "tokenTab",
}

const tabNameMap: Record<Tab, string> = {
  [Tab.TOKEN]: "Create token",
  [Tab.POOL]: "Create pool",
};
const tokenTabNameMap: Record<TokenTab, string> = {
  [TokenTab.TOKEN_AND_POOL]: "Token & pool",
  [TokenTab.TOKEN]: "Token only",
};

export default function CreatePage() {
  const router = useRouter();
  const queryParams = useMemo(
    () => ({
      [QueryParams.TAB]: router.query[QueryParams.TAB] as Tab | undefined,
      [QueryParams.TOKEN_TAB]: router.query[QueryParams.TOKEN_TAB] as
        | TokenTab
        | undefined,
    }),
    [router.query],
  );

  // Tabs
  const selectedTab =
    queryParams[QueryParams.TAB] &&
    Object.values(Tab).includes(queryParams[QueryParams.TAB])
      ? queryParams[QueryParams.TAB]
      : Tab.TOKEN;
  const selectedTokenTab =
    queryParams[QueryParams.TOKEN_TAB] &&
    Object.values(TokenTab).includes(queryParams[QueryParams.TOKEN_TAB])
      ? queryParams[QueryParams.TOKEN_TAB]
      : TokenTab.TOKEN_AND_POOL;

  const onSelectedTabChange = (tab: Tab) => {
    const { [QueryParams.TOKEN_TAB]: _, ...restQuery } = router.query;
    shallowPushQuery(router, {
      ...restQuery,
      [QueryParams.TAB]: tab,
    });
  };
  const onSelectedTokenTabChange = (tokenTab: TokenTab) => {
    shallowPushQuery(router, {
      ...router.query,
      [QueryParams.TOKEN_TAB]: tokenTab,
    });
  };

  return (
    <>
      <Head>
        <title>STEAMM | Create</title>
      </Head>

      <div className="flex w-full max-w-md flex-col gap-8">
        {/* Tabs */}
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full flex-row rounded-full bg-card/75">
            {[Tab.TOKEN, Tab.POOL].map((tab) => (
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
          {selectedTab === Tab.TOKEN && (
            <div className="flex w-max flex-row rounded-full bg-card/75">
              {Object.values(TokenTab).map((tab) => (
                <button
                  key={tab}
                  className={cn(
                    "group flex h-8 flex-1 flex-row items-center justify-center rounded-full border border-[transparent] px-3 transition-colors",
                    tab === selectedTokenTab &&
                      "border-button-1 bg-button-1/25",
                  )}
                  onClick={() => onSelectedTokenTabChange(tab)}
                >
                  <p
                    className={cn(
                      "w-max !text-p3 transition-colors",
                      tab === selectedTokenTab
                        ? "text-foreground"
                        : "text-secondary-foreground group-hover:text-foreground",
                    )}
                  >
                    {tokenTabNameMap[tab]}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedTab === Tab.TOKEN && (
          <CreateTokenAndPoolCard
            isTokenOnly={selectedTokenTab === TokenTab.TOKEN}
          />
        )}
        {selectedTab === Tab.POOL && <CreatePoolCard />}
      </div>
    </>
  );
}
