import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";
import { Wallet } from "lucide-react";

import { formatToken, formatUsd, getToken } from "@suilend/frontend-sui";

import CoinPopover from "@/components/CoinPopover";
import TokenLogo from "@/components/TokenLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useLoadedUserContext } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

export const getCoinInputId = (coinType: string) => `coin-input-${coinType}`;

interface CoinInputProps {
  className?: ClassValue;
  autoFocus?: boolean;
  coinType: string;
  value?: string;
  usdValue?: BigNumber | "";
  onChange?: (value: string) => void;
  onBalanceClick?: () => void;
  onPopoverCoinClick?: (coinType: string) => void;
}

export default function CoinInput({
  className,
  autoFocus,
  coinType,
  value,
  usdValue,
  onChange,
  onBalanceClick,
  onPopoverCoinClick,
}: CoinInputProps) {
  const { appData } = useLoadedAppContext();
  const { getBalance } = useLoadedUserContext();

  const isBalanceClickable = !!onBalanceClick && value !== undefined;
  const hasPopover = !!onPopoverCoinClick;

  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between gap-4 rounded-md bg-card/50 p-5 transition-colors",
        !!onChange &&
          "focus-within:bg-card focus-within:shadow-[inset_0_0_0_1px_hsl(var(--focus))]",
        className,
      )}
    >
      <div className="flex h-[61px] flex-1 flex-col items-start gap-1">
        {value === undefined ? (
          <Skeleton className="w-40 flex-1 bg-border/50" />
        ) : (
          <input
            id={getCoinInputId(coinType)}
            className="min-h-0 w-full min-w-0 flex-1 !border-0 !bg-[transparent] px-0 text-left !text-h1 text-foreground !outline-0 placeholder:text-tertiary-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            autoFocus={autoFocus}
            type="number"
            placeholder="0"
            value={value}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={!onChange}
            onWheel={(e) => e.currentTarget.blur()}
            step="any"
          />
        )}

        {usdValue === undefined ? (
          <Skeleton className="h-[21px] w-16 bg-border/50" />
        ) : (
          <p className="text-left !text-p2 text-tertiary-foreground">
            {formatUsd(new BigNumber(usdValue || 0))}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-3">
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
    </div>
  );
}
