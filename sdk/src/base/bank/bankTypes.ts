export interface NeedsRebalance {
  needsRebalance: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function castNeedsRebalance(obj: any): boolean {
  return obj.needs_rebalance as boolean;
}
