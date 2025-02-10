import Image from "next/image";
import React from "react";

import { ChevronDown, ChevronUp, WalletIcon } from "lucide-react";

import {
  Wallet,
  WalletType,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import useIsAndroid from "@suilend/frontend-sui-next/hooks/useIsAndroid";
import useIsiOS from "@suilend/frontend-sui-next/hooks/useIsiOS";

import Popover from "@/components/Popover";
import { cn } from "@/lib/utils";

interface WalletItemProps {
  wallet: Wallet;
}

function WalletItem({ wallet }: WalletItemProps) {
  const { connectWallet } = useWalletContext();

  const isiOS = useIsiOS();
  const isAndroid = useIsAndroid();

  const downloadUrl = isiOS
    ? wallet.downloadUrls?.iOS
    : isAndroid
      ? wallet.downloadUrls?.android
      : wallet.downloadUrls?.extension;

  const onClick = () => {
    if (wallet.type === WalletType.WEB || wallet.isInstalled) {
      connectWallet(wallet);
      return;
    }

    if (downloadUrl) window.open(downloadUrl, "_blank");
  };

  if (!(wallet.type === WalletType.WEB || wallet.isInstalled) && !downloadUrl)
    return null;
  return (
    <button
      className="group flex h-10 w-full flex-row items-center justify-between gap-2 rounded-md border px-3 transition-colors hover:border-foreground"
      onClick={onClick}
    >
      <div className="flex flex-row items-center gap-2">
        {wallet.iconUrl ? (
          <Image
            className="h-5 w-5"
            src={wallet.iconUrl}
            alt={`${wallet.name} logo`}
            width={20}
            height={20}
            quality={100}
          />
        ) : (
          <div className="h-5 w-5" />
        )}

        <p className="text-p2 text-secondary-foreground transition-colors group-hover:text-foreground">
          {wallet.name}
        </p>
      </div>

      {wallet.isInstalled && (
        <p className="text-p3 text-secondary-foreground transition-colors group-hover:text-foreground">
          Installed
        </p>
      )}
    </button>
  );
}

export default function ConnectWalletPopover() {
  const {
    isConnectWalletDropdownOpen,
    setIsConnectWalletDropdownOpen,
    wallets,
  } = useWalletContext();

  const Chevron = isConnectWalletDropdownOpen ? ChevronUp : ChevronDown;

  return (
    <Popover
      rootProps={{
        open: isConnectWalletDropdownOpen,
        onOpenChange: setIsConnectWalletDropdownOpen,
      }}
      contentProps={{
        align: "end",
        maxWidth: 280,
      }}
      trigger={
        <button
          className={cn(
            "flex h-10 flex-row items-center gap-2",
            isConnectWalletDropdownOpen
              ? "text-foreground"
              : "text-secondary-foreground transition-colors hover:text-foreground",
          )}
        >
          <WalletIcon size={16} />
          <p className="text-p2">Connect</p>
          <Chevron className="-ml-0.5 h-4 w-4" />
        </button>
      }
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex w-full flex-col gap-1">
          {wallets.map((wallet) => (
            <WalletItem key={wallet.name} wallet={wallet} />
          ))}
        </div>

        <p className="text-p3 text-secondary-foreground">
          {
            "Don't have a Sui wallet? Get started by trying one of the wallets above."
          }
        </p>
      </div>
    </Popover>
  );
}
