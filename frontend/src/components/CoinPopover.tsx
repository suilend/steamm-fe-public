import React, { useRef, useState } from "react";

import { ChevronDown, ChevronUp } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { Token, formatId } from "@suilend/frontend-sui";

import Popover from "@/components/Popover";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/utils";

interface CoinPopoverProps {
  token?: Token;
  tokens: Token[];
  onTokenClick: (token: Token) => void;
}

export default function CoinPopover({
  token,
  tokens,
  onTokenClick,
}: CoinPopoverProps) {
  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const Chevron = isOpen ? ChevronUp : ChevronDown;

  // Events
  const id = useRef<string>(uuidv4()).current;

  const onKeyDown = (e: React.KeyboardEvent) => {
    const token = tokens.find((_token) =>
      _token.symbol.toLowerCase().startsWith(e.key.toLowerCase()),
    );

    const elem = document
      .getElementById(id)!
      .querySelector(`#${token?.symbol}`) as HTMLDivElement | null;
    elem?.focus();
  };

  return (
    <Popover
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      contentProps={{
        align: "end",
        maxWidth: 240,
      }}
      trigger={
        <button className="group flex h-10 flex-row items-center gap-2">
          <div className="flex flex-row items-center gap-2">
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
          </div>

          <Chevron
            className={cn(
              "-ml-0.5 -mr-1 h-5 w-5 shrink-0 transition-colors",
              isOpen
                ? "text-foreground"
                : "text-secondary-foreground group-hover:text-foreground",
            )}
          />
        </button>
      }
    >
      <div id={id} className="flex w-full flex-col gap-1" onKeyDown={onKeyDown}>
        {tokens.length > 0 ? (
          tokens.map((_token) => (
            <button
              id={_token.symbol}
              key={_token.coinType}
              className={cn(
                "group flex min-h-10 w-full flex-col items-start gap-1 rounded-md border px-3 py-2 transition-colors",
                _token.coinType === token?.coinType
                  ? "cursor-default bg-button-1"
                  : "hover:bg-border/50",
              )}
              onClick={() => {
                onTokenClick(_token);
                setIsOpen(false);
              }}
            >
              <div className="flex flex-row gap-2">
                <TokenLogo
                  className="my-[calc((24px-16px)/2)]"
                  token={_token}
                  size={16}
                />
                <p
                  className={cn(
                    "break-all text-left !text-p1 transition-colors",
                    _token.coinType === token?.coinType
                      ? "text-button-1-foreground"
                      : "text-secondary-foreground group-hover:text-foreground",
                  )}
                >
                  {_token.symbol}
                </p>
              </div>

              <Tooltip title={_token.coinType}>
                <p
                  className={cn(
                    "!text-p3 transition-colors",
                    _token.coinType === token?.coinType
                      ? "text-button-1-foreground/75"
                      : "text-tertiary-foreground group-hover:text-foreground/75",
                  )}
                >
                  {/* TEMP */}
                  {formatId(_token.coinType)}
                </p>
              </Tooltip>
            </button>
          ))
        ) : (
          <p className="text-p2 text-tertiary-foreground">No tokens</p>
        )}
      </div>
    </Popover>
  );
}
