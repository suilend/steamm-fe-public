import Link from "next/link";
import { useState } from "react";

import { ClassValue } from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";

import PoolCard from "@/components/pool/PoolCard";
import Tag from "@/components/Tag";
import { Skeleton } from "@/components/ui/skeleton";
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { ParsedPool } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SuggestedPoolsProps {
  containerClassName?: ClassValue;
  title: string;
  pools?: ParsedPool[];
  collapsedPoolCount?: number;
}

export default function SuggestedPools({
  containerClassName,
  title,
  pools,
  collapsedPoolCount = 2,
}: SuggestedPoolsProps) {
  // State
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const Chevron = isExpanded ? ChevronUp : ChevronDown;

  const shownPools =
    pools === undefined
      ? undefined
      : isExpanded
        ? pools
        : pools.slice(0, collapsedPoolCount);

  return (
    <div className="flex w-full flex-col gap-4">
      <div
        className={cn(
          "flex w-full flex-row items-center justify-between",
          pools !== undefined &&
            pools.length > collapsedPoolCount &&
            "cursor-pointer",
        )}
        onClick={
          pools !== undefined && pools.length > collapsedPoolCount
            ? () => setIsExpanded((prev) => !prev)
            : undefined
        }
      >
        <div className="flex flex-row items-center gap-3">
          <p className="text-h3 text-foreground">{title}</p>

          {pools === undefined ? (
            <Skeleton className="h-5 w-12" />
          ) : (
            <Tag>{pools.length}</Tag>
          )}
        </div>

        {pools !== undefined && pools.length > collapsedPoolCount && (
          <Chevron className="-mr-1 h-5 w-5 text-foreground" />
        )}
      </div>

      {(shownPools === undefined || shownPools.length > 0) && (
        <div
          className={cn("grid w-full grid-cols-2 gap-1", containerClassName)}
        >
          {shownPools === undefined
            ? Array.from({ length: collapsedPoolCount }).map((_, index) => (
                <Skeleton key={index} className="h-[87px] w-full" />
              ))
            : shownPools.map((_pool) => (
                <Link
                  key={_pool.id}
                  className="w-full"
                  href={`${POOL_URL_PREFIX}/${_pool.id}`}
                >
                  <PoolCard pool={_pool} />
                </Link>
              ))}
        </div>
      )}
    </div>
  );
}
