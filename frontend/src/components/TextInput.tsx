import { forwardRef } from "react";

import { ClassValue } from "clsx";
import TextareaAutosize from "react-textarea-autosize";

import { cn } from "@/lib/utils";

interface TextInputProps {
  className?: ClassValue;
  inputClassName?: ClassValue;
  autoFocus?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  isTextarea?: boolean;
  minRows?: number; // Only used if `isTextarea` is true
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      className,
      inputClassName,
      autoFocus,
      placeholder,
      value,
      onChange,
      onBlur,
      onFocus,
      isTextarea,
      minRows = 2,
    },
    ref,
  ) => {
    const Component = isTextarea ? TextareaAutosize : "input";
    const componentProps = isTextarea ? { minRows } : {};

    return (
      <div
        className={cn(
          "w-full rounded-md bg-card/75 transition-colors focus-within:bg-card focus-within:shadow-[inset_0_0_0_1px_hsl(var(--focus))]",
          isTextarea ? "h-max" : "h-10",
          className,
        )}
      >
        <Component
          ref={ref as any}
          autoFocus={autoFocus}
          className={cn(
            "block w-full min-w-0 !border-0 !bg-[transparent] px-3 py-2.5 !text-p2 text-foreground !shadow-none !outline-0 placeholder:text-tertiary-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            isTextarea ? "h-auto max-h-32 min-h-10" : "h-full",
            inputClassName,
          )}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onWheel={(e) => e.currentTarget.blur()}
          onBlur={onBlur}
          onFocus={onFocus}
          {...componentProps}
        />
      </div>
    );
  },
);
TextInput.displayName = "TextInput";

export default TextInput;
