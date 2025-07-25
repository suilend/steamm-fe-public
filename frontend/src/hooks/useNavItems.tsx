import { ADMIN_ADDRESS } from "@suilend/steamm-sdk";
import { useWalletContext } from "@suilend/sui-fe-next";

import {
  ADMIN_URL,
  CREATE_URL,
  LEADERBOARD_URL,
  POOL_URL_PREFIX,
  ROOT_URL,
  // SWAP_URL,
} from "@/lib/navigation";

type NavItem = {
  url: string;
  startsWithUrl?: string;
  title: string;
};

const useNavItems = (includePools: boolean = false) => {
  const { address } = useWalletContext();

  const NAV_ITEMS: NavItem[] = [
    includePools
      ? { url: ROOT_URL, title: "Pools", startsWithUrl: POOL_URL_PREFIX }
      : null,
    { url: CREATE_URL, title: "Create" },
    // { url: SWAP_URL, title: "Swap", startsWithUrl: SWAP_URL },
    { url: LEADERBOARD_URL, title: "Leaderboard" },
  ].filter(Boolean) as NavItem[];

  const ADMIN_NAV_ITEM: NavItem = {
    url: ADMIN_URL,
    title: "Admin",
  };

  const navItems = [...NAV_ITEMS];
  if (address === ADMIN_ADDRESS) navItems.push(ADMIN_NAV_ITEM);

  return navItems;
};

export default useNavItems;
