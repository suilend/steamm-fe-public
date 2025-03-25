import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import { Menu, X } from "lucide-react";

import Popover from "@/components/Popover";
import useNavItems from "@/hooks/useNavItems";
import { cn } from "@/lib/utils";

export default function NavPopover() {
  const router = useRouter();

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const Icon = isOpen ? X : Menu;

  // Items
  const navItems = useNavItems();

  return (
    <Popover
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      contentProps={{
        align: "end",
        maxWidth: 280,
      }}
      trigger={
        <button className="group flex h-10 w-5 flex-row items-center justify-center">
          <Icon
            className={cn(
              "h-4 w-4 transition-colors",
              isOpen
                ? "text-foreground"
                : "text-secondary-foreground group-hover:text-foreground",
            )}
          />
        </button>
      }
    >
      <div className="flex w-full flex-col gap-3">
        {navItems.map((item) => {
          const isSelected =
            router.asPath.split("?")[0] === item.url ||
            (item.startsWithUrl &&
              router.asPath.startsWith(item.startsWithUrl));

          return (
            <Link
              key={item.title}
              className="group"
              href={item.url}
              onClick={() => setIsOpen(false)}
            >
              <p
                className={cn(
                  "!text-p2 transition-colors",
                  isSelected
                    ? "text-foreground"
                    : "text-secondary-foreground group-hover:text-foreground",
                )}
              >
                {item.title}
              </p>
            </Link>
          );
        })}
      </div>
    </Popover>
  );
}
