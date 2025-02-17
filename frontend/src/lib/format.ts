import BigNumber from "bignumber.js";

import { formatNumber } from "@suilend/frontend-sui";

export const formatPair = (symbols: string[]) => symbols.join("-");

export const formatFeeTier = (feeTierPercent: BigNumber) =>
  `${formatNumber(feeTierPercent, { exact: true, trimTrailingZeros: true })}%`;
