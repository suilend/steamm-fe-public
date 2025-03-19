import {
  STEAMM_SCRIPT_CONFIG,
  STEAMM_SCRIPT_BETA_CONFIG,
} from "../../../config";

export const PACKAGE_ID = process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET
  ? STEAMM_SCRIPT_BETA_CONFIG.package_id
  : STEAMM_SCRIPT_CONFIG.package_id;
export let PUBLISHED_AT = process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET
  ? STEAMM_SCRIPT_BETA_CONFIG.published_at
  : STEAMM_SCRIPT_CONFIG.published_at;
export const PKG_V1 = process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET
  ? STEAMM_SCRIPT_BETA_CONFIG.package_id
  : STEAMM_SCRIPT_CONFIG.package_id;

export function setPublishedAt(publishedAt: string) {
  PUBLISHED_AT = publishedAt;
}
