import { STEAMM_BETA_CONFIG, STEAMM_CONFIG } from "../../../config";

export const PACKAGE_ID =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? STEAMM_BETA_CONFIG.package_id
    : STEAMM_CONFIG.package_id;
export let PUBLISHED_AT =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? STEAMM_BETA_CONFIG.published_at
    : STEAMM_CONFIG.published_at;
export const PKG_V1 =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? STEAMM_BETA_CONFIG.package_id
    : STEAMM_CONFIG.package_id;
export const ORACLE_PKG_V1 =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? STEAMM_BETA_CONFIG.config!.quoterSourcePkgs.omm
    : STEAMM_CONFIG.config!.quoterSourcePkgs.omm;
export const STABLE_PKG_V1 =
  process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
    ? STEAMM_BETA_CONFIG.config!.quoterSourcePkgs.stable
    : STEAMM_CONFIG.config!.quoterSourcePkgs.stable;

export function setPublishedAt(publishedAt: string) {
  PUBLISHED_AT = publishedAt;
}
