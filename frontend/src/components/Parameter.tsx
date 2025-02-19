import { PropsWithChildren } from "react";

import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface ParameterProps extends PropsWithChildren {
  className?: ClassValue;
  label?: string;
  isHorizontal?: boolean;
}

export default function Parameter({
  className,
  label,
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
      {label && <p className="text-p2 text-secondary-foreground">{label}</p>}
      {children}
    </div>
  );
}
