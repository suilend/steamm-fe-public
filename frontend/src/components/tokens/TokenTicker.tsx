import { useMemo } from "react";

import { cn } from "@/lib/utils";

interface Token {
  id: string;
  name: string;
  symbol: string;
  change24h: number;
  marketCap: number;
  price: number;
  isVerified: boolean;
}

interface TokenTickerProps {
  tokens: Token[];
  className?: string;
}

export default function TokenTicker({ tokens, className }: TokenTickerProps) {
  // Duplicate tokens to create seamless loop
  const duplicatedTokens = useMemo(() => [...tokens, ...tokens], [tokens]);

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(2)}M`;
    }
    return `$${(marketCap / 1000).toFixed(0)}K`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <div
      className={cn(
        "fixed left-0 right-0 -mt-6 w-full overflow-hidden border-b bg-background/60 backdrop-blur-lg md:-mt-8",
        className,
      )}
    >
      <div className="animate-scroll flex items-center divide-x divide-border whitespace-nowrap">
        {duplicatedTokens.map((token, index) => (
          <div
            key={`${token.id}-${index}`}
            className="text-sm flex items-center gap-2 px-4 py-2"
          >
            {/* Verified indicator */}
            {token.isVerified && (
              <div className="h-2 w-2 rounded-full bg-verified" />
            )}

            {/* Token name */}
            <span className="font-medium text-foreground">{token.name}</span>

            {/* Market cap */}
            <span className="text-secondary-foreground">
              {formatMarketCap(token.marketCap)}
            </span>

            {/* Change percentage */}
            <span
              className={cn(
                "font-medium",
                token.change24h >= 0 ? "text-success" : "text-error",
              )}
            >
              {formatChange(token.change24h)}
            </span>
          </div>
        ))}
      </div>

      {/* Gradient fade effects */}
      <div className="to-transparent pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background" />
      <div className="to-transparent pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background" />
    </div>
  );
}
