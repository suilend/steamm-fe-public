import { useState } from "react";

import { Settings } from "lucide-react";

import { EXPLORERS, ExplorerId, RPCS, RpcId } from "@suilend/sui-fe";
import { useSettingsContext } from "@suilend/sui-fe-next";

import Dialog from "@/components/Dialog";
import SelectPopover from "@/components/SelectPopover";
import TextInput from "@/components/TextInput";
import { cn } from "@/lib/utils";

export default function SettingsDialog() {
  const {
    rpc,
    setRpcId,
    setRpcUrl,
    explorer,
    setExplorerId,
    gasBudget,
    setGasBudget,
  } = useSettingsContext();

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Custom RPC URL
  const [customRpcUrl, setCustomRpcUrl] = useState<string>(
    rpc.id === RpcId.CUSTOM ? rpc.url : "",
  );

  return (
    <Dialog
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      trigger={
        <button className="group flex h-5 w-5 flex-row items-center justify-center">
          <Settings
            className={cn(
              "h-4 w-4 transition-colors",
              isOpen
                ? "text-foreground"
                : "text-secondary-foreground group-hover:text-foreground",
            )}
          />
        </button>
      }
      headerProps={{
        title: { icon: <Settings />, children: "Settings" },
      }}
      dialogContentInnerClassName="max-w-md"
    >
      {/* RPC */}
      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-row">
          <div className="flex h-10 flex-1 flex-row items-center">
            <p className="text-p2 text-secondary-foreground">RPC</p>
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <SelectPopover
              options={RPCS}
              values={[rpc.id]}
              onChange={(id) => setRpcId(id as RpcId)}
            />

            {rpc.id === RpcId.CUSTOM && (
              <TextInput
                className="border bg-background focus-within:border-focus focus-within:bg-background focus-within:shadow-none"
                autoFocus
                value={customRpcUrl}
                onChange={setCustomRpcUrl}
                onBlur={() => setRpcUrl(customRpcUrl)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Explorer */}
      <div className="flex flex-row items-center">
        <p className="flex-1 text-p2 text-secondary-foreground">Explorer</p>

        <div className="flex-1">
          <SelectPopover
            options={EXPLORERS}
            values={[explorer.id]}
            onChange={(id) => setExplorerId(id as ExplorerId)}
          />
        </div>
      </div>

      {/* Gas budget */}
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-1 flex-col">
          <p className="text-p2 text-secondary-foreground">Gas budget</p>
          <p className="text-p3 text-tertiary-foreground">
            Leave blank for auto
          </p>
        </div>

        <div className="relative flex-1">
          <div className="relative z-[1] h-10 w-full rounded-md border bg-background transition-colors focus-within:border-focus">
            <input
              className="h-full w-full min-w-0 !border-0 !bg-[transparent] px-3 text-p1 text-foreground !shadow-none !outline-0 placeholder:text-tertiary-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              type="number"
              placeholder=""
              value={gasBudget}
              onChange={(e) => setGasBudget(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              step="any"
            />
          </div>

          <p className="pointer-events-none absolute right-3 top-1/2 z-[2] -translate-y-1/2 text-p2 text-secondary-foreground">
            SUI
          </p>
        </div>
      </div>
    </Dialog>
  );
}
