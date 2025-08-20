import { useMemo, useRef } from "react";

import { ChevronDown, Search, X } from "lucide-react";

import TokenCard from "@/components/tokens/TokenCard";
import { cn } from "@/lib/utils";

export interface Token {
  id: string;
  name: string;
  symbol: string;
  image: string | null;
  change24h: number;
  timeAgo: string;
  rating: number;
  marketCap: number;
  price: number;
  isVerified: boolean;
}

interface TokenColumnProps {
  title: string;
  tokens: Token[];
  searchString: string;
  onSearchChange: (searchString: string) => void;
  showSearch?: boolean;
}

export default function TokenColumn({
  title,
  tokens,
  searchString,
  onSearchChange,
  showSearch = false,
}: TokenColumnProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter tokens based on search string
  const filteredTokens = useMemo(() => {
    if (!searchString) return tokens;

    return tokens.filter((token) =>
      `${token.name}${token.symbol}${token.id}`
        .toLowerCase()
        .includes(searchString.toLowerCase()),
    );
  }, [tokens, searchString]);

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Column Header */}
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          <h3 className="text-h3 text-foreground">{title}</h3>
          <button className="flex flex-row items-center">
            <ChevronDown className="h-4 w-4 text-secondary-foreground" />
          </button>
        </div>
      </div>

      {/* Search Input (only for certain columns) */}
      {showSearch && (
        <div className="flex w-full flex-col gap-3">
          <div className="relative z-[1] h-10 rounded-md bg-card transition-colors focus-within:bg-card focus-within:shadow-[inset_0_0_0_1px_hsl(var(--focus))]">
            <Search className="pointer-events-none absolute left-3 top-3 z-[2] h-4 w-4 text-secondary-foreground" />
            {searchString !== "" && (
              <button
                className="group absolute right-1 top-1 z-[2] flex h-8 w-8 flex-row items-center justify-center"
                onClick={() => {
                  onSearchChange("");
                  inputRef.current?.focus();
                }}
              >
                <X className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
              </button>
            )}
            <input
              ref={inputRef}
              className={cn(
                "relative z-[1] h-full w-full min-w-0 !border-0 !bg-[transparent] pl-9 text-p2 text-foreground !outline-0 placeholder:text-tertiary-foreground",
                searchString !== "" ? "pr-9" : "pr-3",
              )}
              type="text"
              placeholder="Search keywords"
              value={searchString}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Filter Options */}
          <div className="flex w-full flex-col gap-2">
            <div className="flex flex-row items-center gap-2 text-p3 text-secondary-foreground">
              <span>keyword1, keyword2</span>
            </div>
            <div className="flex flex-row items-center gap-2 text-p3 text-secondary-foreground">
              <span>Exclude keywords</span>
            </div>
            <div className="flex flex-row items-center justify-between">
              <span className="text-p3 text-secondary-foreground">Age</span>
              <div className="flex flex-row items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="rounded w-16 border bg-background px-2 py-1 text-p3"
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="rounded w-16 border bg-background px-2 py-1 text-p3"
                />
              </div>
            </div>
            <div className="flex flex-row items-center justify-between">
              <span className="text-p3 text-secondary-foreground">Holders</span>
              <div className="flex flex-row items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="rounded w-16 border bg-background px-2 py-1 text-p3"
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="rounded w-16 border bg-background px-2 py-1 text-p3"
                />
              </div>
            </div>
            <div className="flex flex-row items-center justify-between">
              <span className="text-p3 text-secondary-foreground">
                Market cap
              </span>
              <div className="flex flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="$"
                  className="rounded w-16 border bg-background px-2 py-1 text-p3"
                />
                <input
                  type="text"
                  placeholder="$"
                  className="rounded w-16 border bg-background px-2 py-1 text-p3"
                />
              </div>
            </div>
            <div className="flex flex-row justify-between">
              <button className="text-p3 text-secondary-foreground hover:text-foreground">
                Reset
              </button>
              <button className="rounded bg-primary px-3 py-1 text-p3 text-primary-foreground">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token List */}
      <div className="flex w-full flex-col gap-3">
        {filteredTokens.map((token) => (
          <TokenCard key={token.id} token={token} />
        ))}
      </div>
    </div>
  );
}
