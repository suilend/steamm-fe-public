import { ClassValue } from "clsx";
import { useState } from "react";

import Parameter from "@/components/Parameter";
import TextInput from "@/components/TextInput";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { validateMaxSupply, formatTokenAmount, parseFormattedAmount } from "../TokenCreationForm/validation";

interface TokenAdvancedOptionsProps {
  className?: ClassValue;
  maxSupply: string;
  onMaxSupplyChange: (value: string) => void;
  isBurnable: boolean;
  onBurnableChange: (value: boolean) => void;
  isMintable: boolean;
  onMintableChange: (value: boolean) => void;
  isPausable: boolean;
  onPausableChange: (value: boolean) => void;
  isUpgradeable: boolean;
  onUpgradeableChange: (value: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
  initialSupply: string; // For validation against max supply
}

export default function TokenAdvancedOptions({
  className,
  maxSupply,
  onMaxSupplyChange,
  isBurnable,
  onBurnableChange,
  isMintable,
  onMintableChange,
  isPausable,
  onPausableChange,
  isUpgradeable,
  onUpgradeableChange,
  onBack,
  onSubmit,
  initialSupply,
}: TokenAdvancedOptionsProps) {
  // Validation state
  const [maxSupplyError, setMaxSupplyError] = useState("");
  const [isTouched, setIsTouched] = useState(false);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate max supply before submitting
    const error = validateMaxSupply(maxSupply, initialSupply);
    setMaxSupplyError(error || "");
    setIsTouched(true);
    
    if (!error) {
      onSubmit();
    }
  };

  // Handle blur event for max supply
  const handleMaxSupplyBlur = () => {
    setIsTouched(true);
    const error = validateMaxSupply(maxSupply, initialSupply);
    setMaxSupplyError(error || "");
  };

  // Handle change for max supply with formatting
  const handleMaxSupplyChange = (value: string) => {
    // Parse the input to remove formatting
    const parsedValue = parseFormattedAmount(value);
    onMaxSupplyChange(parsedValue);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex w-full flex-col gap-4", className)}>
      <Parameter label="Maximum Supply">
        <div className="flex flex-col gap-1 w-full">
          <TextInput
            value={maxSupply ? formatTokenAmount(maxSupply) : ""}
            onChange={handleMaxSupplyChange}
            placeholder="Enter maximum supply (optional)"
            onBlur={handleMaxSupplyBlur}
            className={maxSupplyError && isTouched ? "border-error" : ""}
          />
          {maxSupplyError && isTouched && (
            <p className="text-sm text-error">{maxSupplyError}</p>
          )}
          <p className="text-xs text-secondary-foreground">
            {isMintable 
              ? "Maximum tokens that can ever exist (leave empty for unlimited)"
              : "When 'Mintable' is off, max supply equals initial supply"}
          </p>
        </div>
      </Parameter>

      <Parameter label="Burnable">
        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <p className="text-base">Allow tokens to be burned (destroyed)</p>
          </div>
          <Switch
            checked={isBurnable}
            onCheckedChange={onBurnableChange}
          />
        </div>
      </Parameter>

      <Parameter label="Mintable">
        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <p className="text-base">Allow new tokens to be minted after initial creation</p>
          </div>
          <Switch
            checked={isMintable}
            onCheckedChange={(checked) => {
              onMintableChange(checked);
              // When turning off mintable, clear any max supply error since it equals initial supply
              if (!checked) {
                setMaxSupplyError("");
              } else {
                // Revalidate when turning on
                handleMaxSupplyBlur();
              }
            }}
          />
        </div>
      </Parameter>

      <Parameter label="Pausable">
        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <p className="text-base">Allow token transfers to be paused in emergency situations</p>
          </div>
          <Switch
            checked={isPausable}
            onCheckedChange={onPausableChange}
          />
        </div>
      </Parameter>

      <Parameter label="Upgradeable">
        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <p className="text-base">Allow the token contract to be upgraded in the future</p>
          </div>
          <Switch
            checked={isUpgradeable}
            onCheckedChange={onUpgradeableChange}
          />
        </div>
      </Parameter>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
        >
          <p className="text-p2 text-button-1-foreground">Next</p>
        </button>
      </div>
    </form>
  );
} 