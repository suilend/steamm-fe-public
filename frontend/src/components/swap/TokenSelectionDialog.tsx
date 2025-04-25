import { useCallback, useMemo, useRef, useState } from "react";

import { ChevronDown, Search, Wallet, X } from "lucide-react";

import {
  NORMALIZED_SEND_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
  NORMALIZED_USDC_COINTYPE,
  NORMALIZED_WAL_COINTYPE,
  NORMALIZED_sSUI_COINTYPE,
  SUI_COINTYPE,
  Token,
  formatToken,
  isSui,
} from "@suilend/frontend-sui";
import useIsTouchscreen from "@suilend/frontend-sui-next/hooks/useIsTouchscreen";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import Dialog from "@/components/Dialog";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import { useUserContext } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

interface TokenRowProps {
  token: Token;
  isSelected: boolean;
  onClick: () => void;
}

function TokenRow({ token, isSelected, onClick }: TokenRowProps) {
  const { getBalance } = useUserContext();

  return (
    <div
      className={cn(
        "group relative z-[1] flex w-full cursor-pointer flex-row items-center gap-3 rounded-md border px-3 py-2 transition-colors",
        isSelected ? "border-button-1 bg-button-1/25" : "hover:bg-border/50",
      )}
      onClick={onClick}
    >
      <TokenLogo className="shrink-0" token={token} size={24} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Top left */}
        <div className="flex w-full min-w-0 flex-row items-center gap-2">
          <p className="overflow-hidden text-ellipsis text-nowrap !text-p2 text-foreground">
            {token.symbol}
          </p>

          <div className="w-max shrink-0">
            <CopyToClipboardButton
              value={isSui(token.coinType) ? SUI_COINTYPE : token.coinType}
            />
          </div>
        </div>

        {/* Bottom left */}
        {token.name && (
          <p className="overflow-hidden text-ellipsis text-nowrap !text-p2 text-secondary-foreground">
            {token.name}
          </p>
        )}
      </div>

      {/* Right */}
      <div className="flex shrink-0 flex-row items-center gap-2">
        <Wallet className="h-4 w-4 text-foreground" />
        <p className="text-p2 text-foreground">
          {formatToken(getBalance(token.coinType), { exact: false })}
        </p>
      </div>
    </div>
  );
}

interface TokenSelectionDialogProps {
  token?: Token;
  tokens: Token[];
  onSelectToken: (token: Token) => void;
}

