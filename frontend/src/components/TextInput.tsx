import { FocusEventHandler } from "react";

import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface TextInputProps {
  className?: ClassValue;
  inputClassName?: ClassValue;
  autoFocus?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
}

export default function TextInput({
  className,
  inputClassName,
  autoFocus,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
}: TextInputProps) {
  return (
    <div
      className={cn(
        "h-10 w-full rounded-md bg-card transition-colors focus-within:bg-card focus-within:shadow-[inset_0_0_0_1px_hsl(var(--focus))]",
        className,
      )}
    >
      <input
        autoFocus={autoFocus}
        className={cn(
          "h-full w-full min-w-0 !border-0 !bg-[transparent] px-3 !text-p2 text-foreground !outline-0 placeholder:text-tertiary-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          inputClassName,
        )}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onWheel={(e) => e.currentTarget.blur()}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </div>
  );
}
