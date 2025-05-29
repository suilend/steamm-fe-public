import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";

import { ClassValue } from "clsx";

import { Token } from "@suilend/sui-fe";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TokenLogoProps {
  className?: ClassValue;
  token?: Token;
  size: number;
}

export default function TokenLogo({ className, token, size }: TokenLogoProps) {
  const loadedCoinTypesRef = useRef<string[]>([]);
  const [hasErrorMap, setHasErrorMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!token) return;
    if (!token.iconUrl || token.iconUrl === "" || token.iconUrl === "TODO")
      return;

    if (loadedCoinTypesRef.current.includes(token.coinType)) return;
    loadedCoinTypesRef.current.push(token.coinType);

    const image = new Image();
    image.src = token.iconUrl;
    image.onerror = () => {
      console.error(
        `Failed to load iconUrl for ${token.coinType}: ${token.iconUrl}`,
      );
      setHasErrorMap((prev) => ({ ...prev, [token.coinType]: true }));
    };
  }, [token]);

  if (!token)
    return (
      <Skeleton
        className={cn("shrink-0 rounded-[50%] border", className)}
        style={{ width: size, height: size }}
      />
    );
  if (
    !token.iconUrl ||
    token.iconUrl === "" ||
    token.iconUrl === "TODO" ||
    hasErrorMap[token.coinType]
  )
    return (
      <div
        className={cn("shrink-0 rounded-[50%] border", className)}
        style={{ width: size, height: size }}
      />
    );
  return (
    <NextImage
      className={cn("shrink-0 rounded-[50%]", className)}
      src={token.iconUrl}
      alt={`${token.symbol} logo`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      quality={100}
      onError={() =>
        setHasErrorMap((prev) => ({ ...prev, [token.coinType]: true }))
      }
    />
  );
}
