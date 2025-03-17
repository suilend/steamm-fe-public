import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";

import { formatPercent } from "@suilend/frontend-sui";

import { cn } from "@/lib/utils";

interface PercentChangeProps {
  classname?: ClassValue;
  value: BigNumber;
}

export default function PercentChange({
  classname,
  value,
}: PercentChangeProps) {
  return (
    <p
      className={cn(
        "!text-p2",
        value.gte(0) ? "text-success" : "text-error",
        classname,
      )}
    >
      ({value.gte(0) ? "+" : "-"}
      {formatPercent(value.abs())})
    </p>
  );
}
