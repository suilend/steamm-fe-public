import { PropsWithChildren } from "react";

import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface PoolCreationFormProps extends PropsWithChildren {
  className?: ClassValue;
}

export default function PoolCreationForm({ className, children }: PoolCreationFormProps) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      {children}
    </div>
  );
} 