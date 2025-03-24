import Link from "next/link";
import { useRouter } from "next/router";

import { RotateCw } from "lucide-react";

import { useWalletContext } from "@suilend/frontend-sui-next";
import { ADMIN_ADDRESS } from "@suilend/sdk";

import ConnectWalletButton from "@/components/ConnectWalletButton";
import Container from "@/components/Container";
import Logo from "@/components/Logo";
import SettingsDialog from "@/components/SettingsDialog";
import { useUserContext } from "@/contexts/UserContext";
import {
  ADMIN_URL,
  POOL_URL_PREFIX,
  PORTFOLIO_URL,
  ROOT_URL,
  SWAP_URL,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

const NAV_HEIGHT = 64; // px

type NavItem = {
  url: string;
  startsWithUrl?: string;
  title: string;
};

export default function Nav() {
  const router = useRouter();

  const { address } = useWalletContext();
  const { refresh } = useUserContext();

  // Items
  const NAV_ITEMS: NavItem[] = [
    { url: ROOT_URL, title: "Pools", startsWithUrl: POOL_URL_PREFIX },
    { url: PORTFOLIO_URL, title: "Portfolio" },
    { url: SWAP_URL, title: "Swap", startsWithUrl: SWAP_URL },
  ];
  const ADMIN_NAV_ITEM: NavItem = {
    url: ADMIN_URL,
    title: "Admin",
  };

  const navItems = [...NAV_ITEMS];
  if (address === ADMIN_ADDRESS) navItems.push(ADMIN_NAV_ITEM);

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
            className="flex w-full flex-row items-center justify-between gap-4"
            style={{ height: `${NAV_HEIGHT}px` }}
          >
            {/* Start */}
            <div className="flex flex-row items-center gap-4 md:gap-8">
              {/* Logo */}
              <Link className="w-max shrink-0" href={ROOT_URL}>
                <Logo />
              </Link>

              {/* Items */}
              <div className="flex flex-row gap-x-6 max-md:flex-wrap">
                {navItems.map((item) => {
                  const isSelected =
                    router.asPath === item.url ||
                    (item.startsWithUrl &&
                      router.asPath.startsWith(item.startsWithUrl));

                  const isDisabled = !item.url;
                  const Component = !isDisabled ? Link : "div";

                  return (
                    <Component
                      key={item.title}
                      className="group flex h-6 flex-row items-center gap-2 md:h-10"
                      href={item.url as string}
                    >
                      <p
                        className={cn(
                          isSelected
                            ? "text-foreground transition-colors"
                            : !isDisabled
                              ? "text-secondary-foreground group-hover:text-foreground"
                              : "text-tertiary-foreground",
                        )}
                      >
                        {item.title}
                      </p>
                    </Component>
                  );
                })}
              </div>
            </div>

            {/* End */}
            <div className="flex flex-row items-center gap-3">
              <div className="flex flex-row items-center gap-2">
                <button
                  className="group flex h-5 w-5 flex-row items-center justify-center"
                  onClick={refreshAll}
                >
                  <RotateCw className="h-4 w-4 text-secondary-foreground transition-colors group-hover:text-foreground" />
                </button>

                <SettingsDialog />
              </div>

              <ConnectWalletButton />
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
