import {
  CSSProperties,
  PropsWithChildren,
  ReactElement,
  cloneElement,
} from "react";

import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

export interface TitleWithIconProps extends PropsWithChildren {
  className?: ClassValue;
  style?: CSSProperties;
  icon?: ReactElement;
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
        "flex flex-row items-center gap-2 text-h2 uppercase",
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
