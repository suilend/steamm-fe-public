import BigNumber from "bignumber.js";

import { formatUsd } from "@suilend/frontend-sui";

import { AppData } from "@/contexts/AppContext";

export type ViewBox = {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const getTooltipStyle = (width: number, viewBox: ViewBox, x: number) => {
  const top = viewBox.top;
  let left: string | number = "auto";
  let right: string | number = "auto";
  const sideOffset = 2 * 4; // px

  const isAtRightBoundary =
    x - viewBox.left > viewBox.width - (sideOffset + width);
  if (isAtRightBoundary) {
    right = Math.min(
      viewBox.left + viewBox.width + viewBox.right - width,
      viewBox.left + viewBox.width + viewBox.right - (x - sideOffset),
    );
  } else {
    left = Math.min(
      viewBox.left + viewBox.width + viewBox.right - width,
      x + sideOffset,
    );
  }

  return { width, top, left, right };
};

export enum ChartType {
  LINE = "line",
  BAR = "bar",
}

export type ChartData = {
  timestampS: number;
  [category: string]: number;
};

export const OTHER_CATEGORY = "Other";

export const formatCoinTypeCategory = (
  category: string,
  coinMetadataMap: AppData["coinMetadataMap"],
): string | undefined => {
  if (category === OTHER_CATEGORY) return "Other";
  return coinMetadataMap[category]?.symbol;
};

export const formatValueUsd = (valueUsd: number): string =>
  formatUsd(new BigNumber(valueUsd));
