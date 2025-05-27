import { BadgeCheck } from "lucide-react";

import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  isSmall?: boolean;
  isLarge?: boolean;
}

export default function VerifiedBadge({
  isSmall,
  isLarge,
}: VerifiedBadgeProps) {
  return (
    <Tooltip title="Verified asset pair">
      <BadgeCheck
        className={cn(
          "text-verified",
          isSmall ? "h-3.5 w-3.5" : isLarge ? "h-6 w-6" : "h-4 w-4",
        )}
      />
    </Tooltip>
  );
}
