import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("block animate-pulse bg-card", className)} {...props} />
  );
}

export { Skeleton };
