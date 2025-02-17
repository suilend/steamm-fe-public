import React, { useState } from "react";

import { ChevronDown, ChevronUp } from "lucide-react";

import { getToken } from "@suilend/frontend-sui";

import Popover from "@/components/Popover";
import TokenLogo from "@/components/TokenLogo";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

interface CoinPopoverProps {
  coinType: string;
  otherCoinType: string;
  onCoinClick: (coinType: string) => void;
}

export default function CoinPopover({
  coinType,
  otherCoinType,
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
        <button className="flex h-10 flex-row items-center gap-2">
          <div className="flex flex-row items-center gap-2.5">
            <TokenLogo
              token={getToken(coinType, appData.poolCoinMetadataMap[coinType])}
              size={28}
            />
            <p className="text-h3 text-foreground">
              {appData.poolCoinMetadataMap[coinType].symbol}
            </p>
          </div>

          <Chevron
            className={cn(
              "-ml-0.5 -mr-1 h-4 w-4 shrink-0",
              isOpen
                ? "text-foreground"
                : "text-secondary-foreground transition-colors group-hover:text-foreground",
            )}
          />
        </button>
      }
    >
      <div className="flex w-full flex-row flex-wrap gap-1">
        {Object.values(appData.bTokenTypeCoinTypeMap).map((_coinType) => (
          <button
            key={_coinType}
            className="flex h-10 w-max flex-row items-center gap-2 rounded-md border px-3 transition-colors hover:bg-border/50 disabled:pointer-events-none disabled:opacity-50"
            onClick={() => {
              onCoinClick(_coinType);
              setIsOpen(false);
            }}
            disabled={_coinType === otherCoinType}
          >
            <TokenLogo
              token={getToken(
                _coinType,
                appData.poolCoinMetadataMap[_coinType],
              )}
              size={20}
            />
            <p className="text-p2 text-foreground">
              {appData.poolCoinMetadataMap[_coinType].symbol}
            </p>
          </button>
        ))}
      </div>
    </Popover>
  );
}
