import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";

import { ChevronDown, ChevronUp, InfoIcon, Upload } from "lucide-react";

import Parameter from "@/components/Parameter";
import TextInput from "@/components/TextInput";
import Tooltip from "@/components/Tooltip";
import { LaunchConfig } from "@/contexts/LaunchContext";
import { cn } from "@/lib/utils";

import { Switch } from "../ui/switch";

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

export type FormErrors = {
  name: string;
  symbol: string;
  description: string;
  initialSupply: string;
  decimals: string;
  icon: string;
};

interface TokenBasicInfoProps {
  config: LaunchConfig;
  setConfig: (value: LaunchConfig) => void;
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
  touched: {
    name: boolean;
    symbol: boolean;
    description: boolean;
    initialSupply: boolean;
    decimals: boolean;
    icon: boolean;
  };
  isValid: {
    name: boolean;
    symbol: boolean;
    description: boolean;
    initialSupply: boolean;
    decimals: boolean;
    icon: boolean;
  };
  setTouched: Dispatch<
    SetStateAction<{
      name: boolean;
      symbol: boolean;
      description: boolean;
      initialSupply: boolean;
      decimals: boolean;
      icon: boolean;
    }>
  >;
  setIsValid: Dispatch<
    SetStateAction<{
      name: boolean;
      symbol: boolean;
      description: boolean;
      initialSupply: boolean;
      icon: boolean;
      decimals: boolean;
    }>
  >;
  iconFile: File | null;
  setIconFile: Dispatch<SetStateAction<File | null>>;
}

// Helper type for InfoTooltip
interface InfoTooltipProps {
  content: string;
}

export const BURN_LP_TOOLTIP_CONTENT =
  "Burning Liquidity Provider (LP) tokens prevents withdrawals of the initial liquidity in the pool. This action enhances investor trust by ensuring the project's initial liquidity remains immutable.";

export default function TokenBasicInfo({
  config,
  setConfig,
  errors,
  setErrors,
  touched,
  setTouched,
  isValid,
  setIsValid,
  iconFile,
  setIconFile,
}: TokenBasicInfoProps) {
  const {
    tokenName,
    tokenSymbol,
    tokenDescription,
    initialSupply,
    tokenDecimals,
  } = config;

  // State for advanced options collapse
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  // Handle blur events to validate on field exit
  const handleBlur = (field: keyof typeof errors) => {
    setTouched({ ...touched, [field]: true });
    validateField(field);
  };

  // Handle focus events - we'll call this manually since TextInput doesn't support onFocus prop
  const handleFocus = (field: keyof FormErrors) => {
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
        errorMessage = validateTokenSymbol(tokenSymbol, tokenName) || "";
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
      setConfig({ ...config, tokenDecimals: parsedValue });
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

  // Toggle advanced options visibility
  const toggleAdvancedOptions = () => {
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  return (
    <form className="flex flex-col gap-4">
      <Parameter label="Token name">
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
              inputClassName="text-base sm:text-p2"
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
            <p className="mt-1 text-p2 text-error">{errors.name}</p>
          )}
        </div>
      </Parameter>

      <Parameter label="Token symbol">
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
              inputClassName="text-base sm:text-p2"
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
            <p className="mt-1 text-p2 text-error">{errors.symbol}</p>
          )}
        </div>
      </Parameter>

      <Parameter label="Token icon">
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
                    <span className="text-p2 text-foreground">
                      {config.iconFileName ?? iconFile?.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-1">
                    <Upload className="text-muted-foreground h-6 w-6" />
                    <span className="text-muted-foreground text-p2">
                      Upload icon (optional)
                    </span>
                  </div>
                )}
              </label>
            </div>
          </div>
          {errors.icon && touched.icon && (
            <p className="mt-1 text-p2 text-error">{errors.icon}</p>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <p className="text-p3 text-secondary-foreground">
              JPG, PNG, or SVG, max 40KB
            </p>
          </div>
        </div>
      </Parameter>

      {/* Advanced Options Toggle Button */}
      <div className="my-0">
        <button
          type="button"
          onClick={toggleAdvancedOptions}
          className="hover:bg-muted flex w-full items-center justify-between rounded-md text-p2 text-secondary-foreground transition-colors"
        >
          <span>Optional</span>
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
          <Parameter label="Token decimals">
            <div className="flex w-full flex-col gap-2">
              <div className="relative">
                <TextInput
                  value={tokenDecimals?.toString()}
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
                  inputClassName="text-base sm:text-p2"
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
                <p className="mt-1 text-p2 text-error">{errors.decimals}</p>
              )}
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
                  inputClassName="text-base sm:text-p2"
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
                <p className="mt-1 text-p2 text-error">{errors.description}</p>
              )}
            </div>
          </Parameter>

          <Parameter label="Token supply">
            <div className="flex w-full flex-col gap-2">
              <div className="relative">
                <TextInput
                  value={initialSupply}
                  onFocus={() => handleFocus("initialSupply")}
                  onChange={handleSupplyChange}
                  placeholder="Enter supply"
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
                  inputClassName="text-base sm:text-p2"
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
                <p className="mt-1 text-p2 text-error">
                  {errors.initialSupply}
                </p>
              )}
            </div>
          </Parameter>
          <div className="flex justify-between">
            <p className="flex items-center gap-1 text-p2 text-secondary-foreground">
              Burn LP Token{" "}
              <Tooltip content={BURN_LP_TOOLTIP_CONTENT}>
                <InfoIcon className="text-muted-foreground h-4 w-4 cursor-help" />
              </Tooltip>
            </p>
            <Switch
              checked={config.burnLP}
              onCheckedChange={() =>
                setConfig({ ...config, burnLP: !config.burnLP })
              }
            />
          </div>
        </div>
      )}
    </form>
  );
}
