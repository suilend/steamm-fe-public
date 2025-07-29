import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import { ChevronDown, ChevronUp, RotateCw } from "lucide-react";

import ConnectWalletButton from "@/components/ConnectWalletButton";
import Container from "@/components/Container";
import Logo from "@/components/Logo";
import NavPopover from "@/components/NavPopover";
import Popover from "@/components/Popover";
import SearchDialog from "@/components/SearchDialog";
import SettingsDialog from "@/components/SettingsDialog";
import { useUserContext } from "@/contexts/UserContext";
import useNavItems from "@/hooks/useNavItems";
import { ROOT_URL } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const NAV_HEIGHT = 64; // px

export default function Nav() {
  const router = useRouter();

  const { refresh } = useUserContext();

  // Items
  const navItems = useNavItems();

  // Menus
  const [isMenuOpenMap, setIsMenuOpenMap] = useState<Record<string, boolean>>(
    {},
  );

  // Refresh
  const refreshAll = () => {
    refresh();
  };

  return (
    <>
      <div
        className="relative z-[1] w-full shrink-0"
        style={{ height: `${NAV_HEIGHT}px` }}
      />

      <div
        className={cn(
          "fixed left-0 z-[2] border-b bg-background/60 backdrop-blur-lg",
        )}
        style={{
          right: "var(--removed-body-scroll-bar-size, 0)",
        }}
      >
        <Container>
          <div
            className="flex w-full flex-row items-center justify-between gap-4 md:gap-8"
            style={{ height: `${NAV_HEIGHT}px` }}
          >
            {/* Start */}
            <div className="flex shrink-0 flex-row items-center gap-12">
              <Link href={ROOT_URL}>
                <Logo />
              </Link>

              {/* Items */}
              <div className="flex flex-row items-center gap-8 max-lg:hidden">
                {navItems.map((item) => {
                  if ("items" in item) {
                    const isSelected = item.items.some(
                      (subItem) =>
                        router.asPath.split("?")[0] === subItem.url ||
                        (subItem.startsWithUrl &&
                          router.asPath.startsWith(subItem.startsWithUrl)),
                    );

                    return (
                      <Popover
                        key={item.title}
                        rootProps={{
                          open: isMenuOpenMap[item.title],
                          onOpenChange: (open) =>
                            setIsMenuOpenMap((prev) => ({
                              ...prev,
                              [item.title]: open,
                            })),
                        }}
                        trigger={
                          <div className="group flex h-8 cursor-pointer flex-row items-center gap-1">
                            <p
                              className={cn(
                                "transition-colors",
                                isMenuOpenMap[item.title] || isSelected
                                  ? "text-foreground"
                                  : "text-secondary-foreground group-hover:text-foreground",
                              )}
                            >
                              {item.title}
                            </p>
                            {isMenuOpenMap[item.title] ? (
                              <ChevronUp
                                className={cn("h-3 w-3", "text-foreground")}
                              />
                            ) : (
                              <ChevronDown
                                className={cn(
                                  "h-3 w-3",
                                  "text-muted-foreground group-hover:text-foreground",
                                )}
                              />
                            )}
                          </div>
                        }
                        contentProps={{
                          className: "w-max rounded-md bg-background py-2 px-4",
                          align: "center",
                        }}
                      >
                        <div className="flex flex-col gap-3">
                          {item.items.map((subItem) => {
                            const isSelected =
                              router.asPath.split("?")[0] === subItem.url ||
                              (subItem.startsWithUrl &&
                                router.asPath.startsWith(
                                  subItem.startsWithUrl,
                                ));

                            return (
                              <Link
                                key={subItem.title}
                                className="group flex flex-row items-center gap-2"
                                href={subItem.url}
                              >
                                <p
                                  className={cn(
                                    "!text-p2 transition-colors",
                                    isSelected
                                      ? "text-foreground"
                                      : "text-secondary-foreground group-hover:text-foreground",
                                  )}
                                >
                                  {subItem.title}
                                </p>
                              </Link>
                            );
                          })}
                        </div>
                      </Popover>
                    );
                  }

                  const isSelected =
                    router.asPath.split("?")[0] === item.url ||
                    (item.startsWithUrl &&
                      router.asPath.startsWith(item.startsWithUrl));

                  return (
                    <Link
                      key={item.title}
                      className="group flex h-8 flex-row items-center gap-2"
                      href={item.url}
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
            </div>

            {/* End */}
            <div className="flex min-w-0 flex-1 flex-row items-center justify-end gap-3">
              <div className="flex flex-1 flex-row justify-end max-md:-mr-1 md:mr-1">
                <SearchDialog />
              </div>

              <div className="flex shrink-0 flex-row items-center gap-2">
                <button
                  className="group flex h-5 w-5 flex-row items-center justify-center"
                  onClick={refreshAll}
                >
                  <RotateCw className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
                </button>
                <SettingsDialog />
              </div>

              <ConnectWalletButton />

              <div className="shrink-0 lg:hidden">
                <NavPopover />
              </div>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
