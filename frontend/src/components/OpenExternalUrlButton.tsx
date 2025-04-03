import Link from "next/link";

import { ExternalLink, LucideIcon } from "lucide-react";

import Tooltip from "@/components/Tooltip";

interface OpenExternalUrlButtonProps {
  url: string;
  Icon?: LucideIcon;
  tooltip?: string;
}

export default function OpenExternalUrlButton({
  url,
  Icon,
  tooltip,
}: OpenExternalUrlButtonProps) {
  const Icon_ = Icon ?? ExternalLink;

  return (
    <Tooltip title={tooltip}>
      <Link
        className="group block flex h-5 w-5 flex-row items-center justify-center text-secondary-foreground transition-colors hover:text-foreground"
        href={url}
        target="_blank"
      >
        <Icon_ className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
      </Link>
    </Tooltip>
  );
}
