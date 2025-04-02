import { AppData } from "@/contexts/AppContext";
import { formatPair } from "@/lib/format";
import { ParsedPool, QUOTER_ID_NAME_MAP } from "@/lib/types";

export const getPoolSlug = (appData: AppData, pool: ParsedPool) =>
  `${formatPair(
    pool.coinTypes.map((coinType) => appData.coinMetadataMap[coinType].symbol),
  )}-${QUOTER_ID_NAME_MAP[pool.quoterId]}-${pool.feeTierPercent.times(100)}`;
