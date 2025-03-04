import { CSSProperties } from "react";

import { getToken } from "@suilend/frontend-sui";

import SuilendLogo from "@/components/SuilendLogo";
import TokenLogo from "@/components/TokenLogo";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

interface TokenLogosProps {
  suilend?: boolean;
  coinTypes: string[];
  size: number;
  backgroundColor?: string;
}

export default function TokenLogos({
  suilend,
  coinTypes,
  size,
  backgroundColor,
}: TokenLogosProps) {
  const { appData } = useLoadedAppContext();

  const hasCoinMetadata = coinTypes.every(
    (coinType) => appData.coinMetadataMap[coinType],
  );

  if (!suilend && coinTypes.length === 0) return null;
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
      {suilend && <SuilendLogo size={size} />}
      {coinTypes.map((coinType, index) => (
        <TokenLogo
          key={coinType}
          className={cn(
            (suilend ? true : index !== 0) &&
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
