import {
  CSSProperties,
  PropsWithChildren,
  ReactElement,
  SVGProps,
  cloneElement,
} from "react";

import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

export interface TitleWithIconProps extends PropsWithChildren {
  className?: ClassValue;
  style?: CSSProperties;
  icon?: ReactElement<SVGProps<SVGSVGElement>>;
}

export default function TitleWithIcon({
  className,
  style,
  icon,
  children,
}: TitleWithIconProps) {
  return (
    <p
      className={cn(
        "flex flex-row items-center gap-2.5 !text-h3 text-foreground",
        className,
      )}
      style={style}
    >
      {icon &&
        cloneElement(icon, {
          className: "w-4 h-4 shrink-0",
        })}
      {children}
    </p>
  );
}
