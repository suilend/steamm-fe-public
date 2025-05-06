import BigNumber from "bignumber.js";
import { Flame, Rocket } from "lucide-react";

import { formatToken } from "@suilend/frontend-sui";

import Dialog from "@/components/Dialog";
import { useLaunch } from "@/contexts/LaunchContext";

import Tooltip from "../Tooltip";

import { BURN_LP_TOOLTIP_CONTENT } from "./TokenBasicInfo";

export default function LaunchConfirmationDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const { config } = useLaunch();
  return (
    <Dialog
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      headerProps={{
        title: { icon: <Rocket />, children: "Confirm your token launch" },
      }}
      dialogContentInnerClassName="max-w-md"
    >
      <div className="flex w-full flex-col items-center gap-8 py-4">
        {config.iconUrl && (
          <img
            src={config.iconUrl}
            alt="Token icon"
            className="h-40 w-40 rounded-full"
          />
        )}
        <div className="flex w-full flex-col gap-2 rounded-md border py-2">
          <div className="flex justify-between px-4">
            <p className="text-p2 text-secondary-foreground">
              Estimated gas fee
            </p>
            <p className="text-p2 text-foreground">0.06 SUI</p>
          </div>
          <div className="h-px w-full bg-border"></div>
          <div className="flex justify-between px-4">
            <p className="text-p2 text-secondary-foreground">
              Amount sent to wallet
            </p>
            <p className="text-p2 text-foreground">
              {formatToken(BigNumber(config.initialSupply).times(0.9), {
                dp: 0,
              })}{" "}
              {config.tokenSymbol}
            </p>
          </div>
          <div className="h-px w-full bg-border"></div>
          <div className="flex justify-between px-4">
            <div className="flex flex-col gap-1">
              <p className="flex gap-1 text-p2 text-secondary-foreground">
                STEAMM pool will be created{" "}
              </p>
              {config.burnLP ? (
                <Tooltip content={BURN_LP_TOOLTIP_CONTENT}>
                  <p className="flex items-center gap-1 text-warning">
                    LP tokens burned
                    <Flame className="h-4 w-4 cursor-help text-warning" />
                  </p>
                </Tooltip>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-p2 text-foreground">
                {formatToken(BigNumber(config.initialSupply).times(0.1), {
                  dp: 0,
                })}{" "}
                {config.tokenSymbol}
              </p>
              <p className="text-p2 text-foreground">0.000000001 SUI</p>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
