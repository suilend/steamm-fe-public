import { useEffect, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import { Minus } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { v4 as uuidv4 } from "uuid";

import { ADMIN_ADDRESS } from "@suilend/steamm-sdk";
import { PUBLISHED_AT } from "@suilend/steamm-sdk/_codegen/_generated/steamm";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import PercentInput from "@/components/PercentInput";
import SubmitButton from "@/components/SubmitButton";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { showSuccessTxnToast } from "@/lib/toasts";
import { cn } from "@/lib/utils";

interface FeeReceiverRow {
  id: string;
  address: string;
  weight: string;
}

export default function ConfigTab() {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData } = useLoadedAppContext();

  // Fee receivers
  const [feeReceiverRows, setFeeReceiverRows] = useState<FeeReceiverRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const feeReceivers = await suiClient.getDynamicFieldObject({
          parentId: steammClient.sdkOptions.packages.steamm.config!.registryId,
          name: {
            type: `${PUBLISHED_AT}::registry::FeeReceiversKey`,
            value: {
              dummy_field: false,
            },
          },
        });
        if (feeReceivers.error) {
          const rowId = uuidv4();
          setFeeReceiverRows([{ id: rowId, address: "", weight: "" }]);

          setTimeout(() => {
            document.getElementById(`address-${rowId}`)?.focus();
          });

          return;
        } else {
          // TODO
        }

        // const rows: FeeReceiverRow[] = feeReceivers.receivers.map(
        //   (receiver, index) => ({
        //     id: uuidv4(),
        //     address: receiver,
        //     weight: feeReceivers.weights[index].toString(),
        //   }),
        // );
      } catch (err) {
        console.error(err);
      }
    })();
  }, [suiClient, steammClient.sdkOptions.packages.steamm.config]);

  const onChange = (id: string, key: keyof FeeReceiverRow) => (value: string) =>
    setFeeReceiverRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );

  const removeRow = (id: string) => {
    setFeeReceiverRows((prev) => prev.filter((row) => row.id !== id));
  };

  const addRow = () => {
    const rowId = uuidv4();
    setFeeReceiverRows((prev) => [
      ...prev,
      { id: rowId, address: "", weight: "" },
    ]);

    setTimeout(() => {
      document.getElementById(`address-${rowId}`)?.focus();
    });
  };

  // Fee receivers - set
  const [isSettingFeeReceivers, setIsSettingFeeReceivers] =
    useState<boolean>(false);

  const setFeeReceivers = async () => {
    if (address !== ADMIN_ADDRESS) return;

    try {
      setIsSettingFeeReceivers(true);

      const transaction = new Transaction();

      transaction.moveCall({
        target: `${PUBLISHED_AT}::registry::set_fee_receivers`,
        typeArguments: [],
        arguments: [
          transaction.object(
            steammClient.sdkOptions.packages.steamm.config!.registryId,
          ),
          transaction.object(
            steammClient.sdkOptions.packages.steamm.config!.globalAdmin,
          ),
          transaction.pure.vector(
            "address",
            feeReceiverRows.map((r) => r.address),
          ),
          transaction.pure.vector(
            "u64",
            feeReceiverRows.map((r) => BigInt(r.weight)),
          ),
        ],
      });

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Set fee receivers", txUrl);
    } catch (err) {
      showErrorToast(
        "Failed to set fee receivers",
        err as Error,
        undefined,
        true,
      );
      console.error(err);
    } finally {
      setIsSettingFeeReceivers(false);
    }
  };

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3 rounded-md border p-4">
      <p className="text-p1 text-foreground">Fee receivers</p>

      {/* Table */}
      <div className="flex w-full flex-col gap-2">
        {feeReceiverRows.map((row, index) => (
          <div key={row.id} className="flex w-full flex-row gap-2">
            {/* Address */}
            <div className="flex flex-1 flex-col gap-2">
              {index === 0 && (
                <p className="text-p2 text-secondary-foreground">address</p>
              )}
              <div
                className={cn(
                  "w-full rounded-md bg-card/50 transition-colors focus-within:bg-card focus-within:shadow-[inset_0_0_0_1px_hsl(var(--focus))]",
                  "h-max",
                )}
              >
                <TextareaAutosize
                  id={`address-${row.id}`}
                  className={cn(
                    "block w-full min-w-0 !border-0 !bg-[transparent] px-3 py-2.5 !text-p2 text-foreground !shadow-none !outline-none placeholder:text-tertiary-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                    "h-auto max-h-32 min-h-10",
                  )}
                  value={row.address}
                  onChange={(e) => onChange(row.id, "address")(e.target.value)}
                  minRows={1}
                />
              </div>
            </div>

            {/* Weight */}
            <div className="flex w-[80px] flex-col gap-2 md:w-[120px]">
              {index === 0 && (
                <p className="text-p2 text-secondary-foreground">weight</p>
              )}
              <PercentInput
                inputId={`weight-${row.id}`}
                value={row.weight}
                onChange={onChange(row.id, "weight")}
                min={0}
                max={100}
              />
            </div>

            {/* Remove row */}
            <div className="flex flex-col gap-2">
              {index === 0 && (
                <p className="text-p2 text-secondary-foreground opacity-0">-</p>
              )}
              <Tooltip title="Remove row">
                <button
                  className="flex h-10 w-10 flex-row items-center justify-center rounded-md bg-button-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
                  disabled={feeReceiverRows.length < 2}
                  onClick={() => removeRow(row.id)}
                >
                  <Minus className="h-4 w-4 text-button-2-foreground" />
                </button>
              </Tooltip>
            </div>
          </div>
        ))}

        {/* Add row */}
        <div className="w-full pr-12">
          <button
            className="flex h-10 w-full flex-row items-center justify-center rounded-md bg-button-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
            onClick={() => addRow()}
          >
            <p className="text-p2 text-button-2-foreground">Add row</p>
          </button>
        </div>
      </div>

      {/* Submit */}
      <SubmitButton
        submitButtonState={{
          isLoading: isSettingFeeReceivers,
          isDisabled: address !== ADMIN_ADDRESS || isSettingFeeReceivers,
          title: "Save changes",
        }}
        onClick={setFeeReceivers}
      />
    </div>
  );
}
