import { ArrowUpDown } from "lucide-react";

interface ReverseAssetsButtonProps {
  onClick: () => void;
}

export default function ReverseAssetsButton({
  onClick,
}: ReverseAssetsButtonProps) {
  return (
    <div className="relative z-[2] -my-[18px] flex h-8 w-8 rounded-[16px] bg-background">
      <button
        className="flex h-full w-full flex-row items-center justify-center rounded-[16px] bg-button-1 transition-colors hover:bg-button-1/80"
        onClick={onClick}
      >
        <ArrowUpDown className="h-4 w-4 text-button-1-foreground" />
      </button>
    </div>
  );
}
