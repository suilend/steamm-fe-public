import { useWalletContext } from "@suilend/frontend-sui-next";
import { ADMIN_ADDRESS } from "@suilend/steamm-sdk";

import {
  ADMIN_URL,
  POINTS_URL,
  POOL_URL_PREFIX,
  PORTFOLIO_URL,
  ROOT_URL,
  SWAP_URL,
} from "@/lib/navigation";

type NavItem = {
  url: string;
  startsWithUrl?: string;
  title: string;
};

const useNavItems = () => {
  const { address } = useWalletContext();

  const NAV_ITEMS: NavItem[] = [
    { url: ROOT_URL, title: "Pools", startsWithUrl: POOL_URL_PREFIX },
    { url: PORTFOLIO_URL, title: "Portfolio" },
    { url: SWAP_URL, title: "Swap", startsWithUrl: SWAP_URL },
    { url: POINTS_URL, title: "Points" },
  ];
  const ADMIN_NAV_ITEM: NavItem = {
    url: ADMIN_URL,
    title: "Admin",
  };

  const navItems = [...NAV_ITEMS];
  if (address === ADMIN_ADDRESS) navItems.push(ADMIN_NAV_ITEM);

  return navItems;
};

export default useNavItems;
