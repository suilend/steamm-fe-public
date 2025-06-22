import { ReactNode, forwardRef, useEffect, useRef } from "react";

import BigNumber from "bignumber.js";
import { ClassValue } from "clsx";
import { Wallet } from "lucide-react";
import mergeRefs from "merge-refs";

import { Token, formatToken, formatUsd } from "@suilend/sui-fe";

import TokenSelectionDialog from "@/components/swap/TokenSelectionDialog";
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
  maxAmountDecorator?: ReactNode;
  maxAmount?: BigNumber;
  onMaxAmountClick?: () => void;
  tokens?: Token[];
  onSelectToken?: (token: Token) => void;
}

const CoinInput = forwardRef<HTMLInputElement, CoinInputProps>(
  (
    {
      className,
      autoFocus,
      token,
      value,
      usdValue,
      onChange,
      maxAmountDecorator,
      maxAmount,
      onMaxAmountClick,
      tokens,
      onSelectToken,
    },
    ref,
  ) => {
    const { getBalance } = useUserContext();

    const isReadOnly = onChange === undefined;

    const isMaxAmountClickable =
      token !== undefined &&
      value !== undefined &&
      onMaxAmountClick !== undefined;
    const hasDialog = tokens !== undefined && onSelectToken !== undefined;

    // Autofocus
    const inputRef = useRef<HTMLInputElement>(null);
    const mergedRef = mergeRefs(ref, inputRef);
    useEffect(() => {
      if (autoFocus) inputRef.current?.focus();
    }, [autoFocus]);

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
              ref={mergedRef}
              id={token ? getCoinInputId(token.coinType) : undefined}
              className="w-full min-w-0 !border-0 !bg-[transparent] px-0 text-left !text-h2 text-foreground !shadow-none !outline-none placeholder:text-tertiary-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              autoFocus={autoFocus}
              type="number"
              placeholder="0"
              value={value}
              onChange={
                !isReadOnly ? (e) => onChange(e.target.value) : undefined
              }
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
          {hasDialog ? (
            <div className="flex h-[24px] flex-row items-center">
              <TokenSelectionDialog
                token={token}
                tokens={tokens}
                onSelectToken={onSelectToken}
              />
            </div>
          ) : (
            <div className="flex h-[24px] flex-row items-center gap-2">
              <TokenLogo token={token!} size={24} />
              <p className="text-h3 text-foreground">{token!.symbol}</p>
            </div>
          )}

          <button
            className={cn(
              "flex w-max flex-row items-center gap-2",
              isMaxAmountClickable && "group",
            )}
            onClick={onMaxAmountClick}
            disabled={!isMaxAmountClickable}
          >
            {maxAmountDecorator ?? (
              <Wallet className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
            )}
            <p className="text-p2 text-secondary-foreground transition-colors group-hover:text-foreground">
              {token
                ? formatToken(maxAmount ?? getBalance(token.coinType), {
                    exact: false,
                  })
                : "--"}
            </p>
          </button>
        </div>
      </div>
    );
  },
);
CoinInput.displayName = "CoinInput";

export default CoinInput;