export default function TokenSelectionDialog({
  token,
  tokens,
  onSelectToken,
}: TokenSelectionDialogProps) {
  const { getBalance } = useUserContext();

  const isTouchscreen = useIsTouchscreen();

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const onOpenChange = (_isOpen: boolean) => {
    setIsOpen(_isOpen);
  };

  // Tokens - categories
  const balanceTokens = useMemo(() => {
    const sortedTokens = tokens
      .filter((t) => getBalance(t.coinType).gt(0))
      .sort((a, b) => +getBalance(b.coinType) - +getBalance(a.coinType));

    return sortedTokens;
  }, [tokens, getBalance]);

  const otherTokens = useMemo(
    () =>
      tokens.filter(
        (t) => !balanceTokens.find((_t) => _t.coinType === t.coinType),
      ),
    [tokens, balanceTokens],
  );

  // Tokens - top
  const topTokens = useMemo(
    () =>
      [
        NORMALIZED_sSUI_COINTYPE,
        NORMALIZED_SUI_COINTYPE,
        NORMALIZED_USDC_COINTYPE,
        NORMALIZED_WAL_COINTYPE,
        NORMALIZED_SEND_COINTYPE,
      ]

        .map((coinType) => tokens.find((t) => t.coinType === coinType))
        .filter(Boolean) as Token[],
    [tokens],
  );

  // Filter
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchString, setSearchString] = useState<string>("");

  const filterTokens = useCallback(
    (_tokens: Token[]) =>
      _tokens.filter((t) =>
        `${t.coinType}${t.symbol}${t.name}`
          .toLowerCase()
          .includes(searchString.toLowerCase()),
      ),
    [searchString],
  );

  const filteredBalanceTokens = useMemo(
    () => filterTokens(balanceTokens),
    [filterTokens, balanceTokens],
  );
  const filteredOtherTokens = useMemo(
    () => filterTokens(otherTokens),
    [filterTokens, otherTokens],
  );

  const filteredTokens = useMemo(
    () => [...filteredBalanceTokens, ...filteredOtherTokens],
    [filteredBalanceTokens, filteredOtherTokens],
  );

  const filteredTokensMap = useMemo(
    () => ({
      balance: {
        title: "Wallet balances",
        tokens: filteredBalanceTokens,
      },
      other: {
        title:
          filteredBalanceTokens.length > 0
            ? "Other known assets"
            : "Known assets",
        tokens: filteredOtherTokens,
      },
    }),
    [filteredBalanceTokens, filteredOtherTokens],
  );

  // Select token
  const onTokenClick = (t: Token) => {
    onSelectToken(t);
    setTimeout(() => setIsOpen(false), 50);
    setTimeout(() => setSearchString(""), 250);
  };

  return (
    <Dialog
      rootProps={{ open: isOpen, onOpenChange }}
      trigger={
        <button className="group flex h-10 flex-row items-center gap-2">
          {token && <TokenLogo token={token} size={24} />}
          <p
            className={cn(
              token
                ? "!text-h3 text-foreground"
                : cn(
                    "!text-p1 transition-colors",
                    isOpen
                      ? "text-foreground"
                      : "text-secondary-foreground group-hover:text-foreground",
                  ),
            )}
          >
            {token ? token.symbol : "Select token"}
          </p>

          <ChevronDown className="-ml-0.5 -mr-1 h-5 w-5 shrink-0 text-secondary-foreground transition-colors group-hover:text-foreground" />
        </button>
      }
      headerProps={{
        title: { children: "Select token" },
      }}
      dialogContentInnerClassName="max-w-lg h-[800px]"
    >
      {/* Search */}
      <div className="relative z-[1] h-10 w-full shrink-0 rounded-md border bg-background transition-colors focus-within:border-focus">
        <Search className="pointer-events-none absolute left-4 top-3 z-[2] -mt-px h-4 w-4 text-secondary-foreground" />
        {searchString !== "" && (
          <button
            className="group absolute right-2 top-1 z-[2] -mt-px flex h-8 w-8 flex-row items-center justify-center"
            onClick={() => {
              setSearchString("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
          </button>
        )}
        <input
          ref={inputRef}
          autoFocus={!isTouchscreen}
          className={cn(
            "relative z-[1] h-full w-full min-w-0 !border-0 !bg-[transparent] pl-10 text-p2 text-foreground !outline-0 placeholder:text-tertiary-foreground",
            searchString !== "" ? "pr-10" : "pr-4",
          )}
          type="text"
          placeholder="Search by token symbol, name or address"
          value={searchString}
          onChange={(e) => setSearchString(e.target.value)}
        />
      </div>

      {/* Top tokens */}
      {topTokens.length > 0 && (
        <div className="flex shrink-0 flex-row flex-wrap gap-2">
          {topTokens.map((t) => {
            const isSelected = t.coinType === token?.coinType;

            return (
              <button
                key={t.coinType}
                className={cn(
                  "group flex h-10 flex-row items-center gap-2 rounded-[20px] border pl-2 pr-3 transition-colors",
                  isSelected
                    ? "border-button-1 bg-button-1/25"
                    : "hover:bg-border/50",
                )}
                onClick={() => onTokenClick(t)}
              >
                {/* TODO: Truncate symbol if the list of top tokens includes non-reserves */}
                <TokenLogo token={t} size={24} />
                <p className="text-p2 text-foreground">{t.symbol}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Tokens */}
      <div className="relative -mx-4 -mb-4 flex flex-col gap-6 overflow-y-auto px-4 pb-4">
        {filteredTokens.length > 0 ? (
          Object.values(filteredTokensMap)
            .filter((list) => list.tokens.length > 0)
            .map((list, index) => (
              <div className="flex flex-col gap-3" key={index}>
                <div className="flex w-full flex-row items-center gap-3">
                  <p className="text-p1 text-foreground">{list.title}</p>
                  <Tag>{list.tokens.length}</Tag>
                </div>

                <div className="flex w-full flex-col gap-1">
                  {list.tokens.map((t) => (
                    <TokenRow
                      key={t.coinType}
                      token={t}
                      isSelected={t.coinType === token?.coinType}
                      onClick={() => onTokenClick(t)}
                    />
                  ))}
                </div>
              </div>
            ))
        ) : (
          <p className="text-p2 text-tertiary-foreground">
            {searchString ? `No matches for "${searchString}"` : "No tokens"}
          </p>
        )}
      </div>
    </Dialog>
  );
}
