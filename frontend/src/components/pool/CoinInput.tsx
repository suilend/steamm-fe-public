import { ClassValue } from "clsx";
import { Wallet } from "lucide-react";

import { formatToken, getToken } from "@suilend/frontend-sui";

import TokenLogo from "@/components/TokenLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

export const getCoinInputId = (coinType: string) => `coin-input-${coinType}`;

interface CoinInputProps {
  className?: ClassValue;
  autoFocus?: boolean;
  coinType: string;
  value?: string;
  onChange?: (value: string) => void;
  onBalanceClick?: () => void;
}

export default function CoinInput({
  className,
  autoFocus,
  coinType,
  value,
  onChange,
  onBalanceClick,
}: CoinInputProps) {
  const { appData, getBalance } = useLoadedAppContext();

  const isBalanceClickable = !!onBalanceClick && value !== undefined;

  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between gap-4 rounded-md border bg-input p-5 focus-within:border-focus",
        className,
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
          disabled={!isBalanceClickable}
        >
          <Wallet
            className={cn(
              "h-4 w-4 text-secondary-foreground",
              isBalanceClickable &&
                "transition-colors group-hover:text-foreground",
            )}
          />
          <p
            className={cn(
              "!text-p2 text-secondary-foreground",
              isBalanceClickable &&
                "transition-colors group-hover:text-foreground",
            )}
          >
            {formatToken(getBalance(coinType), { exact: false })}
          </p>
        </button>
      </div>

      {value === undefined ? (
        <Skeleton className="h-[42px] w-40" />
      ) : (
        <div className="flex-1">
          <input
            id={getCoinInputId(coinType)}
            className="h-[60px] w-full min-w-0 border-0 bg-[transparent] text-right text-h1 text-foreground placeholder:text-tertiary-foreground focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            autoFocus={autoFocus}
            type="number"
            placeholder="0"
            value={value}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={!onChange}
            onWheel={(e) => e.currentTarget.blur()}
            step="any"
          />
        </div>
      )}
    </div>
  );
}
