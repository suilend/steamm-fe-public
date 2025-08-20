import { ADMIN_ADDRESS } from "@suilend/steamm-sdk";
import { useWalletContext } from "@suilend/sui-fe-next";

import {
  ADMIN_URL,
  AIRDROP_URL,
  CREATE_URL,
  FUN_URL,
  LEADERBOARD_URL,
  MINT_URL,
  POOL_URL_PREFIX,
  PORTFOLIO_URL,
  ROOT_URL,
  SWAP_URL,
} from "@/lib/navigation";

type NavItem = {
  url?: string;
  startsWithUrl?: string;
  title: string;
} & (
  | { url: string }
  | { items: (Omit<NavItem, "items" | "url"> & { url: string })[] }
);

const useNavItems = (includePools: boolean = false) => {
  const { address } = useWalletContext();

  const NAV_ITEMS: NavItem[] = [
    ...(includePools
      ? [{ url: ROOT_URL, title: "Pools", startsWithUrl: POOL_URL_PREFIX }]
      : []),
    { url: FUN_URL, title: "Fun" },
    { url: CREATE_URL, title: "Create" },
    {
      title: "Studio",
      items: [
        { url: AIRDROP_URL, title: "Airdrop" },
        { url: MINT_URL, title: "Mint" },
      ],
    },
    { url: SWAP_URL, title: "Swap", startsWithUrl: SWAP_URL },
    { url: PORTFOLIO_URL, title: "Portfolio" },
    ...(address === ADMIN_ADDRESS ? [{ url: ADMIN_URL, title: "Admin" }] : []),
    {
      title: "More",
      items: [{ url: LEADERBOARD_URL, title: "Leaderboard" }],
    },
  ];

  return NAV_ITEMS;
};

export default useNavItems;
