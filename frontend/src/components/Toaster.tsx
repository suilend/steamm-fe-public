import { CSSProperties } from "react";

import { AlertTriangle, Check, Info } from "lucide-react";

import styles from "@/components/Toaster.module.scss";
import { Toaster as ToasterComponent } from "@/components/ui/sonner";
import useBreakpoint from "@/hooks/useBreakpoint";
import { cn } from "@/lib/utils";

export default function Toaster() {
  const { md } = useBreakpoint();

  return (
    <ToasterComponent
      toastOptions={{
        classNames: {
          toast: cn(
            "bg-secondary text-foreground border !border-border gap-1 py-3 px-3 flex flex-col items-start justify-start rounded-md",
            styles.toast,
          ),
          content: "gap-1.5",
          icon: cn("absolute top-3.5 left-3 w-4 h-4 m-0", styles.icon),
          title: "px-6 text-foreground text-p2 font-sans font-normal",
          description:
            "text-secondary-foreground text-p3 font-sans font-normal",
        },
        style: {
          "--toast-close-button-start": "auto",
          "--toast-close-button-transform": "none",
        } as CSSProperties,
      }}
      gap={2 * 4}
      icons={{
        success: <Check className="text-success" />,
        info: <Info className="text-secondary-foreground" />,
        error: <AlertTriangle className="text-error" />,
      }}
      style={{
        right: md ? 24 : 16,
        bottom: md ? 24 : 16,
      }}
      duration={100000}
    />
  );
}
