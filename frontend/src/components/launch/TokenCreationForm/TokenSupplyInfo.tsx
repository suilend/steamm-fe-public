import { ClassValue } from "clsx";

import CoinInput from "@/components/CoinInput";
import Parameter from "@/components/Parameter";
import { cn } from "@/lib/utils";

interface TokenSupplyInfoProps {
  className?: ClassValue;
  supply: string;
  onSupplyChange: (value: string) => void;
}

export default function TokenSupplyInfo({
  className,
  supply,
  onSupplyChange,
}: TokenSupplyInfoProps) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <Parameter label="Initial supply">
        <CoinInput
          value={supply}
          onChange={(e) => onSupplyChange(e.target.value)}
          placeholder="Enter initial supply"
        />
      </Parameter>
    </div>
  );
} 