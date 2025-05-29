import { useCallback, useState } from "react";

import BigNumber from "bignumber.js";
import { SlidersHorizontal } from "lucide-react";

import { formatPercent } from "@suilend/sui-fe";

import PercentInput from "@/components/PercentInput";
import Popover from "@/components/Popover";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { formatPercentInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function SlippagePopover() {
  const { slippagePercent, setSlippagePercent } = useLoadedAppContext();

  // Custom slippage
  const [value, setValue] = useState<string>(
    slippagePercent.toFixed(2).at(-1)! === "0"
      ? slippagePercent.toFixed(1)
      : slippagePercent.toFixed(2),
  );

  const onValueChange = useCallback(
    (_value: string) => {
      const formattedValue = formatPercentInputValue(_value, 2);

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
        maxWidth: 240,
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
          {[0.3, 1, 3].map((sp) => (
            <button
              key={sp}
              className={cn(
                "group flex h-10 flex-1 flex-row items-center justify-center rounded-md border px-3 transition-colors",
                slippagePercent === sp
                  ? "cursor-default border-button-1 bg-button-1/25"
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

          <PercentInput
            className="border bg-background focus-within:border-focus focus-within:bg-background focus-within:shadow-none"
            placeholder={
              slippagePercent.toFixed(2).at(-1)! === "0"
                ? slippagePercent.toFixed(1)
                : slippagePercent.toFixed(2)
            }
            value={value}
            onChange={onValueChange}
          />
        </div>
      </div>
    </Popover>
  );
}
