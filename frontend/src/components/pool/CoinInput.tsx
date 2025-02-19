import { ClassValue } from "clsx";
import { Wallet } from "lucide-react";

import { formatToken, getToken } from "@suilend/frontend-sui";

import CoinPopover from "@/components/CoinPopover";
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
  onPopoverCoinClick?: (coinType: string) => void;
}

export default function CoinInput({
  className,
  autoFocus,
  coinType,
  value,
  onChange,
  onBalanceClick,
  onPopoverCoinClick,
}: CoinInputProps) {
  const { appData, getBalance } = useLoadedAppContext();

  const isBalanceClickable = !!onBalanceClick && value !== undefined;
  const hasPopover = !!onPopoverCoinClick;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-md bg-card/50 p-5 transition-colors",
        hasPopover ? "flex-row-reverse" : "flex-row",
        !!onChange &&
          "focus-within:bg-card focus-within:shadow-[inset_0_0_0_1px_hsl(var(--focus))]",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3",
          hasPopover ? "items-end" : "items-start",
        )}
      >
        {hasPopover ? (
          <div className="flex h-[28px] flex-row items-center">
            <CoinPopover coinType={coinType} onCoinClick={onPopoverCoinClick} />
          </div>
        ) : (
          <div className="flex h-[28px] flex-row items-center gap-2.5">
            <TokenLogo
              token={getToken(coinType, appData.coinMetadataMap[coinType])}
              size={28}
            />
            <p className="text-h3 text-foreground">
              {appData.coinMetadataMap[coinType].symbol}
            </p>
          </div>
        )}

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
        <div className="h-[60px] flex-1">
          <input
            id={getCoinInputId(coinType)}
            className={cn(
              "h-full w-full min-w-0 !border-0 !bg-[transparent] px-0 !text-h1 text-foreground !outline-0 placeholder:text-tertiary-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              hasPopover ? "text-left" : "text-right",
            )}
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
