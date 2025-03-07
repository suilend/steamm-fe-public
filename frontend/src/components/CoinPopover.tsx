import React, { useState } from "react";

import { ChevronDown, ChevronUp } from "lucide-react";

import { getToken } from "@suilend/frontend-sui";

import Popover from "@/components/Popover";
import TokenLogo from "@/components/TokenLogo";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

interface CoinPopoverProps {
  coinType: string;
  onCoinClick: (coinType: string) => void;
}

export default function CoinPopover({
  coinType,
  onCoinClick,
}: CoinPopoverProps) {
  const { appData } = useLoadedAppContext();

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const Chevron = isOpen ? ChevronUp : ChevronDown;

  return (
    <Popover
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      contentProps={{
        align: "end",
        maxWidth: 240,
      }}
      trigger={
        <button className="group flex h-10 flex-row items-center gap-2">
          <div className="flex flex-row items-center gap-2.5">
            <TokenLogo
              token={getToken(coinType, appData.coinMetadataMap[coinType])}
              size={28}
            />
            <p className="text-h3 text-foreground">
              {appData.coinMetadataMap[coinType].symbol}
            </p>
          </div>

          <Chevron
            className={cn(
              "-ml-0.5 -mr-1 h-4 w-4 shrink-0 transition-colors",
              isOpen
                ? "text-foreground"
                : "text-secondary-foreground group-hover:text-foreground",
            )}
          />
        </button>
      }
    >
      <div className="flex w-full flex-col gap-1">
        {Object.values(appData.bTokenTypeCoinTypeMap)
          .sort(
            (a, b) =>
              appData.coinMetadataMap[a].symbol.toLowerCase() <
              appData.coinMetadataMap[b].symbol.toLowerCase()
                ? -1
                : 1, // Sort by symbol (ascending)
          )
          .map((_coinType) => (
            <button
              key={_coinType}
              className={cn(
                "group flex h-10 w-full flex-row items-center gap-2 rounded-md border px-3 transition-colors",
                _coinType === coinType
                  ? "cursor-default bg-button-1"
                  : "hover:bg-border/50",
              )}
              onClick={() => {
                onCoinClick(_coinType);
                setIsOpen(false);
              }}
            >
              <TokenLogo
                token={getToken(_coinType, appData.coinMetadataMap[_coinType])}
                size={20}
              />
              <p
                className={cn(
                  "!text-p2 transition-colors",
                  _coinType === coinType
                    ? "text-button-1-foreground"
                    : "text-secondary-foreground group-hover:text-foreground",
                )}
              >
                {appData.coinMetadataMap[_coinType].symbol}
              </p>
            </button>
          ))}
      </div>
    </Popover>
  );
}
