import { FormEvent, useState } from "react";

import { ClassValue } from "clsx";
import { InfoIcon } from "lucide-react";

import Parameter from "@/components/Parameter";
import TextInput from "@/components/TextInput";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  formatTokenAmount,
  parseFormattedAmount,
  validateDescription,
  validateTokenName,
  validateTokenSupply,
  validateTokenSymbol,
} from "../TokenCreationForm/validation";

interface TokenBasicInfoProps {
  className?: ClassValue;
  name: string;
  symbol: string;
  description: string;
  initialSupply: string;
  setName: (value: string) => void;
  setSymbol: (value: string) => void;
  setDescription: (value: string) => void;
  setInitialSupply: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

// Helper type for InfoTooltip
interface InfoTooltipProps {
  content: string;
}

export default function TokenBasicInfo({
  className,
  name,
  symbol,
  description,
  initialSupply,
  setName,
  setSymbol,
  setDescription,
  setInitialSupply,
  onSubmit,
  isLoading = false,
}: TokenBasicInfoProps) {
  // Validation state
  const [errors, setErrors] = useState({
    name: "",
    symbol: "",
    description: "",
    initialSupply: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    symbol: false,
    description: false,
    initialSupply: false,
  });

  // Real-time validation state
  const [isValid, setIsValid] = useState({
    name: false,
    symbol: false,
    description: true, // Description is optional, so default to true
    initialSupply: false,
  });

  // Handle blur events to validate on field exit
  const handleBlur = (field: keyof typeof errors) => {
    setTouched({ ...touched, [field]: true });
    validateField(field);
  };

  // Handle focus events - we'll call this manually since TextInput doesn't support onFocus prop
  const handleFocus = (field: keyof typeof errors) => {
    // Clear error message when the user focuses the field again
    if (touched[field] && errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Validate a specific field
  const validateField = (field: keyof typeof errors) => {
    let errorMessage = "";

    switch (field) {
      case "name":
        errorMessage = validateTokenName(name) || "";
        setIsValid((prev) => ({ ...prev, name: !errorMessage }));
        break;
      case "symbol":
        errorMessage = validateTokenSymbol(symbol) || "";
        setIsValid((prev) => ({ ...prev, symbol: !errorMessage }));
        break;
      case "description":
        errorMessage = validateDescription(description) || "";
        setIsValid((prev) => ({ ...prev, description: !errorMessage }));
        break;
      case "initialSupply":
        errorMessage = validateTokenSupply(initialSupply) || "";
        setIsValid((prev) => ({ ...prev, initialSupply: !errorMessage }));
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: errorMessage }));
    return !errorMessage;
  };

  // Validate all fields
  const validateAll = () => {
    const nameValid = validateField("name");
    const symbolValid = validateField("symbol");
    const descriptionValid = validateField("description");
    const initialSupplyValid = validateField("initialSupply");

    // Set all fields as touched
    setTouched({
      name: true,
      symbol: true,
      description: true,
      initialSupply: true,
    });

    return nameValid && symbolValid && descriptionValid && initialSupplyValid;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateAll()) {
      onSubmit();
    }
  };

  // Handle onChange for token supply with formatting
  const handleSupplyChange = (value: string) => {
    // Parse the input to remove formatting
    const parsedValue = parseFormattedAmount(value);
    setInitialSupply(parsedValue);

    // Validate on change for real-time feedback
    if (touched.initialSupply) {
      validateField("initialSupply");
    }
  };

  // Handle onChange for other inputs
  const handleNameChange = (value: string) => {
    setName(value);
    if (touched.name) validateField("name");
  };

