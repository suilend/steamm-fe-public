import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import BigNumber from "bignumber.js";
import { debounce } from "lodash";
import { Eraser, Search, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { ParsedPool, QUOTER_ID_NAME_MAP, QuoterId } from "@suilend/steamm-sdk";

import Dialog from "@/components/Dialog";
import Divider from "@/components/Divider";
import PoolsTable from "@/components/pools/PoolsTable";
import SelectPopover from "@/components/SelectPopover";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import { FEE_TIER_PERCENTS } from "@/lib/createPool";
import { formatFeeTier } from "@/lib/format";
import {
  getFilteredPoolGroups,
  getPoolGroups,
  getPoolsWithExtraData,
} from "@/lib/pools";
import { PoolGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SearchDialog() {
  const { appData, recentPoolIds } = useLoadedAppContext();
  const { poolStats } = useStatsContext();
  const router = useRouter();

  const { md } = useBreakpoint();

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA" ||
          (document.activeElement as HTMLElement).isContentEditable);

      if (
        (!isInputFocused && !(e.metaKey || e.ctrlKey) && e.key === "/") ||
        ((e.metaKey || e.ctrlKey) && e.key === "k")
      ) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close dialog when URL changes
  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false);
    };

    router.events.on("routeChangeStart", handleRouteChange);

    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [router]);

  // Pools
  const poolsWithExtraData: ParsedPool[] = useMemo(
    () =>
      getPoolsWithExtraData(
        {
          lstAprPercentMap: appData.lstAprPercentMap,
          pools: appData.pools,
          normalizedPoolRewardMap: appData.normalizedPoolRewardMap,
        },
        poolStats,
      ),
    [
      appData.lstAprPercentMap,
      appData.pools,
      appData.normalizedPoolRewardMap,
      poolStats,
    ],
  );

  const poolGroups: PoolGroup[] = useMemo(
    () => getPoolGroups(poolsWithExtraData),
    [poolsWithExtraData],
  );

  // Search
  // Input
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const [searchString, setSearchString] = useState<string>("");
  const [rawSearchString, setRawSearchString] = useState<string>("");

  const onSearchStringChange = useCallback((value: string) => {
    setSearchString(value);
  }, []);
  const debouncedOnSearchStringChangeRef = useRef(
    debounce(onSearchStringChange, 100),
  );

  const onRawSearchStringChange = useCallback(
    (value: string, isImmediate?: boolean) => {
      setRawSearchString(value);
      (searchString === "" || isImmediate
        ? onSearchStringChange
        : debouncedOnSearchStringChangeRef.current)(value);
    },
    [searchString, onSearchStringChange],
  );

  // Options
  const [feeTiers, setFeeTiers] = useState<number[]>([]);
  const onFeeTierChange = useCallback((value: number) => {
    setFeeTiers((prev) =>
      prev.includes(value)
        ? prev.filter((_value) => _value !== value)
        : [...prev, value],
    );
    inputRef.current?.focus();
  }, []);

  const [quoterIds, setQuoterIds] = useState<QuoterId[]>([]);
  const onQuoterIdChange = useCallback((value: QuoterId) => {
    setQuoterIds((prev) =>
      prev.includes(value)
        ? prev.filter((_value) => _value !== value)
        : [...prev, value],
    );
    inputRef.current?.focus();
  }, []);

  const feeTierOptions = useMemo(
    () =>
      FEE_TIER_PERCENTS.filter((feeTier) =>
        poolsWithExtraData.some((pool) => pool.feeTierPercent.eq(feeTier)),
      ).map((feeTier) => ({
        id: feeTier.toString(),
        name: formatFeeTier(new BigNumber(feeTier)),
        count: getFilteredPoolGroups(
          appData.coinMetadataMap,
          poolGroups,
          searchString,
          [feeTier],
          quoterIds,
        ).reduce((acc, poolGroup) => acc + poolGroup.pools.length, 0),
      })),
    [
      poolsWithExtraData,
      appData.coinMetadataMap,
      poolGroups,
      searchString,
      quoterIds,
    ],
  );

  const quoterIdOptions = useMemo(
    () =>
      Object.values(QuoterId)
        .filter((quoterId) =>
          poolsWithExtraData.some((pool) => pool.quoterId === quoterId),
        )
        .map((quoterId) => ({
          id: quoterId.toString(),
          name: QUOTER_ID_NAME_MAP[quoterId],
          count: getFilteredPoolGroups(
            appData.coinMetadataMap,
            poolGroups,
            searchString,
            feeTiers,
            [quoterId],
          ).reduce((acc, poolGroup) => acc + poolGroup.pools.length, 0),
        })),
    [
      poolsWithExtraData,
      appData.coinMetadataMap,
      poolGroups,
      searchString,
      feeTiers,
    ],
  );
  // Filter
  const filteredPoolGroups: PoolGroup[] = getFilteredPoolGroups(
    appData.coinMetadataMap,
    poolGroups,
    searchString,
    feeTiers,
    quoterIds,
  );
  const filteredPoolGroupsCount = filteredPoolGroups.reduce(
    (acc, poolGroup) => acc + poolGroup.pools.length,
    0,
  );

  const showSearchResults = !(
    rawSearchString === "" &&
    feeTiers.length === 0 &&
    quoterIds.length === 0
  );

  // Recent pools (flat)
  const recentPoolGroups = poolsWithExtraData
    .filter((pool) => recentPoolIds.includes(pool.id))
    .sort((a, b) =>
      recentPoolIds.indexOf(a.id) > recentPoolIds.indexOf(b.id) ? 1 : -1,
    ) // Sort by recent pool order
    .slice(0, 10) // Limit to 10
    .map((pool) => ({
      id: uuidv4(),
      coinTypes: pool.coinTypes,
      pools: [pool],
    }));

  // Popular pools (flat)
  const popularPoolGroups = poolsWithExtraData
    .sort((a, b) => +b.tvlUsd - +a.tvlUsd)
    .slice(0, 10) // Limit to 10
    .map((pool) => ({
      id: uuidv4(),
      coinTypes: pool.coinTypes,
      pools: [pool],
    }));

  return (
    <Dialog
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      trigger={
        md ? (
          <button className="group flex h-10 w-40 flex-row items-center justify-between rounded-md border pl-3 pr-2 focus-visible:outline focus-visible:outline-focus">
            <div className="flex flex-row items-center gap-2">
              <Search
                className={cn(
                  "h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground",
                )}
              />
              <p className="text-p2 text-secondary-foreground transition-colors group-hover:text-foreground">
                Search pools
              </p>
            </div>

            <div className="flex h-6 w-6 flex-row items-center justify-center rounded-sm bg-card">
              <p className="text-p2 text-secondary-foreground">/</p>
            </div>
          </button>
        ) : (
          <button className="group flex h-5 w-5 flex-row items-center justify-center">
            <Search className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
          </button>
        )
      }
      headerProps={{
        children: (
          <>
            <div className="flex w-full flex-col">
              <div className="relative flex h-16 w-full shrink-0 flex-row items-center">
                <Search className="absolute left-5 top-1/2 z-[3] h-5 w-5 -translate-y-1/2 text-secondary-foreground" />
                {showSearchResults && (
                  <button
                    className="group absolute top-1/2 z-[2] flex h-8 w-8 -translate-y-1/2 flex-row items-center justify-center"
                    onClick={() => {
                      onRawSearchStringChange("", true);
                      setFeeTiers([]);
                      setQuoterIds([]);
                      inputRef.current?.focus();
                    }}
                    style={{
                      right: (5 - (8 - 5) / 2) * 4,
                    }}
                  >
                    <X className="h-5 w-5 text-secondary-foreground transition-colors group-hover:text-foreground" />
                  </button>
                )}
                <input
                  ref={inputRef}
                  autoFocus
                  className={cn(
                    "relative z-[1] h-full w-full min-w-0 !border-0 !bg-[transparent] !text-h3 text-foreground !outline-0 placeholder:text-tertiary-foreground",
                    showSearchResults ? "pr-10" : "pr-5",
                  )}
                  type="text"
                  placeholder="Search pools"
                  value={rawSearchString}
                  onChange={(e) => onRawSearchStringChange(e.target.value)}
                  style={{
                    paddingLeft: (5 + 5 + 2.5) * 4,
                    paddingRight: (showSearchResults ? 2.5 + 5 + 5 : 5) * 4,
                  }}
                />
              </div>

              <div className="flex w-full flex-row flex-wrap items-center gap-2 px-5 pb-5">
                <SelectPopover
                  className="w-max"
                  align="start"
                  options={feeTierOptions}
                  placeholder="All fee tiers"
                  values={feeTiers.map((feeTier) => feeTier.toString())}
                  onChange={(id: string) => onFeeTierChange(+id)}
                  isMultiSelect
                />

                <SelectPopover
                  className="w-max"
                  align="start"
                  options={quoterIdOptions}
                  placeholder="All quoter types"
                  values={quoterIds}
                  onChange={(id: string) => onQuoterIdChange(id as QuoterId)}
                  isMultiSelect
                />
              </div>
            </div>
            <Divider />
          </>
        ),
      }}
      drawerContentProps={{ className: "h-dvh" }}
      dialogContentInnerClassName="max-w-4xl h-[800px]"
      dialogContentInnerChildrenWrapperClassName="pt-5 flex-1"
    >
      {/* Search results */}
      <div
        className={cn(
          !showSearchResults ? "hidden" : "flex min-h-0 flex-1 flex-col gap-4",
        )}
      >
        <h2 className="text-p1 text-secondary-foreground">
          {filteredPoolGroupsCount > 0 ? (
            <>
              {filteredPoolGroupsCount} result
              {filteredPoolGroupsCount !== 1 && "s"}
            </>
          ) : (
            `No results for "${searchString}"`
          )}
        </h2>
        <div
          className={cn(
            "flex min-h-0 w-full flex-1 flex-row items-stretch overflow-hidden",
            filteredPoolGroupsCount === 0 && "hidden",
          )}
        >
          <PoolsTable
            className="flex flex-col"
            containerClassName="flex-1"
            tableContainerClassName="h-full"
            tableId="search-pools"
            poolGroups={filteredPoolGroups}
            searchString={searchString}
            pageSize={10}
          />
        </div>
      </div>

      {/* Recent and popular pools */}
      <div
        className={cn(
          showSearchResults ? "hidden" : "flex min-h-0 flex-1 flex-col gap-4",
        )}
      >
        {recentPoolGroups.length > 0 && (
          <>
            <h2 className="text-p1 text-secondary-foreground">Recent pools</h2>
            <div className="flex min-h-0 w-full flex-1 flex-row items-stretch overflow-hidden">
              <PoolsTable
                className="flex flex-col"
                containerClassName="flex-1"
                tableContainerClassName="h-full"
                tableId="recent-pools"
                poolGroups={recentPoolGroups}
                isFlat
                noDefaultSort
                disableSorting
                pageSize={10}
              />
            </div>
          </>
        )}

        <h2 className="text-p1 text-secondary-foreground">Popular pools</h2>
        <div className="flex min-h-0 w-full flex-1 flex-row items-stretch overflow-hidden">
          <PoolsTable
            className="flex flex-col"
            containerClassName="flex-1"
            tableContainerClassName="h-full"
            tableId="popular-pools"
            poolGroups={popularPoolGroups}
            isFlat
            disableSorting
            pageSize={10}
          />
        </div>
      </div>
    </Dialog>
  );
}
