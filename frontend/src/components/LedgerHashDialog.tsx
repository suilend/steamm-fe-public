import Dialog from "@/components/Dialog";

interface LedgerHashDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerHash: string;
}

export default function LedgerHashDialog({
  isOpen,
  onClose,
  ledgerHash,
}: LedgerHashDialogProps) {
  return (
    <Dialog
      rootProps={{
        open: isOpen,
        onOpenChange: (isOpen) => {
          if (!isOpen) onClose();
        },
      }}
      headerProps={{
        title: { children: "Verify Ledger Hash" },
      }}
      dialogContentInnerClassName="max-w-sm"
    >
      <p className="text-p2 text-secondary-foreground">
        Please verify the transaction hash shown on your Ledger matches the hash
        below.
      </p>
      <p className="break-all font-[monospace] text-p2 text-foreground">
        {ledgerHash}
      </p>
    </Dialog>
  );
}
