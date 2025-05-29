import Link from "next/link";

import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { ExternalLink } from "lucide-react";
import { Check, Loader2 } from "lucide-react";

import { useSettingsContext } from "@suilend/sui-fe-next";

import { cn } from "@/lib/utils";

interface StepProps {
  number: number;
  title: string;
  isCompleted?: boolean;
  isCurrent?: boolean;
  res?: SuiTransactionBlockResponse[];
}

export default function Step({
  number,
  title,
  isCurrent,
  isCompleted,
  res,
}: StepProps) {
  const { explorer } = useSettingsContext();

  return (
    <div className="flex w-full flex-row items-center gap-3">
      <div
        className={cn(
          "flex h-6 w-6 flex-row items-center justify-center rounded-full",
          isCompleted
            ? "bg-success"
            : isCurrent
              ? "bg-transparent"
              : "bg-border",
        )}
      >
        {isCompleted ? (
          <Check className="h-4 w-4 text-background" />
        ) : isCurrent ? (
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        ) : (
          <p className="text-p3 text-secondary-foreground">{number}</p>
        )}
      </div>

      <div className="flex flex-row items-center gap-2">
        <p
          className={cn(
            "!text-p1 transition-colors",
            isCurrent ? "text-foreground" : "text-secondary-foreground",
          )}
        >
          {title}
        </p>

        {isCompleted && (
          <div className="flex flex-row items-center gap-1">
            {(res ?? []).map((r, index) => (
              <Link
                key={index}
                className="block flex flex-col justify-center text-secondary-foreground transition-colors hover:text-foreground"
                href={explorer.buildTxUrl(r.digest)}
                target="_blank"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
