import Link from "next/link";
import { CSSProperties, useCallback } from "react";

import BigNumber from "bignumber.js";
import { ExternalLink, Star } from "lucide-react";

import { formatToken, formatUsd } from "@suilend/sui-fe";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import Parameter from "@/components/Parameter";
import TokenLogo from "@/components/TokenLogo";
import { TokenColumn } from "@/components/tokens/TokensTable";
import { useLoadedMarketContext } from "@/contexts/MarketContext";
import { QuickBuyToken, Token } from "@/contexts/MarketContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import { ASSETS_URL } from "@/lib/constants";
import { isInvalidIconUrl } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import VerifiedBadge from "../VerifiedBadge";

interface TokenRowProps {
  columnStyleMap: Record<
    TokenColumn,
    { cell: CSSProperties; children: CSSProperties }
  >;
  token: Token;
}

export default function TokenRow({ columnStyleMap, token }: TokenRowProps) {
  const {
    watchlist,
    setWatchlist,
    quickBuyToken,
    buyingTokenId,
    quickBuyAmount,
    setIsWatchlistMode,
  } = useLoadedMarketContext();

  const isInWatchlist = watchlist.includes(token.id);

  const handleWatchlistToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setWatchlist(token.id);
      setIsWatchlistMode(true);
    },
    [setWatchlist, setIsWatchlistMode, token.id],
  );

  const handleQuickBuy = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const quickBuyTokenData: QuickBuyToken = {
        id: token.id,
        symbol: token.symbol,
        decimals: token.decimals,
        description: token.description,
        name: token.name,
        coinType: token.coinType,
      };
      await quickBuyToken(quickBuyTokenData);
    },
    [quickBuyToken, token],
  );

  const noodlesUrl = `https://noodles.fi/coin/${token.coinType}`;

  // Format volume - show "-" if no volume data
  const formattedVolume =
    token.volume24h && token.volume24h !== "0"
      ? formatUsd(new BigNumber(token.volume24h), { exact: false })
      : "-";

  const { md } = useBreakpoint();

  // Helper function to abbreviate token name
  const abbreviateTokenName = (
    name: string,
    maxLength: number = 15,
  ): string => {
    if (name.length <= maxLength) return name;

    const halfLength = Math.floor((maxLength - 3) / 2); // -3 for "..."
    const start = name.slice(0, halfLength);
    const end = name.slice(-halfLength);
    return `${start}...${end}`;
  };

  return (
    <tr
      className={cn(
        "group cursor-pointer border-x border-b bg-background transition-colors hover:bg-tertiary",
      )}
    >
      {/* Token */}
      <td
        className="whitespace-nowrap align-middle"
        style={columnStyleMap.token.cell}
      >
        <div
          className="flex flex-row items-center py-4 md:w-full md:min-w-max"
          style={columnStyleMap.token.children}
        >
          <div className="flex w-full flex-row items-center gap-3 md:w-max">
            {md ? (
              <>
                <div className="relative h-8 w-8 flex-shrink-0">
                  <TokenLogo
                    token={{
                      coinType: token.coinType,
                      symbol: token.symbol,
                      iconUrl: !isInvalidIconUrl(token.image)
                        ? token.image
                        : undefined,
                      decimals: token.decimals,
                      description: token.description,
                      name: token.name,
                    }}
                    size={32}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-foreground">
                      {token.symbol}
                    </span>
                    {token.isVerified && (
                      <VerifiedBadge tooltip="Verified token" />
                    )}

                    {/* Token Controls - always visible */}
                    <div className="flex items-center gap-1">
                      {/* Copy Address */}
                      <CopyToClipboardButton
                        value={token.coinType}
                        className="rounded h-3 w-3 hover:bg-border/50"
                      />

                      {/* Watchlist Toggle */}
                      <button
                        onClick={handleWatchlistToggle}
                        className={cn(
                          "rounded transition-colors hover:bg-border/50",
                          isInWatchlist
                            ? "text-warning"
                            : "text-secondary-foreground",
                        )}
                      >
                        <Star
                          className={cn(
                            "h-3 w-3",
                            isInWatchlist && "fill-current",
                          )}
                        />
                      </button>

                      {/* Noodles Link */}
                      <Link
                        href={noodlesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded text-secondary-foreground transition-colors hover:bg-border/50 hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm truncate text-secondary-foreground">
                      {abbreviateTokenName(token.name)}
                    </span>
                    <span className="text-xs font-mono text-tertiary-foreground">
                      {token.coinType.slice(0, 5)}...{token.coinType.slice(-5)}
                    </span>
                  </div>
                </div>

                {/* Quick Buy Button */}
                <div className="ml-2 flex-shrink-0">
                  <button
                    className={cn(
                      "text-sm flex items-center gap-2 rounded-md border border-border bg-button-2 px-2 py-1 transition-colors hover:bg-button-2/90",
                      buyingTokenId === token.id &&
                        "cursor-not-allowed opacity-50",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickBuy(e);
                    }}
                    disabled={buyingTokenId === token.id}
                  >
                    <span className="font-medium text-button-1">
                      {buyingTokenId === token.id
                        ? "..."
                        : quickBuyAmount.length
                          ? formatToken(new BigNumber(quickBuyAmount), {
                              trimTrailingZeros: true,
                            })
                          : "-"}
                    </span>
                    <img
                      src={`${ASSETS_URL}/icons/sui.png`}
                      alt="SUI"
                      className="h-4 w-4 flex-shrink-0"
                    />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex w-full flex-col gap-3">
                {/* Top */}
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-8 flex-shrink-0">
                    <TokenLogo
                      token={{
                        coinType: token.coinType,
                        symbol: token.symbol,
                        iconUrl: !isInvalidIconUrl(token.image)
                          ? token.image
                          : undefined,
                        decimals: token.decimals,
                        description: token.description,
                        name: token.name,
                      }}
                      size={32}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-foreground">
                        {token.symbol}
                      </span>
                      {token.isVerified && (
                        <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-success">
                          <div className="h-2 w-2 rounded-full bg-background" />
                        </div>
                      )}

                      {/* Token Controls - always visible */}
                      <div className="flex items-center gap-1">
                        <CopyToClipboardButton
                          value={token.coinType}
                          className="rounded h-3 w-3 hover:bg-border/50"
                        />

                        <button
                          onClick={handleWatchlistToggle}
                          className={cn(
                            "rounded h-3 w-3 transition-colors hover:bg-border/50",
                            isInWatchlist
                              ? "text-warning"
                              : "text-secondary-foreground",
                          )}
                        >
                          <Star
                            className={cn(
                              "h-3 w-3",
                              isInWatchlist && "fill-current",
                            )}
                          />
                        </button>

                        <Link
                          href={noodlesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded h-3 w-3 text-secondary-foreground transition-colors hover:bg-border/50 hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm truncate text-secondary-foreground">
                        {abbreviateTokenName(token.name)}
                      </span>
                      <span className="text-xs font-mono text-tertiary-foreground">
                        {token.coinType.split("::")[0].slice(0, 5)}...
                      </span>
                    </div>
                  </div>

                  {/* Quick Buy Button */}
                  <div className="ml-2 flex-shrink-0">
                    <button
                      className={cn(
                        "text-sm flex items-center gap-2 rounded-md border border-border bg-button-2 px-2 py-1 transition-colors hover:bg-button-2/90",
                        buyingTokenId === token.id &&
                          "cursor-not-allowed opacity-50",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickBuy(e);
                      }}
                      disabled={buyingTokenId === token.id}
                    >
                      <span className="font-medium text-button-1">
                        {buyingTokenId === token.id
                          ? "..."
                          : formatToken(new BigNumber(quickBuyAmount), {
                              trimTrailingZeros: true,
                            })}
                      </span>
                      <img
                        src={`${ASSETS_URL}/icons/sui.png`}
                        alt="SUI"
                        className="h-4 w-4 flex-shrink-0"
                      />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex w-full flex-col gap-2">
                  {/* Market Cap */}
                  <Parameter label="MC" isHorizontal>
                    <p className="text-p2 text-foreground">
                      {formatUsd(new BigNumber(token.marketCap), {
                        exact: false,
                      })}
                    </p>
                  </Parameter>

                  {/* Volume */}
                  <Parameter
                    label="Volume"
                    labelEndDecorator="24H"
                    isHorizontal
                  >
                    <p className="text-p2 text-foreground">{formattedVolume}</p>
                  </Parameter>

                  {/* Holders */}
                  <Parameter label="Holders" isHorizontal>
                    <p className="text-p2 text-foreground">
                      {token.holders.toLocaleString()}
                    </p>
                  </Parameter>
                </div>
              </div>
            )}
          </div>
        </div>
      </td>

      {md && (
        <>
          {/* Market Cap */}
          <td
            className="whitespace-nowrap align-middle"
            style={columnStyleMap.marketCap.cell}
          >
            <div
              className="flex min-w-max flex-row items-center py-4"
              style={columnStyleMap.marketCap.children}
            >
              <div className="w-max">
                <p className="text-p1 text-foreground">
                  {formatUsd(new BigNumber(token.marketCap), { exact: false })}
                </p>
              </div>
            </div>
          </td>

          {/* 24H Volume */}
          <td
            className="whitespace-nowrap align-middle"
            style={columnStyleMap.volume24h.cell}
          >
            <div
              className="flex min-w-max flex-row items-center py-4"
              style={columnStyleMap.volume24h.children}
            >
              <div className="w-max">
                <p className="text-p1 text-foreground">{formattedVolume}</p>
              </div>
            </div>
          </td>

          {/* Holders */}
          <td
            className="whitespace-nowrap align-middle"
            style={columnStyleMap.holders.cell}
          >
            <div
              className="flex min-w-max flex-row items-center py-4"
              style={columnStyleMap.holders.children}
            >
              <div className="w-max">
                <p className="text-p1 text-foreground">
                  {token.holders.toLocaleString()}
                </p>
              </div>
            </div>
          </td>
        </>
      )}
    </tr>
  );
}
