import { BadgeCheck } from "lucide-react";

import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  isSmall?: boolean;
  isLarge?: boolean;
  tooltip?: string;
}

export default function VerifiedBadge({
  isSmall,
  isLarge,
  tooltip = "Verified asset pair",
}: VerifiedBadgeProps) {
  return (
    <Tooltip title={tooltip}>
      <BadgeCheck
        className={cn(
          "text-verified",
          isSmall ? "h-3.5 w-3.5" : isLarge ? "h-6 w-6" : "h-4 w-4",
        )}
      />
    </Tooltip>
  );
}
