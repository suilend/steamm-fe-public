import { Star } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { Token } from "./TokenColumn";

interface TokenCardProps {
  token: Token;
}

export default function TokenCard({ token }: TokenCardProps) {
  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(1)}M`;
    }
    return `$${(marketCap / 1000).toFixed(0)}K`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <div className="flex w-full flex-row items-center gap-3 rounded-md border p-3 transition-colors hover:bg-card/50">
      {/* Token Image */}
      <div className="h-10 w-10 flex-shrink-0 rounded-full">
        {token.image ? (
          <img
            src={token.image}
            alt={token.name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <Skeleton className="h-full w-full rounded-full" />
        )}
      </div>

      {/* Token Info */}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-row items-center gap-2">
          <h4 className="text-p1 font-medium text-foreground">{token.name}</h4>
          {token.isVerified && (
            <div className="bg-green-500 h-3 w-3 rounded-full" />
          )}
          <span
            className={cn(
              "text-p3 font-medium",
              token.change24h >= 0 ? "text-green-500" : "text-red-500",
            )}
          >
            {formatChange(token.change24h)}
          </span>
        </div>

        <div className="flex flex-row items-center gap-3 text-p3 text-secondary-foreground">
          <span>{token.timeAgo}</span>
          <div className="flex flex-row items-center gap-1">
            <span>👥</span>
            <span>{token.rating}</span>
          </div>
          <span>MC: {formatMarketCap(token.marketCap)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-row items-center gap-2">
        <button className="rounded flex h-6 w-6 items-center justify-center transition-colors hover:bg-card">
          <Star className="h-4 w-4 text-secondary-foreground" />
        </button>
        <button className="text-white hover:bg-blue-600 rounded bg-blue-500 px-3 py-1 text-p3 transition-colors">
          {token.price.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
