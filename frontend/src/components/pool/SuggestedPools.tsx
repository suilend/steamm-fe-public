import MiniPoolsTable from "@/components/pool/MiniPoolsTable";
import Tag from "@/components/Tag";
import { Skeleton } from "@/components/ui/skeleton";
import { ParsedPool } from "@/lib/types";

interface SuggestedPoolsProps {
  id: string;
  title: string;
  pools?: ParsedPool[];
  tvlOnly?: boolean;
}

export default function SuggestedPools({
  id,
  title,
  pools,
  tvlOnly,
}: SuggestedPoolsProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-row items-center gap-3">
        <p className="text-h3 text-foreground">{title}</p>

        {pools === undefined ? (
          <Skeleton className="h-5 w-12" />
        ) : (
          <Tag>{pools.length}</Tag>
        )}
      </div>

      <MiniPoolsTable tableId={`${id}-table`} pools={pools} tvlOnly={tvlOnly} />
    </div>
  );
}
