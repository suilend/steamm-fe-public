import BigNumber from "bignumber.js";

import { formatInteger, formatNumber } from "@suilend/sui-fe";

export const formatPair = (symbols: string[], separator = "-") =>
  symbols.join(separator);

export const formatAmplifier = (amplifier: BigNumber) =>
  `${formatNumber(amplifier, { exact: true, trimTrailingZeros: true })}`;

export const formatFeeTier = (feeTierPercent: BigNumber) =>
  `${formatNumber(feeTierPercent, { exact: true, trimTrailingZeros: true })}%`;

export const formatTextInputValue = (_value: string, dp: number) => {
  let formattedValue;
  if (new BigNumber(_value || 0).lt(0)) formattedValue = _value;
  else if (!_value.includes(".")) formattedValue = _value;
  else {
    const [integers, decimals] = _value.split(".");
    const integersFormatted = formatInteger(
      integers !== "" ? parseInt(integers) : 0,
      false,
    );
    const decimalsFormatted = decimals.slice(0, Math.min(decimals.length, dp));
    formattedValue = `${integersFormatted}.${decimalsFormatted}`;
  }

  return formattedValue;
};

export const formatPercentInputValue = (_value: string, dp: number) => {
  let formattedValue;
  if (new BigNumber(_value || 0).lt(0)) formattedValue = "0";
  else if (new BigNumber(_value).gt(100)) formattedValue = "100";
  else if (!_value.includes(".")) formattedValue = _value;
  else {
    const [integers, decimals] = _value.split(".");
    const integersFormatted = formatInteger(
      integers !== "" ? parseInt(integers) : 0,
      false,
    );
    const decimalsFormatted = decimals.slice(0, Math.min(decimals.length, dp));
    formattedValue = `${integersFormatted}.${decimalsFormatted}`;
  }

  return formattedValue;
};
