export function validateTokenAmount(amount: string): string | undefined {
  if (!amount) return "Amount is required";
  if (isNaN(Number(amount))) return "Amount must be a number";
  if (Number(amount) <= 0) return "Amount must be greater than 0";
  return undefined;
}

export function validateFeeTier(feeTier: number): string | undefined {
  const validFeeTiers = [0.01, 0.05, 0.3, 1, 2];
  if (!validFeeTiers.includes(feeTier)) return "Invalid fee tier";
  return undefined;
} 