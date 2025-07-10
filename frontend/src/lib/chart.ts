import BigNumber from "bignumber.js";

import { SelectPopoverOption } from "@/lib/select";

export enum ChartDataType {
  TVL = "tvl",
  VOLUME = "volume",
  FEES = "fees",
  LP_VALUE = "lp-value",
}
export const chartDataTypeNameMap: Record<ChartDataType, string> = {
  [ChartDataType.TVL]: "TVL",
  [ChartDataType.VOLUME]: "Volume",
  [ChartDataType.FEES]: "Fees",
  [ChartDataType.LP_VALUE]: "LP Value",
};

export enum ChartPeriod {
  ONE_DAY = "1D",
  ONE_WEEK = "1W",
  ONE_MONTH = "1M",
  THREE_MONTHS = "3M",
}
export const chartPeriodNameMap: Record<ChartPeriod, string> = {
  [ChartPeriod.ONE_DAY]: "1D",
  [ChartPeriod.ONE_WEEK]: "1W",
  [ChartPeriod.ONE_MONTH]: "1M",
  [ChartPeriod.THREE_MONTHS]: "3M",
};
export const chartPeriodUnitMap: Record<ChartPeriod, string> = {
  [ChartPeriod.ONE_DAY]: "day",
  [ChartPeriod.ONE_WEEK]: "week",
  [ChartPeriod.ONE_MONTH]: "month",
  [ChartPeriod.THREE_MONTHS]: "3 months",
};

export enum ChartType {
  LINE = "line",
  BAR = "bar",
}

export type ChartConfig = {
  getChartType: (dataType: ChartDataType) => ChartType;
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
