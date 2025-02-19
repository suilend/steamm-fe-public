import { CSSProperties } from "react";

import { getToken } from "@suilend/frontend-sui";

import TokenLogo from "@/components/TokenLogo";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

interface TokenLogosProps {
  coinTypes: string[];
  size: number;
  backgroundColor?: string;
}

export default function TokenLogos({
  coinTypes,
  size,
  backgroundColor,
}: TokenLogosProps) {
  const { appData } = useLoadedAppContext();

  const hasCoinMetadata = coinTypes.every(
    (coinType) => appData.coinMetadataMap[coinType],
  );

  return (
    <div
      className={cn(
        "flex shrink-0 flex-row",
        !hasCoinMetadata && "animate-pulse",
      )}
      style={
        {
          "--ml": `${size / 4}px`,
          "--bg-color": backgroundColor ?? "hsl(var(--background))",
        } as CSSProperties
      }
    >
      {coinTypes.map((coinType, index) => (
        <TokenLogo
          key={coinType}
          className={cn(
            index !== 0 &&
              "-ml-[var(--ml)] outline outline-1 outline-[var(--bg-color)]",
            !hasCoinMetadata ? "animate-none" : "bg-[var(--bg-color)]",
          )}
          token={getToken(coinType, appData.coinMetadataMap[coinType])}
          size={size}
        />
      ))}
    </div>
  );
}
