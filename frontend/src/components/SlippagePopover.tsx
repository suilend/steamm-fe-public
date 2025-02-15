import React, { useCallback, useState } from "react";

import BigNumber from "bignumber.js";
import { SlidersHorizontal } from "lucide-react";

import { formatInteger, formatPercent } from "@suilend/frontend-sui";

import Popover from "@/components/Popover";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

export default function SlippagePopover() {
  const { slippagePercent, setSlippagePercent } = useLoadedAppContext();

  // Custom slippage
  const [value, setValue] = useState<string>(
    slippagePercent.toFixed(2).at(-1)! === "0"
      ? slippagePercent.toFixed(1)
      : slippagePercent.toFixed(2),
  );

  const formatAndSetSlippagePercent = useCallback(
    (_value: string) => {
      let formattedValue;
      if (new BigNumber(_value || 0).lt(0)) formattedValue = "0";
      else if (new BigNumber(_value).gt(100)) formattedValue = "100";
      else if (!_value.includes(".")) formattedValue = _value;
      else {
        const [integers, decimals] = _value.split(".");
        const integersFormatted = formatInteger(
          integers !== "" ? parseInt(integers) : 0,
          false,
        );
        const decimalsFormatted = decimals.slice(
          0,
          Math.min(decimals.length, 2),
        );
        formattedValue = `${integersFormatted}.${decimalsFormatted}`;
      }

      setValue(formattedValue);
      if (+formattedValue > 0 && +formattedValue <= 100)
        setSlippagePercent(+formattedValue);
    },
    [setSlippagePercent],
  );

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Popover
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      contentProps={{
        align: "end",
        maxWidth: 280,
      }}
      trigger={
        <button
          className={cn(
            "group flex h-6 flex-row items-center gap-1.5 rounded-[12px] border px-2 transition-colors",
            isOpen ? "cursor-default bg-border" : "hover:bg-border/50",
          )}
        >
          <SlidersHorizontal
            className={cn(
              "h-3 w-3 transition-colors",
              isOpen
                ? "text-foreground"
                : "text-secondary-foreground group-hover:text-foreground",
            )}
          />
          <p
            className={cn(
              "!text-p3 transition-colors",
              isOpen
                ? "text-foreground"
                : "text-secondary-foreground group-hover:text-foreground",
            )}
          >
            {slippagePercent.toFixed(2).at(-1)! === "0"
              ? slippagePercent.toFixed(1)
              : slippagePercent.toFixed(2)}
            %
          </p>
        </button>
      }
    >
      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full flex-row gap-1">
          {[0.1, 1, 3].map((sp) => (
            <button
              key={sp}
              className={cn(
                "group flex h-10 flex-1 flex-row items-center justify-center rounded-md border px-3 transition-colors",
                slippagePercent === sp
                  ? "cursor-default bg-border"
                  : "hover:bg-border/50",
              )}
              onClick={() => {
                setSlippagePercent(sp);
                setValue(sp.toFixed(1));
              }}
            >
              <p
                className={cn(
                  "!text-p2 transition-colors",
                  slippagePercent === sp
                    ? "text-foreground"
                    : "text-secondary-foreground group-hover:text-foreground",
                )}
              >
                {formatPercent(new BigNumber(sp), { dp: 1 })}
              </p>
            </button>
          ))}
        </div>

        <div className="flex w-full flex-col gap-2">
          <p className="text-p2 text-secondary-foreground">Custom</p>

          <div className="relative w-full">
            <input
              className="relative z-[1] h-10 w-full min-w-0 rounded-md border bg-input px-3 text-p1 text-foreground placeholder:text-tertiary-foreground focus-visible:border-focus focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              type="number"
              placeholder={`${
                slippagePercent.toFixed(2).at(-1)! === "0"
                  ? slippagePercent.toFixed(1)
                  : slippagePercent.toFixed(2)
              }%`}
              value={value}
              onChange={(e) => formatAndSetSlippagePercent(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              step="any"
            />
            <p className="pointer-events-none absolute right-3 top-1/2 z-[2] -translate-y-1/2 text-p2 text-secondary-foreground">
              %
            </p>
          </div>
        </div>
      </div>
    </Popover>
  );
}
