import {
  ParsedPool,
  PoolInfo,
  QUOTER_ID_NAME_MAP,
  QuoterId,
  SteammSDK,
} from "@suilend/steamm-sdk";

import { AppData } from "@/contexts/AppContext";
import { formatPair } from "@/lib/format";
import { POOL_URL_PREFIX } from "@/lib/navigation";

export const AMPLIFIER_TOOLTIP =
  "The amplifier determines the concentration of the pool. Higher values are more suitable for more stable assets, while lower values are more suitable for more volatile assets.";

const getPoolSlug = (appData: AppData, pool: ParsedPool) =>
  `${formatPair(
    pool.coinTypes.map((coinType) => appData.coinMetadataMap[coinType].symbol),
  )}-${QUOTER_ID_NAME_MAP[pool.quoterId]}-${pool.feeTierPercent.times(100)}`;
export const getPoolUrl = (appData: AppData, pool: ParsedPool) =>
  `${POOL_URL_PREFIX}/${pool.id}-${getPoolSlug(appData, pool)}`;

export const getQuoterId = (poolInfo: PoolInfo) =>
  poolInfo.quoterType.endsWith("omm::OracleQuoter")
    ? QuoterId.ORACLE
    : poolInfo.quoterType.endsWith("omm_v2::OracleQuoterV2")
      ? QuoterId.ORACLE_V2
      : QuoterId.CPMM;

export const fetchPool = (steammClient: SteammSDK, poolInfo: PoolInfo) => {
  const id = poolInfo.poolId;
  const quoterId = getQuoterId(poolInfo);

  return quoterId === QuoterId.ORACLE
    ? steammClient.fullClient.fetchOraclePool(id)
    : quoterId === QuoterId.ORACLE_V2
      ? steammClient.fullClient.fetchOracleV2Pool(id)
      : steammClient.fullClient.fetchConstantProductPool(id);
};

export const getPriceFromPool = (pools: AppData["pools"], coinType: string) => {
  const pool = pools.find((p) => p.coinTypes.includes(coinType));
  if (!pool) return undefined;

  return pool.coinTypes[0] === coinType ? pool.prices[0] : pool.prices[1];
};
