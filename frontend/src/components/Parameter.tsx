import { PropsWithChildren } from "react";

import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface ParameterProps extends PropsWithChildren {
  className?: ClassValue;
  label?: string;
  labelContainerClassName?: ClassValue;
  labelEndDecorator?: string;
  isHorizontal?: boolean;
}

export default function Parameter({
  className,
  label,
  labelContainerClassName,
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
        <div
          className={cn(
            "flex shrink-0 flex-row items-baseline gap-1.5",
            labelContainerClassName,
          )}
        >
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
