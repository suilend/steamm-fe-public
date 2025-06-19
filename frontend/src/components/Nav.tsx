import Link from "next/link";
import { useRouter } from "next/router";

import { RotateCw } from "lucide-react";

import ConnectWalletButton from "@/components/ConnectWalletButton";
import Container from "@/components/Container";
import Logo from "@/components/Logo";
import NavPopover from "@/components/NavPopover";
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
            className="flex w-full flex-row items-center justify-between gap-2"
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
                  const isSelected =
                    router.asPath.split("?")[0] === item.url ||
                    (item.startsWithUrl &&
                      router.asPath.startsWith(item.startsWithUrl));

                  return (
                    <Link
                      key={item.title}
                      className="group flex h-10 flex-row items-center gap-2"
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
            <div className="flex min-w-0 flex-row items-center gap-3">
              <div className="shrink-0 max-md:-mr-1 md:mr-3">
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
