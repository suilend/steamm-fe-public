import { PropsWithChildren } from "react";

import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface ParameterProps extends PropsWithChildren {
  className?: ClassValue;
  label?: string;
  labelEndDecorator?: string;
  isHorizontal?: boolean;
}

export default function Parameter({
  className,
  label,
  labelEndDecorator,
  isHorizontal,
  children,
}: ParameterProps) {
  return (
    <div
      className={cn(
        "flex w-full",
        isHorizontal ? "flex-row justify-between" : "flex-col gap-1",
        className,
      )}
    >
      {label && (
        <div className="flex shrink-0 flex-row items-baseline gap-1.5">
          <p className="text-p2 text-secondary-foreground">{label}</p>
          {labelEndDecorator && (
            <p className="text-p3 text-tertiary-foreground">
              {labelEndDecorator}
            </p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
