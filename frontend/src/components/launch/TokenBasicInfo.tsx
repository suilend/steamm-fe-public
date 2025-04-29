import { ChangeEvent, useState } from "react";

import { ChevronDown, ChevronUp, InfoIcon, Upload } from "lucide-react";

import Parameter from "@/components/Parameter";
import TextInput from "@/components/TextInput";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LaunchConfig } from "@/contexts/LaunchContext";
import { cn } from "@/lib/utils";

import {
  fileToBase64,
  parseFormattedAmount,
  validateDescription,
  validateTokenDecimals,
  validateTokenIcon,
  validateTokenName,
  validateTokenSupply,
  validateTokenSymbol,
} from "./validation";

interface TokenBasicInfoProps {
  config: LaunchConfig;
  setConfig: (value: LaunchConfig) => void;
  onSubmit: () => void;
}

// Helper type for InfoTooltip
interface InfoTooltipProps {
  content: string;
}

export default function TokenBasicInfo({
  config,
  setConfig,
  onSubmit,
}: TokenBasicInfoProps) {
  const {
    tokenName,
    tokenSymbol,
    tokenDescription,
    initialSupply,
    tokenDecimals,
  } = config;

  // State for icon upload
  const [iconFile, setIconFile] = useState<File | null>(null);

  // State for advanced options collapse
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({
    name: "",
    symbol: "",
    description: "",
    initialSupply: "",
    decimals: "",
    icon: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    symbol: false,
    description: false,
    initialSupply: false,
    decimals: false,
    icon: false,
  });

  // Real-time validation state
  const [isValid, setIsValid] = useState({
    name: false,
    symbol: false,
    description: true, // Description is optional, so default to true
    initialSupply: false,
    decimals: true, // Default to true since we'll use a default value
    icon: true, // Icon is optional, so default to true
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
        errorMessage = validateTokenName(tokenName) || "";
        setIsValid((prev) => ({ ...prev, name: !errorMessage }));
        break;
      case "symbol":
        errorMessage = validateTokenSymbol(tokenSymbol) || "";
        setIsValid((prev) => ({ ...prev, symbol: !errorMessage }));
        break;
      case "description":
        errorMessage = validateDescription(tokenDescription) || "";
        setIsValid((prev) => ({ ...prev, description: !errorMessage }));
        break;
      case "initialSupply":
        errorMessage = validateTokenSupply(initialSupply) || "";
        setIsValid((prev) => ({ ...prev, initialSupply: !errorMessage }));
        break;
      case "decimals":
        errorMessage = validateTokenDecimals(tokenDecimals) || "";
        setIsValid((prev) => ({ ...prev, decimals: !errorMessage }));
        break;
      case "icon":
        errorMessage = validateTokenIcon(iconFile) || "";
        setIsValid((prev) => ({ ...prev, icon: !errorMessage }));
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
    const decimalsValid = validateField("decimals");
    const iconValid = validateField("icon");

    // Set all fields as touched
    setTouched({
      name: true,
      symbol: true,
      description: true,
      initialSupply: true,
      decimals: true,
      icon: true,
    });

    return (
      nameValid &&
      symbolValid &&
      descriptionValid &&
      initialSupplyValid &&
      decimalsValid &&
      iconValid
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateAll()) {
      onSubmit();
    }
  };

  // Handle onChange for token supply with formatting
  const handleSupplyChange = (value: string) => {
    // Parse the input to remove formatting
    const parsedValue = parseFormattedAmount(value);
    setConfig({ ...config, initialSupply: parsedValue });

    // Validate on change for real-time feedback
    if (touched.initialSupply) {
      validateField("initialSupply");
    }
  };

  // Handle onChange for token decimals
  const handleDecimalsChange = (value: string) => {
    // Only allow integer values
    const parsedValue = parseInt(value, 10);

    // Only update if it's a valid number
    if (!isNaN(parsedValue) || value === "") {
      setConfig({ ...config, tokenDecimals: value === "" ? 9 : parsedValue });
    }

    if (touched.decimals) {
      validateField("decimals");
    }
  };

  // Handle onChange for other inputs
  const handleNameChange = (value: string) => {
    setConfig({ ...config, tokenName: value });
    if (touched.name) validateField("name");
  };

  const handleSymbolChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setConfig({ ...config, tokenSymbol: upperValue });
    if (touched.symbol) validateField("symbol");
  };

  const handleDescriptionChange = (value: string) => {
    setConfig({ ...config, tokenDescription: value });
    if (touched.description) validateField("description");
  };

  // Handle icon file selection
  const handleIconChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    setIconFile(file);

    // If an icon file was uploaded, convert it to base64 and update the config
    if (file) {
      try {
        const base64Icon = await fileToBase64(file);
        setConfig({
          ...config,
          iconUrl: `data:${file.type};base64,${base64Icon}`,
          iconFileName: file.name,
        });
      } catch (error) {
        console.error("Failed to convert icon to base64:", error);
        setErrors((prev) => ({
          ...prev,
          icon: "Failed to process image file",
        }));
        return;
      }
    }

    // Validate the selected file
    setTouched((prev) => ({ ...prev, icon: true }));
    if (file) {
      const errorMessage = validateTokenIcon(file) || "";
      setErrors((prev) => ({ ...prev, icon: errorMessage }));
      setIsValid((prev) => ({ ...prev, icon: !errorMessage }));
    }
  };

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

  // Toggle advanced options visibility
  const toggleAdvancedOptions = () => {
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  console.log("config", config);

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="mb-4 text-h1 text-foreground">Configure your token</h1>
      <Parameter label="Token Name">
        <div className="flex w-full flex-col gap-2">
          <div className="relative">
            <TextInput
              onFocus={() => handleFocus("name")}
              value={tokenName}
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
              value={tokenSymbol}
              onChange={handleSymbolChange}
              placeholder="Enter token symbol"
              onFocus={() => handleFocus("symbol")}
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

      <Parameter label="Token Icon">
        <div className="flex w-full flex-col gap-2">
          <div className="relative">
            <div
              className={cn(
                "flex h-20 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed hover:bg-background/50",
                touched.icon && errors.icon ? "border-error" : "border-border",
                (touched.icon && isValid.icon && iconFile) || config.iconUrl
                  ? "border-success"
                  : "",
              )}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleIconChange}
                className="hidden"
                id="icon-upload"
              />
              <label
                htmlFor="icon-upload"
                className="flex h-full w-full cursor-pointer flex-col items-center justify-center"
              >
                {config.iconUrl || iconFile ? (
                  <div className="flex items-center space-x-2">
                    <img
                      src={config.iconUrl ?? URL.createObjectURL(iconFile!)}
                      alt="Token icon preview"
                      className="h-10 w-10 overflow-hidden rounded-full object-contain"
                    />
                    <span className="text-sm text-foreground">
                      {config.iconFileName ?? iconFile?.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-1">
                    <Upload className="text-muted-foreground h-6 w-6" />
                    <span className="text-sm text-muted-foreground">
                      Upload icon (optional)
                    </span>
                  </div>
                )}
              </label>
            </div>
          </div>
          {errors.icon && touched.icon && (
            <p className="text-sm mt-1 text-error">{errors.icon}</p>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <p className="text-xs text-secondary-foreground">
              JPG, PNG, or SVG, max 64KB
            </p>
            <InfoTooltip content="Upload a token icon in JPG, PNG or SVG format. Maximum size is 64KB. This will be encoded and stored on-chain." />
          </div>
        </div>
      </Parameter>

      {/* Advanced Options Toggle Button */}
      <div className="my-4">
        <button
          type="button"
          onClick={toggleAdvancedOptions}
          className="text-sm hover:bg-muted flex w-full items-center justify-between rounded-md border p-3 font-medium transition-colors"
        >
          <span>Advanced Options</span>
          {showAdvancedOptions ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Collapsible Advanced Options Section */}
      {showAdvancedOptions && (
        <div className="mb-4 space-y-4 rounded-md border p-4">
          <Parameter label="Token Decimals">
            <div className="flex w-full flex-col gap-2">
              <div className="relative">
                <TextInput
                  value={tokenDecimals?.toString() || "9"}
                  onChange={handleDecimalsChange}
                  placeholder="Enter token decimals"
                  onFocus={() => handleFocus("decimals")}
                  onBlur={() => handleBlur("decimals")}
                  className={cn(
                    "h-12 sm:h-10",
                    touched.decimals && errors.decimals
                      ? "border-error focus:border-error"
                      : "",
                    touched.decimals && isValid.decimals
                      ? "border-success focus:border-success"
                      : "",
                  )}
                  inputClassName="text-base sm:text-sm"
                />
                {touched.decimals && isValid.decimals && (
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
              {errors.decimals && touched.decimals && (
                <p className="text-sm mt-1 text-error">{errors.decimals}</p>
              )}
              <div className="mt-1 flex items-center gap-1.5">
                <p className="text-xs text-secondary-foreground">
                  Decimal places for your token (0-18, default: 9)
                </p>
                <InfoTooltip content="The number of decimal places your token supports. Most tokens use 9 decimals, similar to SUI." />
              </div>
            </div>
          </Parameter>

          <Parameter label="Description">
            <div className="flex w-full flex-col gap-2">
              <div className="relative">
                <TextInput
                  value={tokenDescription}
                  onFocus={() => handleFocus("description")}
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
                {touched.description &&
                  tokenDescription &&
                  isValid.description && (
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
                  Optional. A brief description of your token&apos;s purpose.
                </p>
                <InfoTooltip content="Optional. A brief description of your token's purpose or features." />
              </div>
            </div>
          </Parameter>

          <Parameter label="Token Supply">
            <div className="flex w-full flex-col gap-2">
              <div className="relative">
                <TextInput
                  value={initialSupply}
                  onFocus={() => handleFocus("initialSupply")}
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
                <p className="text-sm mt-1 text-error">
                  {errors.initialSupply}
                </p>
              )}
              <div className="mt-1 flex items-center gap-1.5">
                <p className="text-xs text-secondary-foreground">
                  The total number of tokens that will be created initially
                </p>
                <InfoTooltip content="The total number of tokens to create initially. All will be sent to your wallet." />
              </div>
            </div>
          </Parameter>
        </div>
      )}

      <button
        type="submit"
        disabled={Object.values(errors).some((error) => error !== "")}
        className={cn(
          "mt-4 flex h-12 w-full items-center justify-center rounded-md bg-button-1 px-4 py-3 text-p2 text-button-1-foreground hover:bg-button-1/80 disabled:cursor-not-allowed disabled:opacity-50",
        )}
        onClick={handleSubmit}
      >
        Next
      </button>
    </form>
  );
}
