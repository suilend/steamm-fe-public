import { ClassValue } from "clsx";

import Parameter from "@/components/Parameter";
import TextInput from "@/components/TextInput";
import { cn } from "@/lib/utils";

interface TokenBasicInfoProps {
  className?: ClassValue;
  name: string;
  onNameChange: (value: string) => void;
  symbol: string;
  onSymbolChange: (value: string) => void;
}

export default function TokenBasicInfo({
  className,
  name,
  onNameChange,
  symbol,
  onSymbolChange,
}: TokenBasicInfoProps) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <Parameter label="Token name">
        <TextInput
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter token name"
        />
      </Parameter>

      <Parameter label="Symbol">
        <TextInput
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value.toUpperCase())}
          placeholder="Enter token symbol"
        />
      </Parameter>
    </div>
  );
} 