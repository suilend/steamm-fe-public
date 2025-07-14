import Dialog from "@/components/Dialog";

interface LedgerHashDialogProps {
  isOpen: boolean;
  ledgerHash: string;
}

export default function LedgerHashDialog({
  isOpen,
  ledgerHash,
}: LedgerHashDialogProps) {
  return (
    <Dialog
      rootProps={{ open: isOpen, onOpenChange: () => {} }}
      headerProps={{
        title: { children: "Using a Ledger?" },
        showCloseButton: false,
      }}
      dialogContentInnerClassName="max-w-md"
    >
      <div className="flex w-full flex-col gap-3">
        <p className="text-p2 text-secondary-foreground">
          If you are using a Ledger to sign the transaction, please verify the
          hash shown on your device matches the hash below.
        </p>
        <p className="break-all font-[monospace] text-p2 text-foreground">
          {ledgerHash}
        </p>
      </div>
    </Dialog>
  );
}
