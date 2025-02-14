import Image from "next/image";

import { ClassValue } from "clsx";

import { Token } from "@suilend/frontend-sui";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TokenLogoProps {
  className?: ClassValue;
  token?: Token;
  size: number;
}

export default function TokenLogo({ className, token, size }: TokenLogoProps) {
  if (!token)
    return (
      <Skeleton
        className={cn("rounded-[50%]", className)}
        style={{ width: size, height: size }}
      />
    );
  if (!token.iconUrl || token.iconUrl === "" || token.iconUrl === "TODO")
    return (
      <div
        className={cn("rounded-[50%] bg-card", className)}
        style={{ width: size, height: size }}
      />
    );
  return (
    <Image
      className={cn("rounded-[50%]", className)}
      src={token.iconUrl}
      alt={`${token.symbol} logo`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      quality={100}
    />
  );
}
