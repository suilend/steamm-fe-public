import { ClassValue } from "clsx";

import Parameter from "@/components/Parameter";
import { cn } from "@/lib/utils";

interface PoolBasicInfoProps {
  className?: ClassValue;
}

export default function PoolBasicInfo({ className }: PoolBasicInfoProps) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <Parameter label="Fee tier">
        {/* Fee tier selection will be implemented in subsequent tasks */}
      </Parameter>
    </div>
  );
} 