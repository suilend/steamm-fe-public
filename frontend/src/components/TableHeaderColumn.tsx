import { CSSProperties, PropsWithChildren } from "react";

import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

export enum SortDirection {
  ASC = "asc",
  DESC = "desc",
}

type HeaderColumnProps<Column, SortableColumn> = PropsWithChildren & {
  id: Column | SortableColumn;
  sortState?: { column: SortableColumn; direction: SortDirection };
  toggleSortByColumn?: (column: SortableColumn) => void;
  style?: CSSProperties;
};

export default function HeaderColumn<Column, SortableColumn>({
  id,
  sortState,
  toggleSortByColumn,
  style,
  children,
}: HeaderColumnProps<Column, SortableColumn>) {
  const isSortable = toggleSortByColumn !== undefined;

  return (
    <div
      className={cn(
        "flex h-full flex-row items-center",
        isSortable && "group cursor-pointer gap-1.5",
      )}
      onClick={
        isSortable ? () => toggleSortByColumn(id as SortableColumn) : undefined
      }
      style={style}
    >
      {sortState?.column === id &&
        (sortState.direction === SortDirection.DESC ? (
          <ArrowDown className="h-4 w-4 text-button-2-foreground" />
        ) : (
          <ArrowUp className="h-4 w-4 text-button-2-foreground" />
        ))}
      <p
        className={cn(
          "!text-p2 text-secondary-foreground transition-colors",
          sortState?.column === id
            ? "text-foreground"
            : "group-hover:text-foreground",
        )}
      >
        {children}
      </p>
    </div>
  );
}
