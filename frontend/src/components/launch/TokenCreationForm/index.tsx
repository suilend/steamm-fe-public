import { PropsWithChildren } from "react";

import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface TokenCreationFormProps extends PropsWithChildren {
  className?: ClassValue;
}

export default function TokenCreationForm({ className, children }: TokenCreationFormProps) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      {children}
    </div>
  );
} 