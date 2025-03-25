import { useState } from "react";

import { ChevronDown, ChevronUp } from "lucide-react";

import Popover from "@/components/Popover";
import { cn } from "@/lib/utils";

interface SelectPopoverProps {
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
}

export default function SelectPopover({
  options,
  value,
  onChange,
}: SelectPopoverProps) {
  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const Chevron = isOpen ? ChevronUp : ChevronDown;

  return (
    <Popover
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      contentProps={{
        align: "end",
        maxWidth: 280,
      }}
      trigger={
        <button className="group flex h-10 w-full flex-row items-center justify-between gap-2 rounded-md border bg-card px-3">
          <p
            className={cn(
              "!text-p2 transition-colors",
              isOpen
                ? "text-foreground"
                : "text-secondary-foreground group-hover:text-foreground",
            )}
          >
            {options.find((option) => option.id === value)?.name}
          </p>
          <Chevron
            className={cn(
              "-ml-0.5 h-4 w-4 shrink-0 transition-colors",
              isOpen
                ? "text-foreground"
                : "text-secondary-foreground group-hover:text-foreground",
            )}
          />
        </button>
      }
    >
      <div className="flex w-full flex-col gap-1">
        {options.map((option) => (
          <button
            key={option.id}
            className={cn(
              "group flex h-10 w-full flex-row items-center rounded-md border px-3 transition-colors",
              option.id === value
                ? "cursor-default bg-button-1"
                : "hover:bg-border",
            )}
            onClick={() => {
              onChange(option.id);
              setIsOpen(false);
            }}
          >
            <p
              className={cn(
                "!text-p2 transition-colors",
                option.id === value
                  ? "text-button-1-foreground"
                  : "text-secondary-foreground group-hover:text-foreground",
              )}
            >
              {option.name}
            </p>
          </button>
        ))}
      </div>
    </Popover>
  );
}
