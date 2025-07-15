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
        title: { children: "Verify Ledger Hash" },
        showCloseButton: false,
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
