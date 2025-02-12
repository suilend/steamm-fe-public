import BigNumber from "bignumber.js";
import { ChevronDown, ChevronUp } from "lucide-react";

import { formatPercent } from "@suilend/frontend-sui";

import { cn } from "@/lib/utils";

interface PercentChangeProps {
  value: BigNumber;
}

export default function PercentChange({ value }: PercentChangeProps) {
  return (
    <div className="flex flex-row items-center gap-0.5">
      {value.gte(0) ? (
        <ChevronUp className="h-3 w-3 text-success" />
      ) : (
        <ChevronDown className="h-3 w-3 text-error" />
      )}
      <p
        className={cn("!text-p3", value.gte(0) ? "text-success" : "text-error")}
      >
        {formatPercent(value.abs())}
      </p>
    </div>
  );
}
