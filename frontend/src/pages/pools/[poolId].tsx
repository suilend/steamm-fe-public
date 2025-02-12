import Head from "next/head";
import { useMemo } from "react";

import { useLoadedAppContext } from "@/contexts/AppContext";
import { PoolContextProvider, usePoolContext } from "@/contexts/PoolContext";

function Pool() {
  const { coinMetadataMap } = useLoadedAppContext();
  const { pool } = usePoolContext();
  console.log("XXX", pool);

  // CoinMetadata
  const coinTypes = useMemo(
    () => [...pool.assetCoinTypes],
    [pool.assetCoinTypes],
  );
  const hasCoinMetadata = coinTypes
    .map((coinType) => coinMetadataMap?.[coinType])
    .every(Boolean);

  return (
    <>
      <Head>
        <title>
          STEAMM |{" "}
          {hasCoinMetadata
            ? pool.assetCoinTypes
                .map((coinType) => coinMetadataMap![coinType].symbol)
                .join("/")
            : "Pool"}
        </title>
      </Head>

      <p>Pool page</p>
      <p className="break-all">{JSON.stringify(pool)}</p>
    </>
  );
}

export default function Page() {
  return (
    <PoolContextProvider>
      <Pool />
    </PoolContextProvider>
  );
}
