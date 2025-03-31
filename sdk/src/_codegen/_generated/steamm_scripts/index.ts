import {
  STEAMM_SCRIPT_CONFIG,
  STEAMM_SCRIPT_BETA_CONFIG,
} from "../../../config";

export const PACKAGE_ID =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? STEAMM_SCRIPT_BETA_CONFIG.packageId
    : STEAMM_SCRIPT_CONFIG.packageId;
export let PUBLISHED_AT =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? STEAMM_SCRIPT_BETA_CONFIG.publishedAt
    : STEAMM_SCRIPT_CONFIG.publishedAt;
export const PKG_V1 =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? STEAMM_SCRIPT_BETA_CONFIG.packageId
    : STEAMM_SCRIPT_CONFIG.packageId;

export function setPublishedAt(publishedAt: string) {
  PUBLISHED_AT = publishedAt;
}
