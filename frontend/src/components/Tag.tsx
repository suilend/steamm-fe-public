import { PropsWithChildren } from "react";

export default function Tag({ children }: PropsWithChildren) {
  return (
    <div className="flex h-5 flex-row items-center rounded-[10px] bg-card px-2.5">
      <p className="text-p3 text-secondary-foreground">{children}</p>
    </div>
  );
}
