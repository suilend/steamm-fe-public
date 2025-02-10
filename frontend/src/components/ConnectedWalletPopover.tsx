import Image from "next/image";
import React, { useState } from "react";

import { ChevronDown, ChevronUp, VenetianMask } from "lucide-react";

import { formatAddress } from "@suilend/frontend-sui";
import {
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import OpenOnExplorerButton from "@/components/OpenOnExplorerButton";
import Popover from "@/components/Popover";
import Tooltip from "@/components/Tooltip";
import { cn } from "@/lib/utils";

export default function ConnectedWalletPopover() {
  const { explorer } = useSettingsContext();
  const {
    isImpersonating,
    wallet,
    disconnectWallet,
    accounts,
    account,
    switchAccount,
    ...restWalletContext
  } = useWalletContext();
  const address = restWalletContext.address as string;

  const hasDisconnect = !isImpersonating;
  const hasWallets = !isImpersonating && accounts.length > 1;

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const Chevron = isOpen ? ChevronUp : ChevronDown;

  return (
    <Popover
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      contentProps={{
        align: "end",
        maxWidth: 280,
      }}
      trigger={
        <button className="flex h-10 min-w-0 max-w-40 flex-row items-center gap-2 text-foreground">
          {isImpersonating ? (
            <VenetianMask className="h-4 w-4 shrink-0" />
          ) : wallet?.iconUrl ? (
            <Image
              className="h-4 w-4 min-w-4 shrink-0"
              src={wallet.iconUrl}
              alt={`${wallet.name} logo`}
              width={16}
              height={16}
              quality={100}
            />
          ) : undefined}

          <p className="overflow-hidden text-ellipsis text-nowrap text-p2">
            {(!isImpersonating ? account?.label : undefined) ??
              formatAddress(address)}
          </p>
          <Chevron className="-ml-0.5 h-4 w-4" />
        </button>
      }
    >
      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full flex-col">
          <p className="text-p2 text-foreground">
            {(!isImpersonating ? account?.label : "Impersonating") ??
              "Connected"}
          </p>

          <div className="flex flex-row items-center gap-2">
            <Tooltip title={address}>
              <p className="text-p2 text-secondary-foreground">
                {formatAddress(address)}
              </p>
            </Tooltip>

            <CopyToClipboardButton value={address} />
            <OpenOnExplorerButton url={explorer.buildAddressUrl(address)} />
          </div>
        </div>

        {hasDisconnect && (
          <button
            className="group flex h-10 w-full flex-row items-center rounded-md border px-3 transition-colors hover:border-foreground"
            onClick={disconnectWallet}
          >
            <p className="text-p2 text-secondary-foreground transition-colors group-hover:text-foreground">
              Disconnect
            </p>
          </button>
        )}
        {hasWallets && (
          <div className="flex w-full flex-col gap-1">
            {accounts.map((a) => (
              <button
                key={a.address}
                className={cn(
                  "group flex h-10 w-full flex-row items-center justify-between rounded-md border px-3",
                  a.address === address
                    ? "cursor-default border-foreground"
                    : "transition-colors hover:border-foreground",
                )}
                onClick={
                  a.address === address ? undefined : () => switchAccount(a)
                }
              >
                <p
                  className={cn(
                    "shrink-0 !text-p2",
                    a.address === address
                      ? "text-foreground"
                      : "text-secondary-foreground transition-colors group-hover:text-foreground",
                  )}
                >
                  {formatAddress(a.address)}
                </p>

                {a.label && (
                  <p
                    className={cn(
                      "overflow-hidden text-ellipsis text-nowrap !text-p3",
                      a.address === address
                        ? "text-foreground"
                        : "text-secondary-foreground transition-colors group-hover:text-foreground",
                    )}
                  >
                    {a.label}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </Popover>
  );
}
