import { Wallet } from "lucide-react";

import { formatToken, getToken } from "@suilend/frontend-sui";

import TokenLogo from "@/components/TokenLogo";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

export const getCoinInputId = (coinType: string) => `coin-input-${coinType}`;

interface CoinInputProps {
  coinType: string;
  value: string;
  onChange: (value: string) => void;
  onBalanceClick: () => void;
  isLoading?: boolean;
}

export default function CoinInput({
  coinType,
  value,
  onChange,
  onBalanceClick,
  isLoading,
}: CoinInputProps) {
  const { appData, getBalance } = useLoadedAppContext();

  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between gap-4 rounded-md border bg-input p-5 focus-within:border-focus",
        isLoading && "animate-pulse",
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex h-[28px] flex-row items-center gap-2.5">
          <TokenLogo
            token={getToken(coinType, appData.poolCoinMetadataMap[coinType])}
            size={28}
          />
          <p className="text-h3 text-foreground">
            {appData.poolCoinMetadataMap[coinType].symbol}
          </p>
        </div>

        <button
          className="group flex w-max flex-row items-center gap-2"
          onClick={onBalanceClick}
        >
          <Wallet className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
          <p className="text-p2 text-secondary-foreground transition-colors group-hover:text-foreground">
            {formatToken(getBalance(coinType), { exact: false })}
          </p>
        </button>
      </div>

      <div className="flex-1">
        <input
          id={getCoinInputId(coinType)}
          className="h-[60px] w-full min-w-0 border-0 bg-[transparent] pl-0 text-right text-h1 text-foreground placeholder:text-tertiary-foreground focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          type="number"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onWheel={(e) => e.currentTarget.blur()}
          step="any"
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
