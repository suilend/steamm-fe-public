import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import BigNumber from "bignumber.js";
import { debounce } from "lodash";
import { Search, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { ParsedPool, QUOTER_ID_NAME_MAP, QuoterId } from "@suilend/steamm-sdk";

import Dialog from "@/components/Dialog";
import Divider from "@/components/Divider";
import PoolsTable from "@/components/pools/PoolsTable";
import SelectPopover from "@/components/SelectPopover";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useStatsContext } from "@/contexts/StatsContext";
import { FEE_TIER_PERCENTS } from "@/lib/createPool";
import { formatFeeTier } from "@/lib/format";
import {
  getFilteredPoolGroups,
  getPoolGroups,
  getPoolsWithExtraData,
} from "@/lib/pools";
import { SelectPopoverOption } from "@/lib/select";
import { PoolGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SearchDialog() {
  const { appData, recentPoolIds } = useLoadedAppContext();
  const { poolStats } = useStatsContext();
  const router = useRouter();

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
      appData === undefined
        ? []
        : getPoolsWithExtraData(
            {
              lstAprPercentMap: appData.lstAprPercentMap,
              pools: appData.pools,
              normalizedPoolRewardMap: appData.normalizedPoolRewardMap,
            },
            poolStats,
          ),
    [appData, poolStats],
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
  }, []);

  const [quoterIds, setQuoterIds] = useState<QuoterId[]>([]);
  const onQuoterIdChange = useCallback((value: QuoterId) => {
    setQuoterIds((prev) =>
      prev.includes(value)
        ? prev.filter((_value) => _value !== value)
        : [...prev, value],
    );
  }, []);

  const feeTierOptions: SelectPopoverOption[] = useMemo(
    () =>
      appData === undefined
        ? []
        : FEE_TIER_PERCENTS.filter((feeTier) =>
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
    [appData, poolsWithExtraData, poolGroups, searchString, quoterIds],
  );

  const quoterIdOptions: SelectPopoverOption[] = useMemo(
    () =>
      appData === undefined
        ? []
        : Object.values(QuoterId)
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
    [appData, poolsWithExtraData, poolGroups, searchString, feeTiers],
  );
  // Filter
  const filteredPoolGroups: PoolGroup[] =
    appData === undefined
      ? []
      : getFilteredPoolGroups(
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
        <button
          className={cn(
            "group flex h-5 w-5 flex-row items-center justify-center transition-colors",
            "md:h-10 md:w-full md:max-w-96 md:justify-between md:rounded-md md:border md:pl-3 md:pr-2 md:hover:bg-border/50 md:focus-visible:outline md:focus-visible:outline-focus",
          )}
        >
          <div className="flex flex-row items-center gap-2">
            <Search className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
            <p className="text-p2 text-secondary-foreground transition-colors group-hover:text-foreground max-md:hidden">
              Search pools
            </p>
          </div>

          <div className="flex h-6 w-6 flex-row items-center justify-center rounded-sm border max-md:hidden">
            <p className="text-p2 text-secondary-foreground transition-colors group-hover:text-foreground">
              /
            </p>
          </div>
        </button>
      }
      headerProps={{
        children: (
          <>
            <div className="flex w-full flex-col">
              {/* Top */}
              <div className="flex w-full flex-row items-center gap-4">
                {/* Input */}
                <div className="relative h-16 flex-1">
                  <Search className="pointer-events-none absolute left-5 top-1/2 z-[2] h-5 w-5 -translate-y-1/2 text-secondary-foreground" />
                  <input
                    ref={inputRef}
                    autoFocus
                    className={cn(
                      "relative z-[1] h-full w-full min-w-0 !border-0 !bg-[transparent] !text-h3 text-foreground !shadow-none !outline-none placeholder:text-tertiary-foreground",
                      rawSearchString !== "" ? "pr-10" : "pr-5",
                    )}
                    type="text"
                    placeholder="Search pools"
                    value={rawSearchString}
                    onChange={(e) => onRawSearchStringChange(e.target.value)}
                    style={{
                      paddingLeft: (5 + 5 + 2.5) * 4,
                      paddingRight:
                        (rawSearchString !== "" ? 2.5 + 5 + 5 : 5) * 4,
                    }}
                  />
                </div>

                {/* Close button */}
                <div className="h-5 shrink-0 pr-5">
                  <DialogPrimitive.Close asChild>
                    <button className="group">
                      <X className="h-5 w-5 text-secondary-foreground transition-colors group-hover:text-foreground" />
                    </button>
                  </DialogPrimitive.Close>
                </div>
              </div>

              {/* Bottom */}
              <div className="flex w-full flex-row flex-wrap items-center gap-2 px-5 pb-5">
                <SelectPopover
                  className="w-max min-w-32"
                  align="start"
                  options={feeTierOptions}
                  placeholder="All fee tiers"
                  values={feeTiers.map((feeTier) => feeTier.toString())}
                  onChange={(id: string) => onFeeTierChange(+id)}
                  isMultiSelect
                  canClear
                  onClear={() => setFeeTiers([])}
                />

                <SelectPopover
                  className="w-max min-w-32"
                  align="start"
                  options={quoterIdOptions}
                  placeholder="All quoter types"
                  values={quoterIds}
                  onChange={(id: string) => onQuoterIdChange(id as QuoterId)}
                  isMultiSelect
                  canClear
                  onClear={() => setQuoterIds([])}
                />
              </div>
            </div>
            <Divider />
          </>
        ),
      }}
      dialogContentInnerClassName="max-w-4xl h-[800px]"
      dialogContentInnerChildrenWrapperClassName="pt-5 flex-1"
    >
      {/* Search results */}
      <div
        className={cn(
          !showSearchResults ? "hidden" : "flex min-h-0 flex-1 flex-col gap-5",
        )}
      >
        <h2 className="-mb-2 text-p1 text-foreground">
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
            "flex max-h-max min-h-0 w-full flex-1 flex-row items-stretch overflow-hidden",
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
          showSearchResults ? "hidden" : "flex min-h-0 flex-1 flex-col gap-5",
        )}
      >
        {recentPoolGroups.length > 0 && (
          <>
            <h2 className="-mb-2 text-p1 text-foreground">Recent pools</h2>
            <div className="flex max-h-max min-h-0 w-full flex-1 flex-row items-stretch overflow-hidden">
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

        <h2 className="-mb-2 text-p1 text-foreground">Popular pools</h2>
        <div className="flex max-h-max min-h-0 w-full flex-1 flex-row items-stretch overflow-hidden">
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
