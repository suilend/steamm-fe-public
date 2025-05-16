import { PropsWithChildren, ReactNode } from "react";

import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface BreakdownRowProps extends PropsWithChildren {
  valueClassName?: ClassValue;
  isLast?: boolean;
  labelEndDecorator?: string;
  value?: ReactNode;
}

export default function BreakdownRow({
  valueClassName,
  isLast,
  labelEndDecorator,
  value,
  children,
}: BreakdownRowProps) {
  return (
    <div className="flex flex-row items-start justify-between gap-4">
      <div className="flex flex-row items-stretch gap-2">
        <div className="relative -my-1 w-4">
          {!isLast && <div className="h-full w-px bg-tertiary-foreground" />}
          <div className="absolute left-0 top-0 h-1/2 w-full rounded-bl-md border-b border-l border-tertiary-foreground" />
        </div>

        <div className="flex shrink-0 flex-row items-baseline gap-1.5">
          <p className="flex flex-row items-center gap-2 text-p2 text-secondary-foreground">
            {children}
          </p>
          {labelEndDecorator && (
            <p className="text-p3 text-tertiary-foreground">
              {labelEndDecorator}
            </p>
          )}
        </div>
      </div>

      {value && (
        <p
          className={cn(
            "flex flex-col items-end text-right !text-p2 text-foreground",
            valueClassName,
          )}
        >
          {value}
        </p>
      )}
    </div>
  );
}
