import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID, toHex } from "@mysten/sui/utils";

import { OracleFunctions } from "../_codegen";
import { PriceInfoObject } from "../_codegen/_generated/_dependencies/source/0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e/price-info/structs";
import { getPythPrice } from "../_codegen/oracleFunctions";
import { OracleSwapExtraArgs } from "../base/quoters/oracleQuoter/args";
import { SteammSDK } from "../sdk";
import { OracleInfo, PoolInfo } from "../types";
import { SuiAddressType } from "../utils";

export async function getOracleArgs(
  sdk: SteammSDK,
  tx: Transaction,
  poolInfo: PoolInfo,
): Promise<OracleSwapExtraArgs> {
  const oracleData: OracleInfo[] = await sdk.getOracles();

  const oracleInfoA = oracleData.find(
    (oracle) => oracle.oracleIndex === poolInfo.quoterData?.oracleIndexA,
  );

  if (!oracleInfoA) {
    throw new Error("Oracle info A not found");
  }

  const oracleInfoB = oracleData.find(
    (oracle) => oracle.oracleIndex === poolInfo.quoterData?.oracleIndexB,
  ) as OracleInfo;

  if (!oracleInfoB) {
    throw new Error("Oracle info B not found");
  }

  // assuming oracles are of type pyth
  if (oracleInfoA.oracleType !== "pyth" || oracleInfoB.oracleType !== "pyth") {
    throw new Error("unimplemented: switchboard");
  }

  let priceInfoObjectIdA;
  let priceInfoObjectIdB;
  if (sdk.sdkOptions.enableTestMode) {
    priceInfoObjectIdA = sdk.getMockOraclePriceObject(
      toHex(new Uint8Array(oracleInfoA.oracleIdentifier as number[])),
    );
    priceInfoObjectIdB = sdk.getMockOraclePriceObject(
      toHex(new Uint8Array(oracleInfoB.oracleIdentifier as number[])),
    );
  } else {
    priceInfoObjectIdA = (await sdk.pythClient.getPriceFeedObjectId(
      toHex(new Uint8Array(oracleInfoA.oracleIdentifier as number[])),
    )) as string;
    priceInfoObjectIdB = (await sdk.pythClient.getPriceFeedObjectId(
      toHex(new Uint8Array(oracleInfoB.oracleIdentifier as number[])),
    )) as string;

    console.log("price id from feedA: ", priceInfoObjectIdA);
    console.log("price id from feedB: ", priceInfoObjectIdB);
  }

  const feedIdentifiers: Record<string, string> = {};
  const priceInfoObjectIds: string[] = [];
  const stalePriceIdentifiers: string[] = [];
  priceInfoObjectIds.push(priceInfoObjectIdA);
  priceInfoObjectIds.push(priceInfoObjectIdB);
  feedIdentifiers[priceInfoObjectIdA] = toHex(
    new Uint8Array(oracleInfoA.oracleIdentifier as number[]),
  );
  feedIdentifiers[priceInfoObjectIdB] = toHex(
    new Uint8Array(oracleInfoB.oracleIdentifier as number[]),
  );

  for (const priceInfoObjectId of priceInfoObjectIds) {
    const priceInfoObject = await PriceInfoObject.fetch(
      sdk.fullClient,
      priceInfoObjectId,
    );

    const publishTime = priceInfoObject.priceInfo.priceFeed.price.timestamp;
    // console.log("publishTime: ", publishTime);
    // console.log("Now: ", Date.now() / 1000);
    const stalenessSeconds = Date.now() / 1000 - Number(publishTime);

    // console.log("Date now: ", Date.now() / 1000);
    // console.log("Publish time: ", publishTime);
    // console.log("Staleness: ", stalenessSeconds);
    if (stalenessSeconds > 20) {
      stalePriceIdentifiers.push(feedIdentifiers[priceInfoObjectId]);
    }
  }

  if (stalePriceIdentifiers.length > 0) {
    console.log("PRICE STALE...");
    console.log("identifiers: ", stalePriceIdentifiers);
    const stalePriceUpdateData =
      await sdk.pythConnection.getPriceFeedsUpdateData(stalePriceIdentifiers);
    await sdk.pythClient.updatePriceFeeds(
      tx,
      stalePriceUpdateData,
      stalePriceIdentifiers,
    );
  }

  const oraclePriceA = getPythPrice(
    tx,
    {
      registry: tx.object(
        sdk.sdkOptions.oracleConfig.config?.oracleRegistryId as string,
      ),
      priceInfoObj: tx.object(priceInfoObjectIdA),
      oracleIndex: tx.pure.u64(oracleInfoA.oracleIndex),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    },
    sdk.sdkOptions.oracleConfig.publishedAt,
  );

  const oraclePriceB = getPythPrice(
    tx,
    {
      registry: tx.object(
        sdk.sdkOptions.oracleConfig.config?.oracleRegistryId as string,
      ),
      priceInfoObj: tx.object(priceInfoObjectIdB),
      oracleIndex: tx.pure.u64(oracleInfoB.oracleIndex),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    },
    sdk.sdkOptions.oracleConfig.publishedAt,
  );

  return {
    type: "Oracle",
    oraclePriceA,
    oraclePriceB,
  };
}

export async function initOracleRegistry(
  sdk: SteammSDK,
  tx: Transaction,
  args: {
    pythMaxStalenessThresholdS: number;
    pythMaxConfidenceIntervalPct: number;
    switchboardMaxStalenessThresholdS: number;
    switchboardMaxConfidenceIntervalPct: number;
  },
) {
  const pubAt = sdk.sdkOptions.oracleConfig.publishedAt;
  const pkgId = sdk.sdkOptions.oracleConfig.packageId;

  const config = OracleFunctions.newOracleRegistryConfig(
    tx,
    {
      pythMaxStalenessThresholdS: BigInt(args.pythMaxStalenessThresholdS),
      pythMaxConfidenceIntervalPct: BigInt(args.pythMaxConfidenceIntervalPct),
      switchboardMaxStalenessThresholdS: BigInt(
        args.switchboardMaxStalenessThresholdS,
      ),
      switchboardMaxConfidenceIntervalPct: BigInt(
        args.switchboardMaxConfidenceIntervalPct,
      ),
    },
    pubAt,
  );

  const [oracleRegistry, adminCap] = OracleFunctions.newRegistry(
    tx,
    config,
    pubAt,
  );

  tx.transferObjects([adminCap], sdk.senderAddress);

  tx.moveCall({
    target: `0x2::transfer::public_share_object`,
    typeArguments: [`${pkgId}::oracles::OracleRegistry`],
    arguments: [oracleRegistry],
  });
}

export async function addOracleToRegistry(
  sdk: SteammSDK,
  tx: Transaction,
  args:
    | {
        type: "pyth";
        adminCap: SuiAddressType;
        priceInfoObj: SuiAddressType;
      }
    | {
        type: "switchboard";
        adminCap: SuiAddressType;
        aggregator: SuiAddressType;
      },
) {
  const pubAt = sdk.sdkOptions.oracleConfig.publishedAt;

  switch (args.type) {
    case "pyth":
      OracleFunctions.addPythOracle(
        tx,
        {
          registry: tx.object(
            sdk.sdkOptions.oracleConfig.config!.oracleRegistryId,
          ),
          adminCap: tx.object(args.adminCap),
          priceInfoObj: tx.object(args.priceInfoObj),
        },
        pubAt,
      );
      break;
    case "switchboard":
      throw new Error("Switchboard oracle type not implemented");
    default:
      throw new Error("Unknown oracle type");
  }
}
