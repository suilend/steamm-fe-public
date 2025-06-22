import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface PercentInputProps {
  className?: ClassValue;
  inputClassName?: ClassValue;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export default function PercentInput({
  className,
  inputClassName,
  placeholder,
  value,
  onChange,
}: PercentInputProps) {
  return (
    <div className="relative w-full">
      <div
        className={cn(
          "relative z-[1] h-10 w-full rounded-md bg-card/50 transition-colors focus-within:bg-card focus-within:shadow-[inset_0_0_0_1px_hsl(var(--focus))]",
          className,
        )}
      >
        <input
          className={cn(
            "h-full w-full min-w-0 !border-0 !bg-[transparent] pl-3 pr-8 !text-p2 text-foreground !shadow-none !outline-0 placeholder:text-tertiary-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            inputClassName,
          )}
          type="number"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onWheel={(e) => e.currentTarget.blur()}
          step="any"
        />
      </div>

      <p className="pointer-events-none absolute right-3 top-1/2 z-[2] -translate-y-1/2 text-p2 text-secondary-foreground">
        %
      </p>
    </div>
  );
}
