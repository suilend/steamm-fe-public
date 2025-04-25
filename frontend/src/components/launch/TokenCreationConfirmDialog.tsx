import { useState } from "react";

import BigNumber from "bignumber.js";
import { CheckCircleIcon, TriangleAlert, XCircle } from "lucide-react";

import Dialog from "@/components/Dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { CreateTokenParams } from "@/hooks/useCreateToken";

interface TokenCreationConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tokenParams: CreateTokenParams;
  estimatedGasFee?: string;
  isSubmitting?: boolean;
}

export default function TokenCreationConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  tokenParams,
  isSubmitting = false,
}: TokenCreationConfirmDialogProps) {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  // Format the initial supply with proper decimals
  const formattedSupply = new BigNumber(tokenParams.initialSupply).toFormat();

  return (
    <Dialog
      rootProps={{
        open: isOpen,
        onOpenChange: (open) => !open && !isSubmitting && onClose(),
      }}
      headerProps={{
        title: {},
        description:
          "Review the details of your token before creating it on the blockchain.",
      }}
      footerProps={{
        className:
          "flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-2 px-2 w-full",
        children: (
          <>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] w-full sm:min-h-[36px] sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!hasAcknowledged || isSubmitting}
              className="min-h-[44px] w-full min-w-[100px] bg-button-1 text-button-1-foreground transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50 sm:min-h-[36px] sm:w-auto"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="border-t-transparent mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                "Create Token"
              )}
            </Button>
          </>
        ),
      }}
    >
      <div className="space-y-4 px-1 py-2">
        <div className="space-y-3">
          <div className="flex flex-col justify-between gap-1 pb-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-muted-foreground text-sm font-medium">
              Token Name
            </span>
            <span className="break-all text-foreground">
              {tokenParams.name}
            </span>
          </div>

          <div className="flex flex-col justify-between gap-1 pb-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-muted-foreground text-sm font-medium">
              Symbol
            </span>
            <span className="text-foreground">{tokenParams.symbol}</span>
          </div>

          <div className="flex flex-col justify-between gap-1 pb-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-muted-foreground text-sm font-medium">
              Initial Supply
            </span>
            <span className="text-foreground">{formattedSupply}</span>
          </div>

          <div className="flex flex-col justify-between gap-1 pb-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-muted-foreground text-sm font-medium">
              Decimals
            </span>
            <span className="text-foreground">{tokenParams.decimals}</span>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-x-2 gap-y-4">
          <div className="flex items-center gap-2">
            {tokenParams.isMintable ? (
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-success" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0 text-error" />
            )}
            <span className="text-sm">Mintable</span>
          </div>

          <div className="flex items-center gap-2">
            {tokenParams.isBurnable ? (
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-success" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0 text-error" />
            )}
            <span className="text-sm">Burnable</span>
          </div>

          <div className="flex items-center gap-2">
            {tokenParams.isPausable ? (
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-success" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0 text-error" />
            )}
            <span className="text-sm">Pausable</span>
          </div>

          <div className="flex items-center gap-2">
            {tokenParams.isUpgradeable ? (
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-success" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0 text-error" />
            )}
            <span className="text-sm">Upgradeable</span>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-col justify-between gap-2 pb-2 sm:flex-row sm:items-center">
          <span className="text-muted-foreground text-sm font-medium">
            Estimated Gas Fee
          </span>
          <span className="text-foreground">~0.15 SUI</span>
        </div>

        <div className="text-sm rounded-md border border-warning bg-card p-3 text-secondary-foreground sm:p-4">
          <p className="flex flex-wrap items-start gap-3 sm:items-center">
            <TriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning sm:mt-0" />
            <span>
              This action will create a new token on the Sui blockchain. This
              operation cannot be undone.
            </span>
          </p>
        </div>

        <div className="flex items-start gap-3 pt-4 sm:items-center">
          <Switch
            id="acknowledge"
            checked={hasAcknowledged}
            onCheckedChange={setHasAcknowledged}
            className="mt-0.5 sm:mt-0"
          />
          <Label
            htmlFor="acknowledge"
            className="text-sm cursor-pointer leading-normal"
          >
            I understand that I am creating a new token and will be responsible
            for its management
          </Label>
        </div>
      </div>
    </Dialog>
  );
}
