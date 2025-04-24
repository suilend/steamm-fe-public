import { useState } from "react";
import BigNumber from "bignumber.js";

import Dialog from "@/components/Dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { CreateTokenParams } from "@/hooks/useCreateToken";
import { CheckCircleIcon, XCircle, TriangleAlert } from "lucide-react";

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
        description: "Review the details of your token before creating it on the blockchain.",
      }}
      footerProps={{
        className: "flex flex-row items-center justify-end space-x-2",
        children: (
          <>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!hasAcknowledged || isSubmitting}
              className="min-w-[100px] bg-button-1 text-button-1-foreground transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
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
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-muted-foreground">Token Name</span>
          <span className="break-all">{tokenParams.name}</span>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-muted-foreground">Symbol</span>
          <span>{tokenParams.symbol}</span>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-muted-foreground">Initial Supply</span>
          <span>{formattedSupply}</span>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-muted-foreground">Decimals</span>
          <span>{tokenParams.decimals}</span>
        </div>

        <Separator className="my-3" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {tokenParams.isMintable ? (
              <CheckCircleIcon className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-error" />
            )}
            <span className="text-sm">Mintable</span>
          </div>
          
          <div className="flex items-center gap-2">
            {tokenParams.isBurnable ? (
              <CheckCircleIcon className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-error" />
            )}
            <span className="text-sm">Burnable</span>
          </div>
          
          <div className="flex items-center gap-2">
            {tokenParams.isPausable ? (
              <CheckCircleIcon className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-error" />
            )}
            <span className="text-sm">Pausable</span>
          </div>
          
          <div className="flex items-center gap-2">
            {tokenParams.isUpgradeable ? (
              <CheckCircleIcon className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-error" />
            )} <span className="text-sm">Upgradeable</span>
          </div>
        </div>

        <Separator className="my-3" />
        
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-muted-foreground">Estimated Gas Fee</span>
          <span>~0.15 SUI</span>
        </div>
        
        <div className="rounded-md bg-card border border-warning p-3 text-sm text-secondary-foreground">
          <p className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-warning" /> This action will create a new token on the Sui blockchain. This operation cannot be undone.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 pt-4">
          <Switch
            id="acknowledge"
            checked={hasAcknowledged}
            onCheckedChange={setHasAcknowledged}
          />
          <Label htmlFor="acknowledge" className="text-sm">
            I understand that I am creating a new token and will be responsible for its management
          </Label>
        </div>
      </div>
    </Dialog>
  );
} 