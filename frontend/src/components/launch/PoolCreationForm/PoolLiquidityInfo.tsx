import { ClassValue } from "clsx";

import CoinInput from "@/components/CoinInput";
import Parameter from "@/components/Parameter";
import { cn } from "@/lib/utils";

interface PoolLiquidityInfoProps {
  className?: ClassValue;
  tokenAAmount: string;
  onTokenAAmountChange: (value: string) => void;
  tokenBAmount: string;
  onTokenBAmountChange: (value: string) => void;
}

export default function PoolLiquidityInfo({
  className,
  tokenAAmount,
  onTokenAAmountChange,
  tokenBAmount,
  onTokenBAmountChange,
}: PoolLiquidityInfoProps) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <Parameter label="Token A amount">
        <CoinInput
          value={tokenAAmount}
          onChange={(e) => onTokenAAmountChange(e.target.value)}
          placeholder="Enter Token A amount"
        />
      </Parameter>

      <Parameter label="Token B amount">
        <CoinInput
          value={tokenBAmount}
          onChange={(e) => onTokenBAmountChange(e.target.value)}
          placeholder="Enter Token B amount"
        />
      </Parameter>
    </div>
  );
} 