import Link from "next/link";
import { useRouter } from "next/router";

import ConnectWalletButton from "@/components/ConnectWalletButton";
import Container from "@/components/Container";
import Logo from "@/components/Logo";
import {
  ADMIN_URL,
  POOLS_URL,
  PORTFOLIO_URL,
  ROOT_URL,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

const NAV_HEIGHT = 64; // px

type NavItem = {
  url: string;
  title: string;
};

export const NAV_ITEMS: NavItem[] = [
  { url: ROOT_URL, title: "Swap" },
  { url: POOLS_URL, title: "Pools" },
  { url: PORTFOLIO_URL, title: "Portfolio" },
];
export const ADMIN_NAV_ITEM: NavItem = {
  url: ADMIN_URL,
  title: "Admin",
};

export default function Nav() {
  const router = useRouter();

  // Items
  const navItems = [...NAV_ITEMS];
  // if (admin.weightHookAdminCapId) navItems.push(ADMIN_NAV_ITEM);

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
            <div className="flex shrink-0 flex-row items-center gap-8">
              {/* Logo */}
              <Link href={ROOT_URL} className="w-max">
                <Logo />
              </Link>

              {/* Items */}
              <div className="flex flex-row gap-6">
                {navItems.map((item) => {
                  const isSelected =
                    router.pathname.replace("[[...slug]]", "") === item.url;
                  const isDisabled = !item.url;
                  const Component = !isDisabled ? Link : "div";

                  return (
                    <Component
                      href={item.url as string}
                      key={item.title}
                      className="group flex h-10 flex-row items-center gap-2"
                    >
                      <p
                        className={cn(
                          isSelected
                            ? "text-foreground"
                            : !isDisabled
                              ? "text-secondary-foreground transition-colors group-hover:text-foreground"
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
            <div className="flex min-w-0 flex-row items-center gap-2">
              <ConnectWalletButton />
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
