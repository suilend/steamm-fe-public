import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const hoverUnderlineClassName =
  "underline decoration-dotted decoration-1 underline-offset-2";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
