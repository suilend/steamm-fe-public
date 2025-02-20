import { PropsWithChildren } from "react";

import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface TagProps extends PropsWithChildren {
  className?: ClassValue;
  labelClassName?: ClassValue;
}

export default function Tag({ className, labelClassName, children }: TagProps) {
  return (
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
  );
}
