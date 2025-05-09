import { normalizeSuiObjectId } from "@mysten/sui/utils";

export interface PoolTypes<A, B, Quoter, W, P> {
  aType: A;
  bType: B;
  wit: W;
  quoterType: Quoter;
  pType: P;
}

export interface ObjectIds {
  poolId: string;
  bankAId: string;
  bankBId: string;
  lendingMarketId: string;
}

/**
 * Represents a SUI address, which is a string.
 */
export type SuiTypeName = string;
export type SuiAddressType = string;

/**
 * Represents a SUI struct tag.
 */
export type SuiStructTag = {
  /**
   * The full address of the struct.
   */
  full_address: string;

  /**
   * The source address of the struct.
   */
  source_address: string;

  /**
   * The address of the struct.
   */
  address: SuiAddressType;

  /**
   * The module to which the struct belongs.
   */
  module: string;

  /**
   * The name of the struct.
   */
  name: string;

  /**
   * An array of type arguments (SUI addresses) for the struct.
   */
  type_arguments: SuiAddressType[];
};

export const fixSuiObjectId = (value: string): string => {
  if (value.toLowerCase().startsWith("0x")) {
    return normalizeSuiObjectId(value);
  }
  return value;
};

/**
 * Recursively traverses the given data object and patches any string values that represent Sui object IDs.
 *
 * @param {any} data - The data object to be patched.
 */
export const patchFixSuiObjectId = (data: any) => {
  for (const key in data) {
    const type = typeof data[key];
    if (type === "object") {
      patchFixSuiObjectId(data[key]);
    } else if (type === "string") {
      const value = data[key];
      if (value && !value.includes("::")) {
        data[key] = fixSuiObjectId(value);
      }
    }
  }
};

export const extractGenerics = (typeString: string): string[] => {
  const match = typeString.match(/<(.+)>/);
  if (!match) return [];

  // Split by comma while handling nested generics
  const generics = [];
  let depth = 0,
    current = "";

  for (const char of match[1]) {
    if (char === "<") depth++;
    if (char === ">") depth--;

    if (char === "," && depth === 0) {
      generics.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current) generics.push(current.trim());

  return generics;
};

const zip = <T, U>(a: T[], b: U[]): [T, U][] => {
  return a.map((k, i) => [k, b[i]]);
};

export { zip };

/**
 * Computes the optimal offset using the formula: Price * tokenReserve * 10^(decimalsY - decimalsX)
 * @param price The price as a decimal number or string
 * @param tokenReserve Total amount of tokens to launch that have been added to the pool
 * @param decimalsX The decimal places of token X
 * @param decimalsY The decimal places of token Y
 * @returns The calculated offset as a bigint
 * @throws Error if the result contains a fractional part
 */
export const computeOptimalOffset = (
  price: number | string,
  tokenReserve: bigint,
  decimalsX: number,
  decimalsY: number,
): bigint => {
  // Convert price to string if it's a number
  const priceStr = typeof price === "number" ? price.toString() : price;

  // Parse price to determine its decimal places
  const [intPart, fracPart = ""] = priceStr.split(".");
  const pricePrecision = fracPart.length;

  // Convert price to a bigint (removing the decimal point)
  const priceAsBigInt = BigInt(intPart + fracPart);

  // Calculate 10^(decimalsY - decimalsX)
  const decimalAdjustment = BigInt(10) ** BigInt(decimalsY - decimalsX);

  // Calculate the numerator: priceAsBigInt * tokenReserve * decimalAdjustment
  const numerator = priceAsBigInt * tokenReserve * decimalAdjustment;

  // Calculate the denominator: 10^pricePrecision
  const denominator = BigInt(10) ** BigInt(pricePrecision);

  // Check if the result will be an integer
  if (numerator % denominator !== BigInt(0)) {
    throw new Error(
      "Result contains a fractional part and cannot be represented as an integer offset",
    );
  }

  // Calculate the final result
  const result = numerator / denominator;

  return result;
};
