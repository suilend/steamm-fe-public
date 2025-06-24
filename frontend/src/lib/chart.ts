import BigNumber from "bignumber.js";

import { SelectPopoverOption } from "@/lib/select";

export type ViewBox = {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const getTooltipStyle = (width: number, viewBox: ViewBox, x: number) => {
  const top = viewBox.top - 10;
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

export enum ChartDataType {
  TVL = "tvl",
  VOLUME = "volume",
  FEES = "fees",
}
export const chartDataTypeNameMap: Record<ChartDataType, string> = {
  [ChartDataType.TVL]: "TVL",
  [ChartDataType.VOLUME]: "Volume",
  [ChartDataType.FEES]: "Fees",
};

export enum ChartPeriod {
  ONE_DAY = "1D",
  ONE_WEEK = "1W",
  ONE_MONTH = "1M",
  THREE_MONTHS = "3M",
}
export const chartPeriodNameMap: Record<ChartPeriod, string> = {
  [ChartPeriod.ONE_DAY]: "24H",
  [ChartPeriod.ONE_WEEK]: "1W",
  [ChartPeriod.ONE_MONTH]: "1M",
  [ChartPeriod.THREE_MONTHS]: "3M",
};

export enum ChartType {
  LINE = "line",
  BAR = "bar",
}

export type ChartConfig = {
  getChartType: (dataType: ChartDataType) => ChartType;
  getValueFormatter: (dataType: ChartDataType) => (value: number) => string;
  periodOptions?: SelectPopoverOption[];
  dataTypeOptions: SelectPopoverOption[];
  totalMap: Partial<
    Record<ChartDataType, Partial<Record<ChartPeriod, BigNumber | undefined>>>
  >;
  dataMap: Partial<
    Record<ChartDataType, Partial<Record<ChartPeriod, ChartData[] | undefined>>>
  >;
};

export type ChartData = {
  timestampS: number;
  [category: string]: number;
};
