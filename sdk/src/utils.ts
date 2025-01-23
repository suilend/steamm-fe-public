import {
  Transaction,
  TransactionArgument,
} from "@mysten/sui/dist/cjs/transactions";
import { normalizeSuiObjectId } from "@mysten/sui/utils";
import { TEST_FAUCET_PKG_ID } from "./testnet/testnet";

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

export function fixSuiObjectId(value: string): string {
  if (value.toLowerCase().startsWith("0x")) {
    return normalizeSuiObjectId(value);
  }
  return value;
}

/**
 * Recursively traverses the given data object and patches any string values that represent Sui object IDs.
 *
 * @param {any} data - The data object to be patched.
 */
export function patchFixSuiObjectId(data: any) {
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
}
