import { AlertTriangle } from "lucide-react";

import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/utils";

interface WarningBadgeProps {
  isSmall?: boolean;
  isLarge?: boolean;
  tooltip?: string;
}

export default function WarningBadge({
  isSmall,
  isLarge,
  tooltip = "Unverified asset pair",
}: WarningBadgeProps) {
  return (
    <Tooltip title={tooltip}>
      <AlertTriangle
        className={cn(
          "text-warning",
          isSmall ? "h-3.5 w-3.5" : isLarge ? "h-6 w-6" : "h-4 w-4",
        )}
      />
    </Tooltip>
  );
}
