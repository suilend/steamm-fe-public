import { CSSProperties, useMemo, useState } from "react";

import { ClassValue } from "clsx";
import { useLocalStorage } from "usehooks-ts";

import HeaderColumn, { SortDirection } from "@/components/TableHeaderColumn";
import TokenRow from "@/components/tokens/TokenRow";
import { Skeleton } from "@/components/ui/skeleton";
import { Token } from "@/contexts/MarketContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import { cn } from "@/lib/utils";

export type TokenColumn = "token" | "marketCap" | "volume24h" | "holders";
type SortableColumn = "marketCap" | "volume24h" | "holders";

interface TokensTableProps {
  className?: ClassValue;
  containerClassName?: ClassValue;
  tableContainerClassName?: ClassValue;
  tableId: string;
  tokens?: Token[];
  searchString?: string;
  pageSize?: number;
}

export default function TokensTable({
  className,
  containerClassName,
  tableContainerClassName,
  tableId,
  tokens,
  pageSize = 100,
}: TokensTableProps) {
  const { md } = useBreakpoint();

  // Columns
  const columnStyleMap: Record<
    TokenColumn,
    { cell: CSSProperties; children: CSSProperties }
  > = useMemo(
    () => ({
      token: {
        cell: { textAlign: "left" },
        children: {
          paddingLeft: 4 * 5, // px
          paddingRight: 4 * 5, // px
          justifyContent: "start",
        },
      },
      marketCap: {
        cell: { textAlign: "right" },
        children: {
          paddingRight: 4 * 5, // px
          justifyContent: "end",
        },
      },
      volume24h: {
        cell: { textAlign: "right" },
        children: {
          paddingRight: 4 * 5, // px
          justifyContent: "end",
        },
      },
      holders: {
        cell: { textAlign: "right" },
        children: {
          paddingRight: 4 * 5, // px
          justifyContent: "end",
        },
      },
    }),
    [],
  );

  // Sort
  type SortState = { column: SortableColumn; direction: SortDirection };

  const [sortState, setSortState] = useLocalStorage<SortState | undefined>(
    `TokensTable_${tableId}_sortState`,
    { column: "marketCap", direction: SortDirection.DESC }, // Default sort by market cap descending
  );

  const toggleSortByColumn = (column: SortableColumn) => {
    setSortState((prev) => {
      if (prev === undefined || prev.column !== column)
        return { column, direction: SortDirection.DESC };

      if (prev.direction === SortDirection.DESC)
        return { column, direction: SortDirection.ASC };
      else return undefined;
    });
  };

  const sortedTokens: Token[] = useMemo(() => {
    if (!tokens || !sortState) return tokens || [];

    return [...tokens].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortState.column) {
        case "marketCap":
          aValue = a.marketCap;
          bValue = b.marketCap;
          break;
        case "volume24h":
          aValue = parseFloat(a.volume24h) || 0;
          bValue = parseFloat(b.volume24h) || 0;
          break;
        case "holders":
          aValue = a.holders;
          bValue = b.holders;
          break;
        default:
          return 0;
      }

      if (sortState.direction === SortDirection.ASC) {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }, [tokens, sortState]);

  // Pagination
  const [pageIndex, setPageIndex] = useState<number>(0);
  const pageIndexes: number[] | undefined = useMemo(() => {
    if (sortedTokens === undefined) return undefined;

    const pageCount = Math.ceil(sortedTokens.length / pageSize);
    const lastPageIndex = pageCount - 1;
    const maxButtons = md ? 7 : 5;

    if (pageCount < maxButtons)
      return Array.from({ length: pageCount }).map((_, index) => index);

    if (md) {
      // Desktop: show up to 7 buttons
      // First three pages
      if (pageIndex <= 2) return [0, 1, 2, 3, 4, 5, lastPageIndex];

      // Last three pages
      if (pageIndex >= lastPageIndex - 2)
        return [
          0,
          lastPageIndex - 5,
          lastPageIndex - 4,
          lastPageIndex - 3,
          lastPageIndex - 2,
          lastPageIndex - 1,
          lastPageIndex,
        ];

      return [
        0,
        pageIndex - 2,
        pageIndex - 1,
        pageIndex,
        pageIndex + 1,
        pageIndex + 2,
        lastPageIndex,
      ];
    } else {
      // Mobile: show up to 5 buttons
      // First two pages
      if (pageIndex <= 1) return [0, 1, 2, 3, lastPageIndex];

      // Last two pages
      if (pageIndex >= lastPageIndex - 1)
        return [
          0,
          lastPageIndex - 3,
          lastPageIndex - 2,
          lastPageIndex - 1,
          lastPageIndex,
        ];

      return [0, pageIndex - 1, pageIndex, pageIndex + 1, lastPageIndex];
    }
  }, [sortedTokens, pageSize, pageIndex, md]);

  const pageRows = useMemo(
    () =>
      sortedTokens === undefined
        ? undefined
        : sortedTokens.slice(
            pageSize * pageIndex,
            pageSize * pageIndex + pageSize,
          ),
    [sortedTokens, pageSize, pageIndex],
  );

  return (
    <div className={cn("relative w-full", className)}>
      {/* Table */}
      <div
        className={cn(
          "relative z-[2] w-full overflow-hidden rounded-md",
          containerClassName,
        )}
      >
        <div className="pointer-events-none absolute inset-0 z-[2] rounded-md border" />

        <div
          className={cn(
            "relative z-[1] w-full overflow-auto",
            tableContainerClassName,
          )}
        >
          <table className="w-full">
            <tbody>
              {/* Header */}
              {md && (
                <tr className="h-[calc(1px+40px+1px)] border bg-secondary">
                  <HeaderColumn<TokenColumn, SortableColumn>
                    id="token"
                    style={columnStyleMap.token}
                  >
                    Token
                  </HeaderColumn>

                  <HeaderColumn<TokenColumn, SortableColumn>
                    id="marketCap"
                    sortState={sortState}
                    toggleSortByColumn={toggleSortByColumn}
                    style={columnStyleMap.marketCap}
                  >
                    MC
                  </HeaderColumn>

                  <HeaderColumn<TokenColumn, SortableColumn>
                    id="volume24h"
                    sortState={sortState}
                    toggleSortByColumn={toggleSortByColumn}
                    titleEndDecorator="24H"
                    style={columnStyleMap.volume24h}
                  >
                    Volume
                  </HeaderColumn>

                  <HeaderColumn<TokenColumn, SortableColumn>
                    id="holders"
                    sortState={sortState}
                    toggleSortByColumn={toggleSortByColumn}
                    style={columnStyleMap.holders}
                  >
                    Holders
                  </HeaderColumn>
                </tr>
              )}

              {/* Rows */}
              {pageRows === undefined
                ? Array.from({ length: 3 }).map((_, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td style={columnStyleMap.token.cell}>
                        <div
                          className="flex flex-row items-center gap-3 py-4"
                          style={columnStyleMap.token.children}
                        >
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex flex-col gap-1">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </td>
                      <td style={columnStyleMap.marketCap.cell}>
                        <div
                          className="flex flex-row items-center py-4"
                          style={columnStyleMap.marketCap.children}
                        >
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </td>
                      <td style={columnStyleMap.volume24h.cell}>
                        <div
                          className="flex flex-row items-center py-4"
                          style={columnStyleMap.volume24h.children}
                        >
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </td>
                      <td style={columnStyleMap.holders.cell}>
                        <div
                          className="flex flex-row items-center py-4"
                          style={columnStyleMap.holders.children}
                        >
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </td>
                    </tr>
                  ))
                : pageRows.map((token) => (
                    <TokenRow
                      key={token.id}
                      columnStyleMap={columnStyleMap}
                      token={token}
                    />
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pageIndexes && pageIndexes.length > 1 && (
        <div className="relative z-[1] mt-4 flex w-full flex-row items-center justify-center gap-2">
          {pageIndexes.map((_pageIndex) => (
            <button
              key={_pageIndex}
              className={cn(
                "flex h-10 min-w-10 flex-row items-center justify-center rounded-md border px-2.5 transition-colors",
                _pageIndex === pageIndex
                  ? "cursor-default border-button-1 bg-button-1/25"
                  : "hover:bg-border/50",
              )}
              onClick={
                _pageIndex === pageIndex
                  ? undefined
                  : () => setPageIndex(_pageIndex)
              }
            >
              <p className="text-p2 text-foreground">{_pageIndex + 1}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
