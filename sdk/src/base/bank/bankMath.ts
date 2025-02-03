const EEmptyBank = new Error(
  "The total funds (available + deployed) must be greater than zero."
);

export enum LendingAction {
  None,
  Recall,
  Lend,
}

export function computeUtilisationBps(
  fundsAvailable: bigint,
  fundsDeployed: bigint
): bigint {
  // Assert that the sum of funds available and deployed is greater than zero
  if (fundsAvailable + fundsDeployed <= 0) {
    throw EEmptyBank;
  }
  // Calculate utilization in basis points
  return (fundsDeployed * BigInt(10000)) / (fundsAvailable + fundsDeployed);
}
