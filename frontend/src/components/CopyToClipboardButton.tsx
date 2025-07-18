import { MouseEvent } from "react";

import { ClassValue } from "clsx";
import { Copy } from "lucide-react";

import { showErrorToast, showInfoToast } from "@suilend/sui-fe-next";

import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/utils";

interface CopyToClipboardButtonProps {
  className?: ClassValue;
  iconClassName?: ClassValue;
  value: string;
}

export default function CopyToClipboardButton({
  className,
  iconClassName,
  value,
}: CopyToClipboardButtonProps) {
  const copyToClipboard = async (e: MouseEvent) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(value.toString());
      showInfoToast("Copied to clipboard", {
        icon: <Copy className="text-secondary-foreground" />,
        description: value,
      });
    } catch (err) {
      showErrorToast("Failed to copy to clipboard", err as Error);
      console.error(err);
    }
  };

  return (
    <Tooltip title="Copy to clipboard">
      <button
        className={cn(
          "group/copy-to-clipboard flex h-5 w-5 flex-row items-center justify-center",
          className,
        )}
        onClick={copyToClipboard}
      >
        <Copy
          className={cn(
            "h-4 w-4 text-secondary-foreground transition-colors group-hover/copy-to-clipboard:text-foreground",
            iconClassName,
          )}
        />
      </button>
    </Tooltip>
  );
}
