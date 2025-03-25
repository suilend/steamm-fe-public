import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface DividerProps {
  className?: ClassValue;
}

export default function Divider({ className }: DividerProps) {
  return <div className={cn("h-px w-full shrink-0 bg-border", className)} />;
}
