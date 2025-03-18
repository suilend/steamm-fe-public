import { CSSProperties, PropsWithChildren } from "react";

import { ArrowDown, ArrowUp } from "lucide-react";

import Tooltip from "@/components/Tooltip";
import { cn, hoverUnderlineClassName } from "@/lib/utils";

export enum SortDirection {
  ASC = "asc",
  DESC = "desc",
}

type HeaderColumnProps<Column, SortableColumn> = PropsWithChildren & {
  id: Column | SortableColumn;
  tooltip?: string;
  sortState?: { column: SortableColumn; direction: SortDirection };
  toggleSortByColumn?: (column: SortableColumn) => void;
  titleEndDecorator?: string;
  style?: CSSProperties;
};

export default function HeaderColumn<Column, SortableColumn>({
  id,
  tooltip,
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
        <Tooltip title={tooltip}>
          <p
            className={cn(
              "!text-p2 transition-colors",
              sortState?.column === id
                ? "text-button-2-foreground"
                : "text-secondary-foreground group-hover:text-foreground",
              tooltip &&
                cn(
                  sortState?.column === id
                    ? "decoration-button-2-foreground/50"
                    : "decoration-secondary-foreground/50",
                  hoverUnderlineClassName,
                ),
            )}
          >
            {children}
          </p>
        </Tooltip>
        {titleEndDecorator && (
          <p
            className={cn(
              "!text-p3 transition-colors",
              sortState?.column === id
                ? "text-button-2-foreground/75"
                : "text-tertiary-foreground group-hover:text-foreground/75",
            )}
          >
            {titleEndDecorator}
          </p>
        )}
      </div>
    </div>
  );
}
