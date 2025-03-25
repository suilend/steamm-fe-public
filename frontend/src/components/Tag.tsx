import { PropsWithChildren, ReactNode } from "react";

import { ClassValue } from "clsx";

import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/utils";

interface TagProps extends PropsWithChildren {
  className?: ClassValue;
  labelClassName?: ClassValue;
  tooltip?: string;
  startDecorator?: ReactNode;
}

export default function Tag({
  className,
  labelClassName,
  tooltip,
  startDecorator,
  children,
}: TagProps) {
  return (
    <Tooltip title={tooltip}>
      <div
        className={cn(
          "flex h-5 flex-row items-center gap-1.5 rounded-[10px] bg-card px-2.5 transition-colors group-hover:bg-border",
          className,
        )}
      >
        {startDecorator}
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
