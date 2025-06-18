import BigNumber from "bignumber.js";
import { v4 as uuidv4 } from "uuid";

import { Side, getFilteredRewards } from "@suilend/sdk";
import {
  ParsedPool,
  PoolInfo,
  QUOTER_ID_NAME_MAP,
  QuoterId,
  SteammSDK,
} from "@suilend/steamm-sdk";

import { AppData } from "@/contexts/AppContext";
import { StatsContext } from "@/contexts/StatsContext";
import { formatPair } from "@/lib/format";
import {
  getPoolStakingYieldAprPercent,
  getPoolTotalAprPercent,
} from "@/lib/liquidityMining";
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { PoolGroup } from "@/lib/types";

export const AMPLIFIER_TOOLTIP =
  "The amplifier determines the concentration of the pool. Higher values are more suitable for more stable assets, while lower values are more suitable for more volatile assets.";

const getPoolSlug = (appData: AppData, pool: ParsedPool) =>
  `${formatPair(
    pool.coinTypes.map((coinType) => appData.coinMetadataMap[coinType].symbol),
  )}-${QUOTER_ID_NAME_MAP[pool.quoterId]}-${pool.feeTierPercent.times(100)}`;
export const getPoolUrl = (appData: AppData, pool: ParsedPool) =>
  `${POOL_URL_PREFIX}/${pool.id}-${getPoolSlug(appData, pool)}`;

export const fetchPool = (steammClient: SteammSDK, poolInfo: PoolInfo) => {
  const id = poolInfo.poolId;
  const quoterId = poolInfo.quoterType.endsWith("omm::OracleQuoter")
    ? QuoterId.ORACLE
    : poolInfo.quoterType.endsWith("omm_v2::OracleQuoterV2")
      ? QuoterId.ORACLE_V2
      : QuoterId.CPMM;

  return quoterId === QuoterId.ORACLE
    ? steammClient.fullClient.fetchOraclePool(id)
    : quoterId === QuoterId.ORACLE_V2
      ? steammClient.fullClient.fetchOracleV2Pool(id)
      : steammClient.fullClient.fetchConstantProductPool(id);
};

export const getAvgPoolPrice = (
  pools: AppData["pools"],
  coinType: string,
): BigNumber | undefined => {
  const poolPrices = [
    ...pools
      .filter((pool) => pool.coinTypes[0] === coinType)
      .map((pool) => pool.prices[0]),
    ...pools
      .filter((pool) => pool.coinTypes[1] === coinType)
      .map((pool) => pool.prices[1]),
  ];
  if (poolPrices.length === 0) return undefined;

  return poolPrices
    .reduce((acc, poolPrice) => acc.plus(poolPrice), new BigNumber(0))
    .div(poolPrices.length);
};

export const getPoolsWithExtraData = (
  {
    lstAprPercentMap,
    pools,
    normalizedPoolRewardMap,
  }: Pick<AppData, "lstAprPercentMap" | "pools" | "normalizedPoolRewardMap">,
  poolStats: StatsContext["poolStats"],
) =>
  pools.map((pool) => {
    // Same code as in frontend/src/components/AprBreakdown.tsx
    const rewards =
      normalizedPoolRewardMap[pool.lpTokenType]?.[Side.DEPOSIT] ?? [];
    const filteredRewards = getFilteredRewards(rewards);

    const stakingYieldAprPercent: BigNumber = getPoolStakingYieldAprPercent(
      pool,
      lstAprPercentMap,
    );

    return {
      ...pool,
      volumeUsd_24h: poolStats.volumeUsd_24h[pool.id],
      aprPercent_24h:
        poolStats.aprPercent_24h[pool.id] !== undefined &&
        stakingYieldAprPercent !== undefined
          ? getPoolTotalAprPercent(
              poolStats.aprPercent_24h[pool.id].feesAprPercent,
              pool.suilendWeightedAverageDepositAprPercent,
              filteredRewards,
              stakingYieldAprPercent,
            )
          : undefined,
    };
  });

export const getPoolGroups = (
  poolsWithExtraData: ParsedPool[],
): PoolGroup[] => {
  const poolGroupsByPair: Record<string, ParsedPool[]> = {};

  for (const pool of poolsWithExtraData) {
    const key = `${pool.coinTypes[0]}-${pool.coinTypes[1]}`;

    if (!poolGroupsByPair[key]) poolGroupsByPair[key] = [pool];
    else poolGroupsByPair[key].push(pool);
  }

  return Object.values(poolGroupsByPair).map((pools) => ({
    id: uuidv4(),
    coinTypes: pools[0].coinTypes,
    pools,
  }));
};

export const getFilteredPoolGroups = (
  coinMetadataMap: AppData["coinMetadataMap"],
  poolGroups: PoolGroup[],
  searchString: string,
  feeTiers: number[],
  quoterIds: QuoterId[],
) => {
  if (searchString === "" && feeTiers.length === 0 && quoterIds.length === 0)
    return poolGroups;

  return poolGroups
    .filter(
      (poolGroup) =>
        (searchString === "" ||
          [
            poolGroup.pools.map((pool) => pool.id).join("__"),
            poolGroup.coinTypes.join("__"),
            formatPair(
              poolGroup.coinTypes.map(
                (coinType) => coinMetadataMap[coinType].symbol,
              ),
            ),
            formatPair(
              poolGroup.coinTypes.map(
                (coinType) => coinMetadataMap[coinType].symbol,
              ),
              " ",
            ),
          ]
            .join("____")
            .toLowerCase()
            .includes(searchString.toLowerCase())) &&
        (feeTiers.length === 0 ||
          feeTiers.some((feeTier) =>
            poolGroup.pools.some((pool) => pool.feeTierPercent.eq(feeTier)),
          )) &&
        (quoterIds.length === 0 ||
          quoterIds.some((quoterId) =>
            poolGroup.pools.some((pool) => pool.quoterId === quoterId),
          )),
    )
    .map((poolGroup) => ({
      ...poolGroup,
      pools: poolGroup.pools.filter(
        (pool) =>
          (searchString === "" ||
            [
              pool.id,
              pool.coinTypes.join("__"),
              formatPair(
                pool.coinTypes.map(
                  (coinType) => coinMetadataMap[coinType].symbol,
                ),
              ),
              formatPair(
                pool.coinTypes.map(
                  (coinType) => coinMetadataMap[coinType].symbol,
                ),
                " ",
              ),
            ]
              .join("____")
              .toLowerCase()
              .includes(searchString.toLowerCase())) &&
          (feeTiers.length === 0 ||
            feeTiers.some((feeTier) => pool.feeTierPercent.eq(feeTier))) &&
          (quoterIds.length === 0 ||
            quoterIds.some((quoterId) => pool.quoterId === quoterId)),
      ),
    }));
};
