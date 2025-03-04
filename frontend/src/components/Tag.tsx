import { PropsWithChildren } from "react";

import { ClassValue } from "clsx";

import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/utils";

interface TagProps extends PropsWithChildren {
  className?: ClassValue;
  labelClassName?: ClassValue;
  tooltip?: string;
}

export default function Tag({
  className,
  labelClassName,
  tooltip,
  children,
}: TagProps) {
  return (
    <Tooltip title={tooltip}>
      <div
        className={cn(
          "flex h-[22px] flex-row items-center rounded-[11px] bg-card px-2.5 transition-colors group-hover:bg-border",
          className,
        )}
      >
        <p
          className={cn(
            "!text-p3 text-secondary-foreground transition-colors group-hover:text-foreground",
            labelClassName,
          )}
        >
          {children}
        </p>
      </div>
    </Tooltip>
  );
}
