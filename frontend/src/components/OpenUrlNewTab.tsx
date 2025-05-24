import Link from "next/link";

import { ClassValue } from "clsx";
import { ExternalLink, LucideIcon } from "lucide-react";

import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/utils";

interface OpenUrlNewTabProps {
  className?: ClassValue;
  url: string;
  Icon?: LucideIcon;
  tooltip?: string;
}

export default function OpenUrlNewTab({
  className,
  url,
  Icon,
  tooltip,
}: OpenUrlNewTabProps) {
  const Icon_ = Icon ?? ExternalLink;

  return (
    <Tooltip title={tooltip}>
      <Link
        className={cn(
          "group/open-url-new-tab block flex h-5 w-5 flex-row items-center justify-center text-secondary-foreground transition-colors hover:text-foreground",
          className,
        )}
        href={url}
        target="_blank"
      >
        <Icon_ className="h-4 w-4 text-secondary-foreground transition-colors group-hover/open-url-new-tab:text-foreground" />
      </Link>
    </Tooltip>
  );
}
