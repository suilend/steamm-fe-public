import Link from "next/link";
import { useState } from "react";

import PoolCard from "@/components/pool/PoolCard";
import Tag from "@/components/Tag";
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { ParsedPool } from "@/lib/types";

const COLLAPSED_POOL_COUNT = 2;

interface SuggestedPoolsProps {
  title: string;
  pools: ParsedPool[];
}

export default function SuggestedPools({ title, pools }: SuggestedPoolsProps) {
  // State
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const shownPools = isExpanded ? pools : pools.slice(0, COLLAPSED_POOL_COUNT);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-3">
          <p className="text-h3 text-foreground">{title}</p>
          <Tag>{pools.length}</Tag>
        </div>

        {pools.length > COLLAPSED_POOL_COUNT && (
          <button
            className="flex h-6 flex-row items-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <p className="text-p3 text-button-2-foreground">
              {isExpanded ? "Collapse" : "Expand"}
            </p>
          </button>
        )}
      </div>

      <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-2">
        {shownPools.map((_pool) => (
          <Link
            key={_pool.id}
            className="w-full"
            href={`${POOL_URL_PREFIX}/${_pool.id}`}
          >
            <PoolCard pool={_pool} />
          </Link>
        ))}
      </div>
    </div>
  );
}