  const handleSymbolChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setSymbol(upperValue);
    if (touched.symbol) validateField("symbol");
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (touched.description) validateField("description");
  };

  // Display skeleton loader during loading state
  if (isLoading) {
    return (
      <div className={cn("flex w-full flex-col gap-5", className)}>
        {/* Token Name Skeleton */}
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-12 w-full rounded-md sm:h-10" />
        </div>

        {/* Token Symbol Skeleton */}
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-12 w-full rounded-md sm:h-10" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Description Skeleton */}
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-12 w-full rounded-md sm:h-10" />
        </div>

        {/* Initial Supply Skeleton */}
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-12 w-full rounded-md sm:h-10" />
        </div>

        {/* Submit Button Skeleton */}
        <Skeleton className="mt-2 h-14 w-full rounded-md sm:h-12" />
      </div>
    );
  }

  // Helper function to render a tooltip with the info icon
  const InfoTooltip = ({ content }: InfoTooltipProps) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <InfoIcon className="text-muted-foreground h-4 w-4 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-xs">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex w-full flex-col gap-5", className)}
    >
      <Parameter label="Token Name">
        <div className="flex w-full flex-col gap-2">
          <div className="relative">
            <TextInput
              value={name}
              onChange={handleNameChange}
              placeholder="Enter token name"
              onBlur={() => handleBlur("name")}
              className={cn(
                "h-12 sm:h-10",
                touched.name && errors.name
                  ? "border-error focus:border-error"
                  : "",
                touched.name && isValid.name
                  ? "border-success focus:border-success"
                  : "",
              )}
              inputClassName="text-base sm:text-sm"
            />
            {touched.name && isValid.name && (
              <div className="absolute inset-y-0 right-3 flex items-center text-success">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          {errors.name && touched.name && (
            <p className="text-sm mt-1 text-error">{errors.name}</p>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <p className="text-xs text-secondary-foreground">
              The full name of your token
            </p>
            <InfoTooltip content="The full name of your token (e.g., 'Ethereum')" />
          </div>
        </div>
      </Parameter>

      <Parameter label="Token Symbol">
        <div className="flex w-full flex-col gap-2">
          <div className="relative">
            <TextInput
              value={symbol}
              onChange={handleSymbolChange}
              placeholder="Enter token symbol"
              onBlur={() => handleBlur("symbol")}
              className={cn(
                "h-12 sm:h-10",
                touched.symbol && errors.symbol
                  ? "border-error focus:border-error"
                  : "",
                touched.symbol && isValid.symbol
                  ? "border-success focus:border-success"
                  : "",
              )}
              inputClassName="text-base sm:text-sm"
            />
            {touched.symbol && isValid.symbol && (
              <div className="absolute inset-y-0 right-3 flex items-center text-success">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          {errors.symbol && touched.symbol && (
            <p className="text-sm mt-1 text-error">{errors.symbol}</p>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <p className="text-xs text-secondary-foreground">
              2-6 characters, uppercase letters, numbers, and $ only
            </p>
            <InfoTooltip content="The abbreviated token symbol (e.g., 'ETH'). This will display in wallets and exchanges." />
          </div>
        </div>
      </Parameter>

      <Parameter label="Description">
        <div className="flex w-full flex-col gap-2">
          <div className="relative">
            <TextInput
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Enter description (optional)"
              onBlur={() => handleBlur("description")}
              className={cn(
                "h-12 sm:h-10",
                touched.description && errors.description
                  ? "border-error focus:border-error"
                  : "",
                touched.description && isValid.description
                  ? "border-success focus:border-success"
                  : "",
              )}
              inputClassName="text-base sm:text-sm"
            />
            {touched.description && description && isValid.description && (
              <div className="absolute inset-y-0 right-3 flex items-center text-success">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          {errors.description && touched.description && (
            <p className="text-sm mt-1 text-error">{errors.description}</p>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <p className="text-xs text-secondary-foreground">
              Optional. A brief description of your token's purpose.
            </p>
            <InfoTooltip content="Optional. A brief description of your token's purpose or features." />
          </div>
        </div>
      </Parameter>

      <Parameter label="Initial Supply">
        <div className="flex w-full flex-col gap-2">
          <div className="relative">
            <TextInput
              value={initialSupply}
              onChange={handleSupplyChange}
              placeholder="Enter initial supply"
              onBlur={() => handleBlur("initialSupply")}
              className={cn(
                "h-12 sm:h-10",
                touched.initialSupply && errors.initialSupply
                  ? "border-error focus:border-error"
                  : "",
                touched.initialSupply && isValid.initialSupply
                  ? "border-success focus:border-success"
                  : "",
              )}
              inputClassName="text-base sm:text-sm"
            />
            {touched.initialSupply && isValid.initialSupply && (
              <div className="absolute inset-y-0 right-3 flex items-center text-success">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          {errors.initialSupply && touched.initialSupply && (
            <p className="text-sm mt-1 text-error">{errors.initialSupply}</p>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <p className="text-xs text-secondary-foreground">
              The total number of tokens that will be created initially
            </p>
            <InfoTooltip content="The total number of tokens to create initially. All will be sent to your wallet. You can mint more later if you enable the Mintable option." />
          </div>
        </div>
      </Parameter>

      <button
        type="submit"
        disabled={
          Object.values(errors).some((error) => error !== "") || isLoading
        }
        className={cn(
          "mt-4 flex h-12 w-full items-center justify-center rounded-md bg-button-1 px-4 py-3 text-p2 text-button-1-foreground hover:bg-button-1/80 disabled:cursor-not-allowed disabled:opacity-50",
          isLoading ? "cursor-wait" : "",
        )}
      >
        {isLoading ? <Skeleton className="h-5 w-5 rounded-full" /> : "Next"}
      </button>
    </form>
  );
}
