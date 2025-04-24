import { ClassValue } from "clsx";
import { useState } from "react";

import Parameter from "@/components/Parameter";
import TextInput from "@/components/TextInput";
import { cn } from "@/lib/utils";
import { 
  validateTokenName, 
  validateTokenSymbol,
  validateTokenSupply,
  validateDescription,
  formatTokenAmount,
  parseFormattedAmount
} from "../TokenCreationForm/validation";

interface TokenBasicInfoProps {
  className?: ClassValue;
  name: string;
  onNameChange: (value: string) => void;
  symbol: string;
  onSymbolChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  initialSupply: string;
  onInitialSupplyChange: (value: string) => void;
  onSubmit: () => void;
}

export default function TokenBasicInfo({
  className,
  name,
  onNameChange,
  symbol,
  onSymbolChange,
  description,
  onDescriptionChange,
  initialSupply,
  onInitialSupplyChange,
  onSubmit,
}: TokenBasicInfoProps) {
  // Validation state
  const [errors, setErrors] = useState({
    name: "",
    symbol: "",
    description: "",
    initialSupply: ""
  });
  const [touched, setTouched] = useState({
    name: false,
    symbol: false,
    description: false,
    initialSupply: false
  });

  // Handle blur events to validate on field exit
  const handleBlur = (field: keyof typeof errors) => {
    setTouched({ ...touched, [field]: true });
    validateField(field);
  };

  // Validate a specific field
  const validateField = (field: keyof typeof errors) => {
    let errorMessage = "";

    switch (field) {
      case "name":
        errorMessage = validateTokenName(name) || "";
        break;
      case "symbol":
        errorMessage = validateTokenSymbol(symbol) || "";
        break;
      case "description":
        errorMessage = validateDescription(description) || "";
        break;
      case "initialSupply":
        errorMessage = validateTokenSupply(initialSupply) || "";
        break;
    }

    setErrors(prev => ({ ...prev, [field]: errorMessage }));
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
      initialSupply: true
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
    onInitialSupplyChange(parsedValue);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex w-full flex-col gap-4", className)}>
      <Parameter label="Token Name">
        <div className="flex flex-col gap-1 w-full">
          <TextInput
            value={name}
            onChange={(e) => onNameChange(e)}
            placeholder="Enter token name"
            onBlur={() => handleBlur("name")}
            className={errors.name && touched.name ? "border-error" : ""}
          />
          {errors.name && touched.name && (
            <p className="text-sm text-error">{errors.name}</p>
          )}
        </div>
      </Parameter>

      <Parameter label="Token Symbol">
        <div className="flex flex-col gap-1 w-full">
          <TextInput
            value={symbol}
            onChange={(e) => onSymbolChange(e.toUpperCase())}
            placeholder="Enter token symbol"
            onBlur={() => handleBlur("symbol")}
            className={errors.symbol && touched.symbol ? "border-error" : ""}
          />
          {errors.symbol && touched.symbol && (
            <p className="text-sm text-error">{errors.symbol}</p>
          )}
          <p className="text-xs text-secondary-foreground">2-6 characters, uppercase letters, numbers, and $ only</p>
        </div>
      </Parameter>

      <Parameter label="Description">
        <div className="flex flex-col gap-1 w-full">
          <TextInput
            value={description}
            onChange={(e) => onDescriptionChange(e)}
            placeholder="Enter token description"
            onBlur={() => handleBlur("description")}
            className={errors.description && touched.description ? "border-error" : ""}
          />
          {errors.description && touched.description && (
            <p className="text-sm text-error">{errors.description}</p>
          )}
        </div>
      </Parameter>

      <Parameter label="Initial Supply">
        <div className="flex flex-col gap-1 w-full">
          <TextInput
            value={initialSupply ? formatTokenAmount(initialSupply) : ""}
            onChange={handleSupplyChange}
            placeholder="Enter initial supply"
            onBlur={() => handleBlur("initialSupply")}
            className={errors.initialSupply && touched.initialSupply ? "border-error" : ""}
          />
          {errors.initialSupply && touched.initialSupply && (
            <p className="text-sm text-error">{errors.initialSupply}</p>
          )}
        </div>
      </Parameter>

      <button
        type="submit"
        className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
      >
        <p className="text-p2 text-button-1-foreground">Next</p>
      </button>
    </form>
  );
} 