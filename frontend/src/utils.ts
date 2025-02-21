import { MAX_U64 } from "@suilend/frontend-sui";
import { DepositQuote } from "@suilend/steamm-sdk";
import { CpQuoter } from "@suilend/steamm-sdk/_codegen/_generated/steamm/cpmm/structs";
import { Pool } from "@suilend/steamm-sdk/_codegen/_generated/steamm/pool/structs";

// interface Pool {
//   lpSupplyVal: () => bigint;
//   balanceAmounts: () => [bigint, bigint];
// }

// Helper type to mimic Option<u64>
type Option<T> = { value: T } | null;

// Function to perform multiplication and division with rounding up
function checkedMulDivUp(x: bigint, y: bigint, z: bigint): Option<bigint> {
  if (z === BigInt(0)) {
    return null;
  }

  // Calculate multiplication first
  const product = x * y;
  // Implement num_divide_and_round_up logic
  const res = product % z === BigInt(0) ? product / z : product / z + BigInt(1);

  if (res > BigInt(MAX_U64.toString())) {
    return null;
  }

  return { value: res };
}

function safeMulDivUp(x: bigint, y: bigint, z: bigint): bigint {
  // Check for division by zero
  if (z <= BigInt(0)) {
    throw new Error("EDivideByZero");
  }

  // Perform calculation with BigInt
  const product = x * y;
  // Implement num_divide_and_round_up logic: if (x % y == 0) x / y else x / y + 1
  const res = product % z === BigInt(0) ? product / z : product / z + BigInt(1);

  // Check for overflow
  if (res > BigInt(MAX_U64.toString())) {
    throw new Error("EMathOverflow");
  }

  return res;
}

function safeMulDiv(x: bigint, y: bigint, z: bigint): bigint {
  // Check for division by zero
  if (z <= BigInt(0)) {
    throw new Error("EDivideByZero");
  }

  // Perform calculation with BigInt
  const res = (x * y) / z;

  // Check for overflow
  if (res > BigInt(MAX_U64.toString())) {
    throw new Error("EMathOverflow");
  }

  return res;
}

function sqrt(value: bigint): bigint {
  if (value < BigInt(0)) throw new Error("Square root of negative number");
  if (value < BigInt(2)) return value;

  let result = BigInt(1);
  let bit = BigInt(1) << BigInt(Math.floor(Math.log2(Number(value))) / 2);

  while (bit > BigInt(0)) {
    if ((result + bit) * (result + bit) <= value) {
      result += bit;
    }
    bit >>= BigInt(1);
  }

  return result;
}

function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

function tokensToDeposit(
  reserveA: bigint,
  reserveB: bigint,
  maxA: bigint,
  maxB: bigint,
): [bigint, bigint] {
  if (maxA === BigInt(0))
    throw new Error("Deposit max A parameter cannot be zero");

  if (reserveA === BigInt(0) && reserveB === BigInt(0)) {
    return [maxA, maxB];
  }

  const bStar =
    reserveA === BigInt(0) ? null : checkedMulDivUp(maxA, reserveB, reserveA);
  // Fix: Check if bStar has a value and compare the value with maxB
  const useAStar = bStar === null || (bStar !== null && bStar.value > maxB);

  if (!useAStar) {
    // Since we know bStar isn't null when useAStar is false, we can safely access value
    return [maxA, bStar!.value];
  } else {
    const aStar = safeMulDivUp(maxB, reserveA, reserveB);
    if (aStar === BigInt(0)) throw new Error("Deposit ratio leads to zero A");
    if (aStar > maxA) throw new Error("Deposit ratio invalid");
    return [aStar, maxB];
  }
}

function lpTokensToMint(
  reserveA: bigint,
  reserveB: bigint,
  lpSupply: bigint,
  amountA: bigint,
  amountB: bigint,
): bigint {
  if (lpSupply === BigInt(0)) {
    if (amountB === BigInt(0)) {
      return amountA;
    }
    return sqrt(amountA * amountB);
  } else {
    if (reserveB === BigInt(0)) {
      return safeMulDiv(amountA, lpSupply, reserveA);
    } else {
      return min(
        safeMulDiv(amountA, lpSupply, reserveA),
        safeMulDiv(amountB, lpSupply, reserveB),
      );
    }
  }
}

function quoteDeposit(
  reserveA: bigint,
  reserveB: bigint,
  lpSupply: bigint,
  maxA: bigint,
  maxB: bigint,
): [bigint, bigint, bigint] {
  const [deltaA, deltaB] = tokensToDeposit(reserveA, reserveB, maxA, maxB);
  const deltaLp = lpTokensToMint(reserveA, reserveB, lpSupply, deltaA, deltaB);

  if (deltaLp === BigInt(0)) throw new Error("Empty LP mint amount");

  return [deltaA, deltaB, deltaLp];
}

export function quotePoolDeposit(
  pool: Pool<string, string, CpQuoter, string>,
  maxA: bigint,
  maxB: bigint,
): DepositQuote {
  // ): void {
  const reserveA = BigInt(pool.balanceA.value.toString());
  const reserveB = BigInt(pool.balanceB.value.toString());
  const lpSupply = BigInt(pool.lpSupply.value.toString());
  console.log(`balanceA: ${reserveA}`);
  console.log(`balanceB: ${reserveB}`);
  console.log(`lpSupply: ${lpSupply}`);

  const initialDeposit = lpSupply === BigInt(0);

  const [depositA, depositB, mintLp] = quoteDeposit(
    reserveA,
    reserveB,
    lpSupply,
    maxA,
    maxB,
  );

  return {
    initialDeposit,
    depositA,
    depositB,
    mintLp,
  };
}
