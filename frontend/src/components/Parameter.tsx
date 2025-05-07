import { PropsWithChildren } from "react";

import { ClassValue } from "clsx";

import Tooltip from "@/components/Tooltip";
import { cn, hoverUnderlineClassName } from "@/lib/utils";

interface ParameterProps extends PropsWithChildren {
  className?: ClassValue;
  labelContainerClassName?: ClassValue;
  label?: string;
  labelTooltip?: string;
  labelEndDecorator?: string;
  isHorizontal?: boolean;
}

export default function Parameter({
  className,
  labelContainerClassName,
  label,
  labelTooltip,
  labelEndDecorator,
  isHorizontal,
  children,
}: ParameterProps) {
  return (
    <div
      className={cn(
        "flex w-full",
        isHorizontal ? "flex-row justify-between gap-4" : "flex-col gap-1",
        className,
      )}
    >
      {label && (
        <Tooltip title={labelTooltip}>
          <div
            className={cn(
              "flex shrink-0 flex-row items-baseline gap-1.5",
              labelContainerClassName,
            )}
          >
            <p
              className={cn(
                "text-p2 text-secondary-foreground",
                labelTooltip &&
                  cn(
                    "decoration-secondary-foreground/50",
                    hoverUnderlineClassName,
                  ),
              )}
            >
              {label}
            </p>
            {labelEndDecorator && (
              <p className="text-p3 text-tertiary-foreground">
                {labelEndDecorator}
              </p>
            )}
          </div>
        </Tooltip>
      )}

      {children}
    </div>
  );
}
