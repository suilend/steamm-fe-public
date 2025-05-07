import { STEAMM_BETA_CONFIG, STEAMM_CONFIG } from "../../../config";

export const PACKAGE_ID =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? STEAMM_BETA_CONFIG.packageId
    : STEAMM_CONFIG.packageId;
export let PUBLISHED_AT =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? STEAMM_BETA_CONFIG.publishedAt
    : STEAMM_CONFIG.publishedAt;
export const PKG_V1 =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? STEAMM_BETA_CONFIG.packageId
    : STEAMM_CONFIG.packageId;
export const ORACLE_PKG_V1 =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? STEAMM_BETA_CONFIG.config!.quoterIds.omm
    : STEAMM_CONFIG.config!.quoterIds.omm;
export const ORACLE_V2_PKG_V1 =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? STEAMM_BETA_CONFIG.config!.quoterIds.ommV2
    : STEAMM_CONFIG.config!.quoterIds.ommV2;

export function setPublishedAt(publishedAt: string) {
  PUBLISHED_AT = publishedAt;
}
