import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";
import { Wallet } from "lucide-react";

import { Token, formatToken, formatUsd } from "@suilend/frontend-sui";

import CoinPopover from "@/components/CoinPopover";
import TokenLogo from "@/components/TokenLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserContext } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

export const getCoinInputId = (coinType: string) => `coin-input-${coinType}`;

interface CoinInputProps {
  className?: ClassValue;
  autoFocus?: boolean;
  token?: Token;
  value?: string;
  usdValue?: BigNumber | "";
  onChange?: (value: string) => void;
  onBalanceClick?: () => void;
  popoverTokens?: Token[];
  onPopoverTokenClick?: (token: Token) => void;
}

export default function CoinInput({
  className,
  autoFocus,
  token,
  value,
  usdValue,
  onChange,
  onBalanceClick,
  popoverTokens,
  onPopoverTokenClick,
}: CoinInputProps) {
  const { getBalance } = useUserContext();

  const isReadOnly = onChange === undefined;

  const isBalanceClickable =
    token !== undefined && value !== undefined && onBalanceClick !== undefined;
  const hasPopover =
    popoverTokens !== undefined && onPopoverTokenClick !== undefined;

  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between gap-4 rounded-md px-5 py-4 transition-colors",
        !isReadOnly
          ? "bg-card/50 focus-within:bg-card focus-within:shadow-[inset_0_0_0_1px_hsl(var(--focus))]"
          : "shadow-[inset_0_0_0_1px_hsl(var(--border))]",
        className,
      )}
    >
      <div className="flex flex-1 flex-col items-start gap-1">
        {value === undefined ? (
          <Skeleton className="h-[36px] w-40 bg-border/50" />
        ) : (
          <input
            id={token ? getCoinInputId(token.coinType) : undefined}
            className="w-full min-w-0 !border-0 !bg-[transparent] px-0 text-left !text-h2 text-foreground !outline-0 placeholder:text-tertiary-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            autoFocus={autoFocus}
            type="number"
            placeholder="0"
            value={value}
            onChange={!isReadOnly ? (e) => onChange(e.target.value) : undefined}
            readOnly={isReadOnly}
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

      <div className="flex flex-col items-end gap-2">
        {hasPopover ? (
          <div className="flex h-[24px] flex-row items-center">
            <CoinPopover
              token={token}
              tokens={popoverTokens}
              onTokenClick={onPopoverTokenClick}
            />
          </div>
        ) : (
          <div className="flex h-[24px] flex-row items-center gap-2">
            <TokenLogo token={token!} size={24} />
            <p className="text-h3 text-foreground">{token!.symbol}</p>
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
            {token
              ? formatToken(getBalance(token.coinType), { exact: false })
              : "--"}
          </p>
        </button>
      </div>
    </div>
  );
}
