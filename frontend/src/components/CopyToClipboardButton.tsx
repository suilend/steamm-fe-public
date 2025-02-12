import { MouseEvent } from "react";

import { Copy } from "lucide-react";

import { showErrorToast, showInfoToast } from "@suilend/frontend-sui-next";

interface CopyToClipboardButtonProps {
  value: string;
}

export default function CopyToClipboardButton({
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
    <button
      className="group flex h-5 w-5 flex-row items-center justify-center"
      onClick={copyToClipboard}
    >
      <Copy className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
    </button>
  );
}
