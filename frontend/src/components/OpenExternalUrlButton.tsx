import Link from "next/link";

import { ExternalLink } from "lucide-react";

interface OpenExternalUrlButtonProps {
  url: string;
}

export default function OpenExternalUrlButton({
  url,
}: OpenExternalUrlButtonProps) {
  return (
    <Link
      className="group block flex h-5 w-5 flex-row items-center justify-center text-secondary-foreground transition-colors hover:text-foreground"
      href={url}
      target="_blank"
    >
      <ExternalLink className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
    </Link>
  );
}
