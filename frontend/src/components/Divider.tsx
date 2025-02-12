import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface DividerProps {
  className?: ClassValue;
}

export default function Divider({ className }: DividerProps) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}
