export interface NeedsRebalance {
  needsRebalance: boolean;
}

export function castNeedsRebalance(obj: any): boolean {
  return obj.needs_rebalance as boolean;
}
