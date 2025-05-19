import { useRef } from "react";

import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface PoolsSearchInputProps {
  value: string;
  onChange: (searchString: string) => void;
}

export default function PoolsSearchInput({
  value,
  onChange,
}: PoolsSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative z-[1] h-10 rounded-md bg-card transition-colors focus-within:bg-card focus-within:shadow-[inset_0_0_0_1px_hsl(var(--focus))] max-md:max-w-[180px] max-md:flex-1 md:w-[240px]">
      <Search className="pointer-events-none absolute left-3 top-3 z-[2] h-4 w-4 text-secondary-foreground" />
      {value !== "" && (
        <button
          className="group absolute right-1 top-1 z-[2] flex h-8 w-8 flex-row items-center justify-center"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
        >
          <X className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
        </button>
      )}
      <input
        ref={inputRef}
        className={cn(
          "relative z-[1] h-full w-full min-w-0 !border-0 !bg-[transparent] pl-9 text-p2 text-foreground !outline-0 placeholder:text-tertiary-foreground",
          value !== "" ? "pr-9" : "pr-3",
        )}
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
