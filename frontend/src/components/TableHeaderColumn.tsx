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
  titleEndDecorator?: string;
  style?: CSSProperties;
};

export default function HeaderColumn<Column, SortableColumn>({
  id,
  sortState,
  toggleSortByColumn,
  titleEndDecorator,
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

      <div className="flex shrink-0 flex-row items-baseline gap-1.5">
        <p
          className={cn(
            "!text-p2 text-secondary-foreground transition-colors",
            sortState?.column === id
              ? "text-button-2-foreground"
              : "group-hover:text-foreground",
          )}
        >
          {children}
        </p>
        {titleEndDecorator && (
          <p
            className={cn(
              "!text-p3 text-tertiary-foreground transition-colors",
              sortState?.column === id
                ? "text-button-2-foreground/75"
                : "group-hover:text-foreground/75",
            )}
          >
            {titleEndDecorator}
          </p>
        )}
      </div>
    </div>
  );
}
