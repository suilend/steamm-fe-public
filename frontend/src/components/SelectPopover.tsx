import { useState } from "react";

import { ClassValue } from "clsx";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";

import { formatList } from "@suilend/sui-fe";

import Popover from "@/components/Popover";
import { cn } from "@/lib/utils";

export type SelectPopoverOption = {
  id: string;
  name: string;
  count?: number;
};

interface SelectPopoverProps {
  className?: ClassValue;
  align?: "start" | "end";
  options: SelectPopoverOption[];
  placeholder?: string;
  values: string[];
  onChange: (id: string) => void;
  isMultiSelect?: boolean;
  canClear?: boolean;
  onClear?: () => void;
}

export default function SelectPopover({
  className,
  align,
  options,
  placeholder,
  values,
  onChange,
  isMultiSelect,
  canClear,
  onClear,
}: SelectPopoverProps) {
  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const Chevron = isOpen ? ChevronUp : ChevronDown;

  return (
    <Popover
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      contentProps={{
        align: align ?? "end",
        maxWidth: 280,
      }}
      trigger={
        <button
          className={cn(
            "group/trigger flex h-10 w-full flex-row items-center justify-between gap-2 rounded-md border bg-card px-3",
            className,
          )}
        >
          <p
            className={cn(
              "!text-p2 transition-colors",
              isOpen
                ? "text-foreground"
                : cn(
                    values.length > 0
                      ? "text-foreground"
                      : "text-secondary-foreground group-hover/trigger:text-foreground",
                  ),
            )}
          >
            {values.length > 0
              ? formatList(
                  options
                    .filter((option) => values.includes(option.id))
                    .map((option) => option.name),
                )
              : placeholder}
          </p>
          {values.length > 0 && canClear && !!onClear ? (
            <button
              className="group -m-2 h-8 w-8 shrink-0 p-2"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                setIsOpen(false);
              }}
            >
              <X className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
            </button>
          ) : (
            <Chevron
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isOpen
                  ? "text-foreground"
                  : "text-secondary-foreground group-hover/trigger:text-foreground",
              )}
            />
          )}
        </button>
      }
    >
      <div className="flex w-full flex-col gap-1">
        {options.map((option) => (
          <button
            key={option.id}
            className={cn(
              "group flex h-10 w-full flex-row items-center justify-between rounded-md border px-3 transition-colors",
              values.includes(option.id)
                ? "cursor-default border-button-1 bg-button-1/25"
                : "hover:bg-border",
            )}
            onClick={() => {
              onChange(option.id);
              setIsOpen(false);
            }}
          >
            <div className="flex flex-row items-baseline gap-1.5">
              <p
                className={cn(
                  "!text-p2 transition-colors",
                  values.includes(option.id)
                    ? "text-foreground"
                    : "text-secondary-foreground group-hover:text-foreground",
                )}
              >
                {option.name}
              </p>
              {option.count !== undefined && (
                <p
                  className={cn(
                    "!text-p3 transition-colors",
                    values.includes(option.id)
                      ? "text-foreground/75"
                      : "text-tertiary-foreground group-hover:text-foreground/75",
                  )}
                >
                  {option.count}
                </p>
              )}
            </div>

            {isMultiSelect && values.includes(option.id) && (
              <Check className="h-4 w-4 shrink-0 text-foreground" />
            )}
          </button>
        ))}
      </div>
    </Popover>
  );
}
