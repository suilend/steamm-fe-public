export function validateTokenName(name: string): string | undefined {
  if (!name) return "Token name is required";
  if (name.length < 3) return "Token name must be at least 3 characters";
  if (name.length > 50) return "Token name must be at most 50 characters";
  if (!/^[a-zA-Z0-9\s\-_.,'&()]+$/.test(name))
    return "Token name can only contain letters, numbers, spaces, and basic punctuation";
  return undefined;
}

export function validateTokenSymbol(symbol: string): string | undefined {
  if (!symbol) return "Token symbol is required";
  if (symbol.length < 2) return "Token symbol must be at least 2 characters";
  if (symbol.length > 6) return "Token symbol must be at most 6 characters";
  if (!/^[A-Z$][A-Z0-9$]*$/.test(symbol))
    return "Token symbol must start with a letter or $ and contain only uppercase letters, numbers, and $";
  return undefined;
}

export function validateTokenDecimals(decimals: number): string | undefined {
  if (decimals === undefined || decimals === null)
    return "Token decimals are required";
  if (isNaN(decimals)) return "Token decimals must be a number";
  if (!Number.isInteger(decimals)) return "Token decimals must be an integer";
  if (decimals < 0) return "Token decimals must be non-negative";
  if (decimals > 18) return "Token decimals must be at most 18";
  return undefined;
}

export function validateTokenIcon(file: File | null): string | undefined {
  if (!file) return undefined; // Icon is optional

  // Check file size (max 64KB = 65536 bytes)
  if (file.size > 65536) return "Icon size must be less than 64KB";

  // Check file type
  const validTypes = ["image/jpeg", "image/png", "image/svg+xml"];
  if (!validTypes.includes(file.type))
    return "Icon must be in JPEG, PNG, or SVG format";

  return undefined;
}

export function validateTokenSupply(supply: string): string | undefined {
  if (!supply) return "Initial supply is required";
  if (isNaN(Number(supply))) return "Initial supply must be a number";
  if (Number(supply) <= 0) return "Initial supply must be greater than 0";
  if (Number(supply) > 1_000_000_000_000_000)
    return "Initial supply exceeds maximum allowed (1 quadrillion)";
  return undefined;
}

export function validateMaxSupply(
  maxSupply: string,
  initialSupply: string,
): string | undefined {
  if (!maxSupply) return undefined;

  if (isNaN(Number(maxSupply))) return "Maximum supply must be a number";
  if (Number(maxSupply) <= 0) return "Maximum supply must be greater than 0";

  if (initialSupply && !isNaN(Number(initialSupply))) {
    if (Number(maxSupply) < Number(initialSupply))
      return "Maximum supply cannot be less than initial supply";
  }

  if (Number(maxSupply) > 1_000_000_000_000_000)
    return "Maximum supply exceeds maximum allowed (1 quadrillion)";

  return undefined;
}

export function validateDescription(description: string): string | undefined {
  if (!description) return undefined;
  if (description.length > 1000)
    return "Description must be at most 1000 characters";
  return undefined;
}

export function validateWebsiteUrl(url: string): string | undefined {
  if (!url) return undefined;
  try {
    new URL(url);
    if (!/^https?:\/\/[a-zA-Z0-9][\w\-.]+\.[a-zA-Z]{2,}/.test(url))
      return "Please enter a valid website URL (e.g., https://example.com)";
    return undefined;
  } catch {
    return "Invalid website URL";
  }
}

export function validateTwitterHandle(handle: string): string | undefined {
  if (!handle) return undefined;
  const cleanHandle = handle.startsWith("@") ? handle.substring(1) : handle;
  if (!/^[a-zA-Z0-9_]{1,15}$/.test(cleanHandle))
    return "Twitter handle must be 1-15 characters and can only contain letters, numbers, and underscores";
  return undefined;
}

export function validateTelegramHandle(handle: string): string | undefined {
  if (!handle) return undefined;
  const cleanHandle = handle.startsWith("@") ? handle.substring(1) : handle;
  if (!/^[a-zA-Z0-9_]{5,32}$/.test(cleanHandle))
    return "Telegram handle must be 5-32 characters and can only contain letters, numbers, and underscores";
  return undefined;
}

export function formatTokenAmount(amount: string): string {
  if (!amount || isNaN(Number(amount))) return amount;

  const num = Number(amount);
  return num.toLocaleString("en-US", {
    maximumFractionDigits: 9,
    useGrouping: true,
  });
}

export function parseFormattedAmount(formattedAmount: string): string {
  if (!formattedAmount) return "";
  return formattedAmount.replace(/[^0-9.]/g, "");
}

// Helper function to convert a file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}
