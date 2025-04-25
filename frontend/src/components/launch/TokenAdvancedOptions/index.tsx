import { useState } from "react";

import { ClassValue } from "clsx";

import Parameter from "@/components/Parameter";
import TextInput from "@/components/TextInput";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import {
  formatTokenAmount,
  parseFormattedAmount,
  validateMaxSupply,
} from "../TokenCreationForm/validation";

// Import useLaunchStorage hook
import useLaunchStorage from "@/hooks/useLaunchStorage";

interface TokenAdvancedOptionsProps {
  className?: ClassValue;
  maxSupply: string;
  setMaxSupply: (value: string) => void;
  isBurnable: boolean;
  setIsBurnable: (value: boolean) => void;
  isMintable: boolean;
  setIsMintable: (value: boolean) => void;
  isPausable: boolean;
  setIsPausable: (value: boolean) => void;
  isUpgradeable: boolean;
  setIsUpgradeable: (value: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export default function TokenAdvancedOptions({
  className,
  maxSupply,
  setMaxSupply,
  isBurnable,
  setIsBurnable,
  isMintable,
  setIsMintable,
  isPausable,
  setIsPausable,
  isUpgradeable,
  setIsUpgradeable,
  onBack,
  onSubmit,
  isLoading = false,
}: TokenAdvancedOptionsProps) {
  // Add the hook
  const { data: launchData } = useLaunchStorage();

  // Validation state
  const [maxSupplyError, setMaxSupplyError] = useState("");
  const [isTouched, setIsTouched] = useState(false);

  // Replace direct sessionStorage usage with hook data
  const getInitialSupply = () => {
    return launchData.initialSupply || "0";
  };

  const initialSupply = getInitialSupply();

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
    setMaxSupply(parsedValue);
  };

  // Display skeleton loader during loading state
  if (isLoading) {
    return (
      <div className={cn("flex w-full flex-col gap-4", className)}>
        {/* Max Supply Skeleton */}
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-4 w-56" />
        </div>

        {/* Burnable Toggle Skeleton */}
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-5 w-24" />
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <Skeleton className="h-6 w-60" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
        </div>

        {/* Mintable Toggle Skeleton */}
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-5 w-24" />
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <Skeleton className="w-70 h-6" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
        </div>

        {/* Pausable Toggle Skeleton */}
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-5 w-24" />
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <Skeleton className="h-6 w-80" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
        </div>

        {/* Upgradeable Toggle Skeleton */}
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-5 w-28" />
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <Skeleton className="w-75 h-6" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
        </div>

        {/* Buttons Skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("mt-1 flex w-full flex-col gap-5", className)}
    >
      <Parameter label="Maximum Supply">
        <div className="flex w-full flex-col gap-1">
          <TextInput
            value={maxSupply ? formatTokenAmount(maxSupply) : ""}
            onChange={handleMaxSupplyChange}
            placeholder="Enter maximum supply (optional)"
            onBlur={handleMaxSupplyBlur}
            className={cn(
              "h-12 sm:h-10",
              maxSupplyError && isTouched ? "border-error" : "",
            )}
            inputClassName="text-base sm:text-sm"
          />
          {maxSupplyError && isTouched && (
            <p className="text-sm mt-1 text-error">{maxSupplyError}</p>
          )}
          <p className="text-xs mt-1 text-secondary-foreground">
            {isMintable
              ? "Maximum tokens that can ever exist (leave empty for unlimited)"
              : "When 'Mintable' is off, max supply equals initial supply"}
          </p>
        </div>
      </Parameter>

      {/* Toggle options with better touch targets */}
      <div className="space-y-4">
        <Parameter label="Burnable">
          <div
            className="flex cursor-pointer flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:gap-0 sm:p-4"
            onClick={() => setIsBurnable(!isBurnable)}
          >
            <div className="space-y-1">
              <p className="text-sm sm:text-base leading-tight">
                Allow tokens to be burned (destroyed)
              </p>
              <p className="text-xs text-muted-foreground sm:hidden">
                Enable this to allow token destruction
              </p>
            </div>
            <Switch
              checked={isBurnable}
              onCheckedChange={setIsBurnable}
              className="h-6 w-11 data-[state=checked]:bg-success"
            />
          </div>
        </Parameter>

        <Parameter label="Mintable">
          <div
            className="flex cursor-pointer flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:gap-0 sm:p-4"
            onClick={() => {
              const newValue = !isMintable;
              setIsMintable(newValue);
              // When turning off mintable, clear any max supply error since it equals initial supply
              if (!newValue) {
                setMaxSupplyError("");
              } else {
                // Revalidate when turning on
                handleMaxSupplyBlur();
              }
            }}
          >
            <div className="space-y-1">
              <p className="text-sm sm:text-base leading-tight">
                Allow new tokens to be minted after initial creation
              </p>
              <p className="text-xs text-muted-foreground sm:hidden">
                Create additional tokens after launch
              </p>
            </div>
            <Switch
              checked={isMintable}
              onCheckedChange={(checked) => {
                setIsMintable(checked);
                // When turning off mintable, clear any max supply error since it equals initial supply
                if (!checked) {
                  setMaxSupplyError("");
                } else {
                  // Revalidate when turning on
                  handleMaxSupplyBlur();
                }
              }}
              className="h-6 w-11 data-[state=checked]:bg-success"
            />
          </div>
        </Parameter>

        <Parameter label="Pausable">
          <div
            className="flex cursor-pointer flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:gap-0 sm:p-4"
            onClick={() => setIsPausable(!isPausable)}
          >
            <div className="space-y-1">
              <p className="text-sm sm:text-base leading-tight">
                Allow token transfers to be paused in emergency situations
              </p>
              <p className="text-xs text-muted-foreground sm:hidden">
                Emergency pause functionality for security
              </p>
            </div>
            <Switch
              checked={isPausable}
              onCheckedChange={setIsPausable}
              className="h-6 w-11 data-[state=checked]:bg-success"
            />
          </div>
        </Parameter>

        <Parameter label="Upgradeable">
          <div
            className="flex cursor-pointer flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:gap-0 sm:p-4"
            onClick={() => setIsUpgradeable(!isUpgradeable)}
          >
            <div className="space-y-1">
              <p className="text-sm sm:text-base leading-tight">
                Allow the token contract to be upgraded in the future
              </p>
              <p className="text-xs text-muted-foreground sm:hidden">
                Enable future contract improvements
              </p>
            </div>
            <Switch
              checked={isUpgradeable}
              onCheckedChange={setIsUpgradeable}
              className="h-6 w-11 data-[state=checked]:bg-success"
            />
          </div>
        </Parameter>
      </div>

      {/* Button row with larger touch targets for mobile */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm min-h-[48px] w-full rounded-lg border border-border bg-background px-4 py-2 font-medium text-foreground hover:bg-secondary sm:min-h-[44px]"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50 sm:h-12"
        >
          <p className="text-p2 text-button-1-foreground">Next</p>
        </button>
      </div>
    </form>
  );
}
