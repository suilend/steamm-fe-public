import SteammLogo from "@/components/SteammLogo";
import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/utils";

interface SteammCreateTokenBadgeProps {
  isSmall?: boolean;
  isLarge?: boolean;
}

export default function SteammCreateTokenBadge({
  isSmall,
  isLarge,
}: SteammCreateTokenBadgeProps) {
  return (
    <Tooltip title="Created on STEAMM">
      <div
        className={cn(
          "flex shrink-0 flex-row items-center justify-center rounded-full border border-button-1 bg-button-1/25",
          isSmall ? "h-3.5 w-3.5" : isLarge ? "h-6 w-6" : "h-4 w-4",
        )}
      >
        <SteammLogo size={isSmall ? 8 : isLarge ? 14 : 10} />
      </div>
    </Tooltip>
  );
}
